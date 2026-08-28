#requires -Version 5.1
$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$HymnsPath = Join-Path $Root "hymns.js"

if (-not (Test-Path $HymnsPath)) {
    Write-Host "ERROR: hymns.js not found." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupPath = Join-Path $Root ("hymns_backup_" + $stamp + ".js")
$ReportPath = Join-Path $Root ("linebreak_report_supplement_v15_" + $stamp + ".csv")

Copy-Item $HymnsPath $BackupPath -Force
Write-Host ""
Write-Host "已備份：" -ForegroundColor Cyan
Write-Host $BackupPath
Write-Host ""

# -----------------------------
# Read hymns array only
# -----------------------------
$raw = Get-Content $HymnsPath -Raw -Encoding UTF8

$match = [regex]::Match(
    $raw,
    '(?s)^\s*const\s+hymns\s*=\s*(\[.*?\])\s*;'
)

if (-not $match.Success) {
    Write-Host "找不到 hymns 陣列，沒有修改原檔。" -ForegroundColor Red
    Read-Host "按 Enter 結束"
    exit 1
}

$json = $match.Groups[1].Value
$prefix = $raw.Substring(0, $match.Index)
$suffixStart = $match.Index + $match.Length
$suffix = $raw.Substring($suffixStart)

try {
    $data = $json | ConvertFrom-Json
}
catch {
    Write-Host "hymns 陣列無法解析，沒有修改原檔。" -ForegroundColor Red
    Write-Host $_.Exception.Message
    Read-Host "按 Enter 結束"
    exit 1
}

# -----------------------------
# Helpers
# -----------------------------
function Html-ToText([string]$html) {
    if ([string]::IsNullOrWhiteSpace($html)) {
        return ""
    }

    $s = $html

    $s = [regex]::Replace(
        $s,
        '(?is)<script\b[^>]*>.*?</script>',
        ''
    )

    $s = [regex]::Replace(
        $s,
        '(?is)<style\b[^>]*>.*?</style>',
        ''
    )

    $s = [regex]::Replace(
        $s,
        '(?is)<br\s*/?>',
        "`n"
    )

    $s = [regex]::Replace(
        $s,
        '(?is)</(p|div|li|h1|h2|h3|h4|h5|h6|tr|section|article|blockquote)>',
        "`n"
    )

    $s = [regex]::Replace(
        $s,
        '(?is)<[^>]+>',
        ''
    )

    $s = [System.Net.WebUtility]::HtmlDecode($s)
    $s = $s.Replace([char]0x00A0, ' ')

    return $s
}

function Normalize-CompareChar([char]$c) {
    if ([char]::IsWhiteSpace($c)) {
        return [char]0
    }

    switch ([int][char]$c) {
        0x88CF { return [char]0x88E1 } # 裏 -> 裡
        0x7232 { return [char]0x70BA } # 爲 -> 為
        0x81FA { return [char]0x53F0 } # 臺 -> 台
        0x2014 { return '-' }
        0x2013 { return '-' }
        0x2212 { return '-' }
        0xFF0D { return '-' }
        0x3001 { return ',' }          # 、 -> ,
        0xFF0C { return ',' }          # ， -> ,
        0x002C { return ',' }
        0xFF1B { return ';' }
        0x003B { return ';' }
        0x3002 { return '.' }
        0xFF01 { return '!' }
        0xFF1A { return ':' }
        0xFF1F { return '?' }
        default { return $c }
    }
}

function Normalize-Compact([string]$s) {
    if ($null -eq $s) {
        return ""
    }

    $sb = New-Object System.Text.StringBuilder

    foreach ($c in $s.ToCharArray()) {
        $n = Normalize-CompareChar $c

        if ([int][char]$n -ne 0) {
            [void]$sb.Append($n)
        }
    }

    return $sb.ToString()
}

function Get-PageLines([int]$code) {
    $url = "https://www.hymnal.net/zh/hymn/ts/$code"
    $html = $null

    for ($try = 1; $try -le 3; $try++) {
        try {
            $response = Invoke-WebRequest `
                -Uri $url `
                -UseBasicParsing `
                -TimeoutSec 25 `
                -Headers @{
                    "User-Agent" = "Mozilla/5.0 hymn-linebreak-checker"
                }

            $html = $response.Content
            break
        }
        catch {
            if ($try -lt 3) {
                Start-Sleep -Milliseconds (600 * $try)
            }
        }
    }

    if ([string]::IsNullOrWhiteSpace($html)) {
        return $null
    }

    $text = Html-ToText $html

    $lines = @(
        $text -split "`r?`n" |
        ForEach-Object {
            ($_ -replace '\s+', ' ').Trim()
        } |
        Where-Object {
            -not [string]::IsNullOrWhiteSpace($_)
        }
    )

    return [pscustomobject]@{
        Url = $url
        Lines = $lines
    }
}

function Score-Compact(
    [string]$a,
    [string]$b
) {
    if (
        [string]::IsNullOrWhiteSpace($a) -or
        [string]::IsNullOrWhiteSpace($b)
    ) {
        return 0.0
    }

    $maxLen = [Math]::Max($a.Length, $b.Length)
    $minLen = [Math]::Min($a.Length, $b.Length)

    if ($maxLen -eq 0) {
        return 0.0
    }

    $same = 0

    for ($i = 0; $i -lt $minLen; $i++) {
        if ($a[$i] -eq $b[$i]) {
            $same++
        }
    }

    return $same / [double]$maxLen
}

function Find-BestReferenceLines(
    [string[]]$pageLines,
    [string]$localText
) {
    $target = Normalize-Compact $localText

    if ($target.Length -lt 2) {
        return $null
    }

    $probeLength =
        [Math]::Min(
            6,
            $target.Length
        )

    $probe =
        $target.Substring(
            0,
            $probeLength
        )

    $bestScore = 0.0
    $bestLines = $null

    <#
      v12 效能修正：

      v11 會從網頁每一行都開始嘗試，頁面很長時會非常慢。
      v12 只從「開頭和本機歌詞前 4~6 個有效字相符」的行開始比對。

      例如本機：
        但願榮耀歸於聖父，並聖子基督...

      只會從 hymnal.net 上以：
        但願榮耀...
      開頭的候選行開始，不再掃整個頁面的每個起點。
    #>

    $candidateStarts =
        New-Object System.Collections.Generic.List[int]

    for (
        $start = 0;
        $start -lt $pageLines.Count;
        $start++
    ) {

        $normStart =
            Normalize-Compact $pageLines[$start]

        if (
            $normStart.Length -lt 2
        ) {
            continue
        }

        $compareLen =
            [Math]::Min(
                $probeLength,
                $normStart.Length
            )

        if (
            $compareLen -lt 2
        ) {
            continue
        }

        if (
            $normStart.Substring(
                0,
                $compareLen
            ) -eq
            $probe.Substring(
                0,
                $compareLen
            )
        ) {
            [void]$candidateStarts.Add(
                $start
            )
        }

    }


    # 若 6 字前綴找不到，退一步用前 3 個有效字。
    if (
        $candidateStarts.Count -eq 0
    ) {

        $fallbackLen =
            [Math]::Min(
                3,
                $target.Length
            )

        $fallbackProbe =
            $target.Substring(
                0,
                $fallbackLen
            )

        for (
            $start = 0;
            $start -lt $pageLines.Count;
            $start++
        ) {

            $normStart =
                Normalize-Compact $pageLines[$start]

            if (
                $normStart.Length -ge
                $fallbackLen -and
                $normStart.Substring(
                    0,
                    $fallbackLen
                ) -eq
                $fallbackProbe
            ) {
                [void]$candidateStarts.Add(
                    $start
                )
            }

        }

    }


    foreach ($start in $candidateStarts) {

        $candidateLines =
            New-Object System.Collections.Generic.List[string]

        $sb =
            New-Object System.Text.StringBuilder

        for (
            $i = $start;
            $i -lt $pageLines.Count;
            $i++
        ) {

            $line = $pageLines[$i]

            if (
                $line -match '^(Contact Us|聯繫我們|Delete Comment|名字|電子郵件|城市|州/省|國家|您的留言)$'
            ) {
                break
            }

            $normLine =
                Normalize-Compact $line

            if (
                $normLine.Length -eq 0
            ) {
                continue
            }

            [void]$candidateLines.Add(
                $line
            )

            [void]$sb.Append(
                $normLine
            )

            $cand =
                $sb.ToString()

            if (
                $cand.Length -ge
                [Math]::Max(
                    2,
                    [Math]::Floor(
                        $target.Length * 0.82
                    )
                )
            ) {

                $score =
                    Score-Compact `
                        $cand `
                        $target

                if (
                    $score -gt
                    $bestScore
                ) {

                    $bestScore =
                        $score

                    $bestLines =
                        $candidateLines.ToArray()

                }

            }

            if (
                $cand.Length -gt
                ($target.Length * 1.18 + 24)
            ) {
                break
            }

        }

    }


    if (
        $null -eq $bestLines -or
        $bestScore -lt 0.90
    ) {
        return $null
    }


    return [pscustomobject]@{
        Score = $bestScore
        Lines = $bestLines
    }
}


function Transfer-LineBreaks(
    [string]$originalText,
    [string[]]$referenceLines
) {
    $origFlat =
        ($originalText -replace "`r", "") -replace "`n", ""

    $origChars = $origFlat.ToCharArray()
    $oi = 0
    $matched = 0
    $refMeaningful = 0
    $breakAfter =
        New-Object System.Collections.Generic.List[int]

    foreach ($line in $referenceLines) {
        $lineHadComparableChar = $false

        foreach ($rc in $line.ToCharArray()) {
            $rn = Normalize-CompareChar $rc

            if ([int][char]$rn -eq 0) {
                continue
            }

            $refMeaningful++
            $lineHadComparableChar = $true

            while (
                $oi -lt $origChars.Length -and
                [int][char](Normalize-CompareChar $origChars[$oi]) -eq 0
            ) {
                $oi++
            }

            if ($oi -ge $origChars.Length) {
                continue
            }

            $on = Normalize-CompareChar $origChars[$oi]

            if ($on -eq $rn) {
                $matched++
                $oi++
                continue
            }

            $found = -1

            for (
                $k = $oi + 1;
                $k -lt [Math]::Min($origChars.Length, $oi + 19);
                $k++
            ) {
                $kn = Normalize-CompareChar $origChars[$k]

                if ($kn -eq $rn) {
                    $found = $k
                    break
                }
            }

            if ($found -ge 0) {
                $oi = $found + 1
                $matched++
            }
        }

        if ($lineHadComparableChar) {
            [void]$breakAfter.Add($oi)
        }
    }

    $origMeaningful = (Normalize-Compact $origFlat).Length

    if (
        $refMeaningful -eq 0 -or
        $origMeaningful -eq 0
    ) {
        return $null
    }

    $similarity =
        $matched /
        [double](
            [Math]::Max(
                $refMeaningful,
                $origMeaningful
            )
        )

    if ($similarity -lt 0.90) {
        return $null
    }

    $breakSet =
        New-Object 'System.Collections.Generic.HashSet[int]'

    foreach ($b in $breakAfter) {
        if (
            $b -gt 0 -and
            $b -le $origFlat.Length
        ) {
            [void]$breakSet.Add($b)
        }
    }

    $sb =
        New-Object System.Text.StringBuilder

    for ($i = 0; $i -lt $origFlat.Length; $i++) {
        [void]$sb.Append($origFlat[$i])

        $pos = $i + 1

        if (
            $breakSet.Contains($pos) -and
            $pos -lt $origFlat.Length
        ) {
            [void]$sb.Append("`n")
        }
    }

    return [pscustomobject]@{
        Similarity = $similarity
        Text = $sb.ToString().Trim()
    }
}

function Split-Stanzas([string]$body) {
    $lines = $body -split "`r?`n"
    $items = New-Object System.Collections.Generic.List[object]
    $currentNumber = $null
    $currentLines = New-Object System.Collections.Generic.List[string]

    foreach ($line in $lines) {
        $trim = $line.Trim()

        if ($trim -match '^\d+$') {
            if ($null -ne $currentNumber) {
                [void]$items.Add(
                    [pscustomobject]@{
                        Number = $currentNumber
                        Lines = $currentLines.ToArray()
                    }
                )
            }

            $currentNumber = $trim
            $currentLines =
                New-Object System.Collections.Generic.List[string]

            continue
        }

        if ($null -ne $currentNumber) {
            [void]$currentLines.Add($line)
        }
    }

    if ($null -ne $currentNumber) {
        [void]$items.Add(
            [pscustomobject]@{
                Number = $currentNumber
                Lines = $currentLines.ToArray()
            }
        )
    }

    return $items.ToArray()
}

function Process-Stanza(
    [object]$stanza,
    [string[]]$pageLines,
    [hashtable]$chorusCache
) {
    $lines = @($stanza.Lines)

    while (
        $lines.Count -gt 0 -and
        [string]::IsNullOrWhiteSpace($lines[0])
    ) {
        $lines = @($lines[1..($lines.Count - 1)])
    }

    while (
        $lines.Count -gt 0 -and
        [string]::IsNullOrWhiteSpace($lines[$lines.Count - 1])
    ) {
        if ($lines.Count -eq 1) {
            $lines = @()
        }
        else {
            $lines = @($lines[0..($lines.Count - 2)])
        }
    }

    $chorusIndex = -1

    for ($i = 0; $i -lt $lines.Count; $i++) {
        if ($lines[$i].Trim() -match '^[（(]副[）)]$') {
            $chorusIndex = $i
            break
        }
    }

    if ($chorusIndex -ge 0) {
        $mainLines = @()

        if ($chorusIndex -gt 0) {
            $mainLines = @($lines[0..($chorusIndex - 1)])
        }

        $chorusLines = @()

        if ($chorusIndex + 1 -lt $lines.Count) {
            $chorusLines = @($lines[($chorusIndex + 1)..($lines.Count - 1)])
        }

        $mainText = ($mainLines -join "`n").Trim()
        $chorusText = ($chorusLines -join "`n").Trim()

        $mainResult = $null

        if (-not [string]::IsNullOrWhiteSpace($mainText)) {
            $mainRef =
                Find-BestReferenceLines `
                    -pageLines $pageLines `
                    -localText $mainText

            if ($null -eq $mainRef) {
                return $null
            }

            $mainResult =
                Transfer-LineBreaks `
                    -originalText $mainText `
                    -referenceLines $mainRef.Lines

            if ($null -eq $mainResult) {
                return $null
            }
        }

        $chorusResult = $null

        if (-not [string]::IsNullOrWhiteSpace($chorusText)) {
            $chorusKey = Normalize-Compact $chorusText

            if ($chorusCache.ContainsKey($chorusKey)) {
                $chorusResult = $chorusCache[$chorusKey]
            }
            else {
                $chorusRef =
                    Find-BestReferenceLines `
                        -pageLines $pageLines `
                        -localText $chorusText

                if ($null -eq $chorusRef) {
                    return $null
                }

                $chorusResult =
                    Transfer-LineBreaks `
                        -originalText $chorusText `
                        -referenceLines $chorusRef.Lines

                if ($null -eq $chorusResult) {
                    return $null
                }

                $chorusCache[$chorusKey] = $chorusResult
            }
        }

        $parts = New-Object System.Collections.Generic.List[string]

        [void]$parts.Add([string]$stanza.Number)

        if ($null -ne $mainResult) {
            [void]$parts.Add($mainResult.Text)
        }

        [void]$parts.Add("（副）")

        if ($null -ne $chorusResult) {
            [void]$parts.Add($chorusResult.Text)
        }

        return [pscustomobject]@{
            Text = ($parts -join "`n")
            Score = 1.0
        }
    }

    $plainText = ($lines -join "`n").Trim()

    if ([string]::IsNullOrWhiteSpace($plainText)) {
        return $null
    }

    $ref =
        Find-BestReferenceLines `
            -pageLines $pageLines `
            -localText $plainText

    if ($null -eq $ref) {
        return $null
    }

    $result =
        Transfer-LineBreaks `
            -originalText $plainText `
            -referenceLines $ref.Lines

    if ($null -eq $result) {
        return $null
    }

    return [pscustomobject]@{
        Text =
            ([string]$stanza.Number) +
            "`n" +
            $result.Text
        Score = $result.Similarity
    }
}

function Process-Hymn(
    [object]$hymn,
    [string[]]$pageLines
) {
    $lyrics = [string]$hymn.lyrics
    $origLines = $lyrics -split "`r?`n"

    $firstStanza = -1

    for ($i = 0; $i -lt $origLines.Count; $i++) {
        if ($origLines[$i].Trim() -eq "1") {
            $firstStanza = $i
            break
        }
    }

    if ($firstStanza -lt 0) {
        return $null
    }

    $header = ""

    if ($firstStanza -gt 0) {
        $header =
            ($origLines[0..($firstStanza - 1)] -join "`n").TrimEnd()
    }

    $body =
        (
            $origLines[
                $firstStanza..
                ($origLines.Count - 1)
            ] -join "`n"
        )

    $stanzas = Split-Stanzas $body

    if ($stanzas.Count -eq 0) {
        return $null
    }

    $chorusCache = @{}
    $rebuilt = New-Object System.Collections.Generic.List[string]
    $scores = New-Object System.Collections.Generic.List[double]

    foreach ($stanza in $stanzas) {
        $processed =
            Process-Stanza `
                -stanza $stanza `
                -pageLines $pageLines `
                -chorusCache $chorusCache

        if ($null -eq $processed) {
            return $null
        }

        [void]$rebuilt.Add($processed.Text)
        [void]$scores.Add([double]$processed.Score)
    }

    $newBody = $rebuilt -join "`n`n"

    if ([string]::IsNullOrWhiteSpace($header)) {
        $newLyrics = $newBody.TrimEnd() + "`n"
    }
    else {
        $newLyrics =
            $header +
            "`n" +
            $newBody.TrimEnd() +
            "`n"
    }

    $avg = 0.0

    if ($scores.Count -gt 0) {
        $sum = 0.0

        foreach ($s in $scores) {
            $sum += $s
        }

        $avg = $sum / [double]$scores.Count
    }

    return [pscustomobject]@{
        Lyrics = $newLyrics
        Similarity = $avg
    }
}

# -----------------------------
# Preflight
# -----------------------------
function Test-One([int]$code) {
    Write-Host ("  Cs{0}: 讀取本機資料..." -f $code) -ForegroundColor DarkGray

    $hymn =
        $data |
        Where-Object {
            [int]$_.book -eq 2 -and
            [int]$_.code -eq $code
        } |
        Select-Object -First 1

    if ($null -eq $hymn) {
        return [pscustomobject]@{
            Code = $code
            Success = $false
            Score = 0
        }
    }

    Write-Host ("  Cs{0}: 正在下載 hymnal.net..." -f $code) -ForegroundColor DarkGray

    $page = Get-PageLines $code

    if ($null -eq $page) {
        return [pscustomobject]@{
            Code = $code
            Success = $false
            Score = 0
        }
    }

    Write-Host ("  Cs{0}: 網頁下載完成，正在逐節比對..." -f $code) -ForegroundColor DarkGray

    $processed =
        Process-Hymn `
            -hymn $hymn `
            -pageLines $page.Lines

    if ($null -eq $processed) {
        return [pscustomobject]@{
            Code = $code
            Success = $false
            Score = 0
        }
    }

    return [pscustomobject]@{
        Code = $code
        Success = $true
        Score = [Math]::Round($processed.Similarity * 100, 1)
    }
}

Write-Host "先抽查補充本 Cs1、Cs2、Cs3、Cs10、Cs1005..." -ForegroundColor Cyan
Write-Host "注意：預檢只作提示；若某首歌詞版本不同，會跳過該首，不會停止整本。" -ForegroundColor DarkGray
Write-Host ""

$tests = @(
    Test-One 1
    Test-One 2
    Test-One 3
    Test-One 10
    Test-One 1005
)

foreach ($t in $tests) {
    if ($t.Success -and $t.Score -ge 90) {
        Write-Host ("Cs{0}: {1}% OK" -f $t.Code, $t.Score) -ForegroundColor Green
    }
    else {
        Write-Host ("Cs{0}: 歌詞版本不同／無法安全比對，正式處理時只跳過這一首" -f $t.Code) -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "開始處理補充本（book 2）全部現有歌曲。" -ForegroundColor Green
Write-Host "規則：可安全比對就只修正換行；版本不同就保留原文並列入報告。" -ForegroundColor Green
Write-Host ""

# -----------------------------
# Main
# -----------------------------
$report =
    New-Object System.Collections.Generic.List[object]

$changed = 0
$skipped = 0
$failed = 0
$versionDifferent = 0

$targets = @(
    $data |
    Where-Object {
        [int]$_.book -eq 2
    } |
    Sort-Object {
        [int]$_.code
    }
)

$done = 0

foreach ($hymn in $targets) {
    $code = [int]$hymn.code
    $done++

    Write-Progress `
        -Activity "正在比對補充本 Cs 詩歌" `
        -Status ("Cs{0} ({1}/{2})" -f $code, $done, $targets.Count) `
        -PercentComplete (($done / [double]$targets.Count) * 100)

    try {
        $page = Get-PageLines $code

        if ($null -eq $page) {
            $failed++

            [void]$report.Add(
                [pscustomobject]@{
                    code = $code
                    status = "抓取失敗"
                    similarity = ""
                    url = "https://www.hymnal.net/zh/hymn/ts/$code"
                }
            )

            Write-Host ("Cs{0}: 抓取失敗，跳過" -f $code) -ForegroundColor Yellow
            continue
        }

        $processed =
            Process-Hymn `
                -hymn $hymn `
                -pageLines $page.Lines

        if ($null -eq $processed) {
            $skipped++
            $versionDifferent++

            [void]$report.Add(
                [pscustomobject]@{
                    code = $code
                    status = "歌詞版本不同，未修改"
                    similarity = ""
                    url = $page.Url
                }
            )

            Write-Host ("Cs{0}: 歌詞版本不同，跳過；保留原歌詞" -f $code) -ForegroundColor Yellow
            continue
        }

        $score =
            [Math]::Round(
                $processed.Similarity * 100,
                1
            )

        if ($processed.Lyrics -ne [string]$hymn.lyrics) {
            $hymn.lyrics = $processed.Lyrics
            $changed++
            $status = "已修正換行"
        }
        else {
            $skipped++
            $status = "原本已一致"
        }

        [void]$report.Add(
            [pscustomobject]@{
                code = $code
                status = $status
                similarity = "$score%"
                url = $page.Url
            }
        )

        Write-Host ("Cs{0}: {1}（{2}%）" -f $code, $status, $score)

        Start-Sleep -Milliseconds 160
    }
    catch {
        $failed++

        [void]$report.Add(
            [pscustomobject]@{
                code = $code
                status = "錯誤：" + $_.Exception.Message
                similarity = ""
                url = "https://www.hymnal.net/zh/hymn/ts/$code"
            }
        )

        Write-Host ("Cs{0}: 發生錯誤，跳過" -f $code) -ForegroundColor Yellow
    }
}

Write-Progress -Activity "正在比對補充本 Cs 詩歌" -Completed

# -----------------------------
# Write back
# -----------------------------
try {
    $newJson = $data | ConvertTo-Json -Depth 20

    $newFile =
        $prefix +
        "const hymns =" +
        "`r`n" +
        $newJson +
        ";" +
        $suffix

    $utf8NoBom =
        New-Object System.Text.UTF8Encoding($false)

    [System.IO.File]::WriteAllText(
        $HymnsPath,
        $newFile,
        $utf8NoBom
    )

    $report |
        Export-Csv `
            -Path $ReportPath `
            -NoTypeInformation `
            -Encoding UTF8
}
catch {
    Write-Host "寫入失敗，正在還原備份..." -ForegroundColor Red
    Copy-Item $BackupPath $HymnsPath -Force
    Read-Host "按 Enter 結束"
    exit 1
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "完成" -ForegroundColor Green
Write-Host ("已修正：{0} 首" -f $changed)
Write-Host ("未修改/跳過：{0} 首" -f $skipped)
Write-Host ("其中歌詞版本不同：{0} 首" -f $versionDifferent) -ForegroundColor Yellow
Write-Host ("抓取/程式失敗：{0} 首" -f $failed)
Write-Host ""
Write-Host "備份：" -ForegroundColor Cyan
Write-Host $BackupPath
Write-Host ""
Write-Host "報告：" -ForegroundColor Cyan
Write-Host $ReportPath
Write-Host "============================================"
Write-Host ""
Read-Host "按 Enter 關閉"
