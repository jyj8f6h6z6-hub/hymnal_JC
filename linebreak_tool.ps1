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
$ReportPath = Join-Path $Root ("linebreak_report_supplement_v18_" + $stamp + ".csv")

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


function Normalize-LooseChar([char]$c) {
    if ([char]::IsWhiteSpace($c)) {
        return [char]0
    }

    switch ([int][char]$c) {
        0x88CF { return [char]0x88E1 } # 裏 -> 裡
        0x7232 { return [char]0x70BA } # 爲 -> 為
        0x81FA { return [char]0x53F0 } # 臺 -> 台

        # 常見標點、引號、括號、破折號：比較時忽略
        0x3001 { return [char]0 } # 、
        0x3002 { return [char]0 } # 。
        0xFF0C { return [char]0 } # ，
        0xFF1B { return [char]0 } # ；
        0xFF1A { return [char]0 } # ：
        0xFF01 { return [char]0 } # ！
        0xFF1F { return [char]0 } # ？
        0x002C { return [char]0 }
        0x002E { return [char]0 }
        0x003B { return [char]0 }
        0x003A { return [char]0 }
        0x0021 { return [char]0 }
        0x003F { return [char]0 }
        0x2014 { return [char]0 }
        0x2013 { return [char]0 }
        0x2212 { return [char]0 }
        0xFF0D { return [char]0 }
        0x2500 { return [char]0 }
        0x2018 { return [char]0 }
        0x2019 { return [char]0 }
        0x201C { return [char]0 }
        0x201D { return [char]0 }
        0x0022 { return [char]0 }
        0x0027 { return [char]0 }
        0x300C { return [char]0 }
        0x300D { return [char]0 }
        0x300E { return [char]0 }
        0x300F { return [char]0 }
        0xFF08 { return [char]0 }
        0xFF09 { return [char]0 }
        0x0028 { return [char]0 }
        0x0029 { return [char]0 }
        0x3010 { return [char]0 }
        0x3011 { return [char]0 }

        default { return $c }
    }
}

function Normalize-Loose([string]$s) {
    if ($null -eq $s) {
        return ""
    }

    $sb = New-Object System.Text.StringBuilder

    foreach ($c in $s.ToCharArray()) {
        $n = Normalize-LooseChar $c

        if ([int][char]$n -ne 0) {
            [void]$sb.Append($n)
        }
    }

    return $sb.ToString()
}


function Get-SimilarityScore(
    [string]$a,
    [string]$b
) {
    if ($null -eq $a) { $a = "" }
    if ($null -eq $b) { $b = "" }

    if ($a -eq $b) {
        return 1.0
    }

    if ($a.Length -eq 0 -or $b.Length -eq 0) {
        return 0.0
    }

    # Dynamic-programming Levenshtein distance.
    $prev = New-Object int[] ($b.Length + 1)
    $curr = New-Object int[] ($b.Length + 1)

    for ($j = 0; $j -le $b.Length; $j++) {
        $prev[$j] = $j
    }

    for ($i = 1; $i -le $a.Length; $i++) {
        $curr[0] = $i

        for ($j = 1; $j -le $b.Length; $j++) {
            $cost =
                if ($a[$i - 1] -eq $b[$j - 1]) {
                    0
                }
                else {
                    1
                }

            $delete = $prev[$j] + 1
            $insert = $curr[$j - 1] + 1
            $subst = $prev[$j - 1] + $cost

            $curr[$j] =
                [Math]::Min(
                    [Math]::Min($delete, $insert),
                    $subst
                )
        }

        $tmpRow = $prev
        $prev = $curr
        $curr = $tmpRow
    }

    $distance = $prev[$b.Length]
    $maxLen = [Math]::Max($a.Length, $b.Length)

    return 1.0 - ($distance / [double]$maxLen)
}

function Get-LooseLineMap(
    [string[]]$pageLines
) {
    $items =
        New-Object System.Collections.Generic.List[object]

    foreach ($line in $pageLines) {
        $norm = Normalize-Loose $line

        if ($norm.Length -eq 0) {
            continue
        }

        [void]$items.Add(
            [pscustomobject]@{
                Original = $line
                Norm = $norm
            }
        )
    }

    return $items.ToArray()
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
    $target = Normalize-Loose $localText

    if ($target.Length -lt 2) {
        return $null
    }

    $items = Get-LooseLineMap $pageLines

    if ($items.Count -eq 0) {
        return $null
    }

    $bestScore = 0.0
    $bestBreaks = $null

    # Fast exact path first.
    $pageSb =
        New-Object System.Text.StringBuilder

    $lineEnds =
        New-Object System.Collections.Generic.List[int]

    foreach ($item in $items) {
        [void]$pageSb.Append($item.Norm)
        [void]$lineEnds.Add($pageSb.Length)
    }

    $pageText = $pageSb.ToString()

    $exactIndex =
        $pageText.LastIndexOf(
            $target,
            [System.StringComparison]::Ordinal
        )

    if ($exactIndex -ge 0) {
        $exactEnd =
            $exactIndex + $target.Length

        $breakCounts =
            New-Object System.Collections.Generic.List[int]

        foreach ($lineEnd in $lineEnds) {
            if (
                $lineEnd -gt $exactIndex -and
                $lineEnd -lt $exactEnd
            ) {
                [void]$breakCounts.Add(
                    $lineEnd - $exactIndex
                )
            }
        }

        return [pscustomobject]@{
            Score = 1.0
            BreakCounts = $breakCounts.ToArray()
        }
    }

    # v18 tolerant path:
    # compare each contiguous group of hymnal.net lines against
    # the local stanza after removing line breaks/punctuation.
    #
    # Only accept >= 95% similarity.
    $minAccept = 0.95

    for ($start = 0; $start -lt $items.Count; $start++) {
        $sb =
            New-Object System.Text.StringBuilder

        $breaks =
            New-Object System.Collections.Generic.List[int]

        for ($i = $start; $i -lt $items.Count; $i++) {
            if ($sb.Length -gt 0) {
                [void]$breaks.Add($sb.Length)
            }

            [void]$sb.Append($items[$i].Norm)

            $cand = $sb.ToString()

            # Too short: keep extending.
            if (
                $cand.Length -lt
                [Math]::Max(
                    2,
                    [Math]::Floor($target.Length * 0.82)
                )
            ) {
                continue
            }

            $score =
                Get-SimilarityScore `
                    $target `
                    $cand

            if ($score -gt $bestScore) {
                $bestScore = $score
                $bestBreaks = $breaks.ToArray()
            }

            # Once candidate is much longer than target,
            # extending further is unlikely to improve.
            if (
                $cand.Length -gt
                [Math]::Ceiling($target.Length * 1.18 + 12)
            ) {
                break
            }
        }
    }

    if (
        $null -eq $bestBreaks -or
        $bestScore -lt $minAccept
    ) {
        return $null
    }

    return [pscustomobject]@{
        Score = $bestScore
        BreakCounts = $bestBreaks
    }
}


function Transfer-LineBreaks(
    [string]$originalText,
    [int[]]$breakCounts
) {
    if ([string]::IsNullOrWhiteSpace($originalText)) {
        return $null
    }

    $origFlat =
        ($originalText -replace "`r", "") -replace "`n", ""

    $meaningfulTotal =
        (Normalize-Loose $origFlat).Length

    if ($meaningfulTotal -eq 0) {
        return $null
    }

    $wanted =
        New-Object 'System.Collections.Generic.HashSet[int]'

    foreach ($b in $breakCounts) {
        if (
            $b -gt 0 -and
            $b -lt $meaningfulTotal
        ) {
            [void]$wanted.Add([int]$b)
        }
    }

    $rawBreaks =
        New-Object 'System.Collections.Generic.HashSet[int]'

    $count = 0

    for ($i = 0; $i -lt $origFlat.Length; $i++) {
        $n = Normalize-LooseChar $origFlat[$i]

        if ([int][char]$n -ne 0) {
            $count++
        }

        if ($wanted.Contains($count)) {
            # hymnal.net 的行界可能落在字後。
            # 把本機緊接在這個字後面的標點一起留在該行，
            # 直到下一個真正文字字元之前才斷行。
            $j = $i + 1

            while ($j -lt $origFlat.Length) {
                $nextNorm =
                    Normalize-LooseChar $origFlat[$j]

                if ([int][char]$nextNorm -ne 0) {
                    break
                }

                $j++
            }

            if ($j -gt 0 -and $j -lt $origFlat.Length) {
                [void]$rawBreaks.Add($j)
            }
        }
    }

    $sb =
        New-Object System.Text.StringBuilder

    for ($i = 0; $i -lt $origFlat.Length; $i++) {
        if (
            $i -gt 0 -and
            $rawBreaks.Contains($i)
        ) {
            [void]$sb.Append("`n")
        }

        [void]$sb.Append($origFlat[$i])
    }

    return [pscustomobject]@{
        Similarity = 1.0
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
        if ($lines[$i].Trim() -match '^[（(]副[^）)]*[）)]$') {
            $chorusIndex = $i
            break
        }
    }

    if ($chorusIndex -ge 0) {
        $chorusMarker = $lines[$chorusIndex].Trim()
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
                    -breakCounts $mainRef.BreakCounts

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

                if ($null -ne $chorusRef) {
                    $chorusResult =
                        Transfer-LineBreaks `
                            -originalText $chorusText `
                            -breakCounts $chorusRef.BreakCounts

                    if ($null -ne $chorusResult) {
                        $chorusCache[$chorusKey] = $chorusResult
                    }
                }
            }
        }

        $parts = New-Object System.Collections.Generic.List[string]

        [void]$parts.Add([string]$stanza.Number)

        if ($null -ne $mainResult) {
            [void]$parts.Add($mainResult.Text)
        }

        [void]$parts.Add($chorusMarker)

        $chorusPreserved = $false

        if ($null -ne $chorusResult) {
            [void]$parts.Add($chorusResult.Text)
        }
        elseif (-not [string]::IsNullOrWhiteSpace($chorusText)) {
            # hymnal.net 常只列一次副歌，或副歌文字版本略有不同。
            # 這種情況不讓整首失敗；保留本機副歌原文與原換行。
            [void]$parts.Add($chorusText)
            $chorusPreserved = $true
        }

        return [pscustomobject]@{
            Text = ($parts -join "`n")
            Score = 1.0
            ChorusPreserved = $chorusPreserved
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
            -breakCounts $ref.BreakCounts

    if ($null -eq $result) {
        return $null
    }

    return [pscustomobject]@{
        Text =
            ([string]$stanza.Number) +
            "`n" +
            $result.Text
        Score = $result.Similarity
        ChorusPreserved = $false
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
    $preservedChorusCount = 0

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

        if ($processed.ChorusPreserved) {
            $preservedChorusCount++
        }
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
        PreservedChorusCount = $preservedChorusCount
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
# v18：只處理 v18 判定版本不同的 152 首
# -----------------------------
$focusCodes = @(
    3, 31, 33, 34, 37, 104, 122, 138, 139, 141, 148, 149, 205, 211, 237, 248, 249, 250, 251, 252, 253, 254, 256, 257, 258, 314, 330, 331, 332, 334, 336, 337, 338, 339, 340, 342, 348, 418, 427, 432, 436, 438, 439, 440, 444, 445, 449, 451, 452, 453, 454, 455, 458, 460, 461, 462, 463, 466, 469, 470, 503, 506, 508, 513, 531, 534, 539, 540, 541, 616, 618, 621, 623, 626, 627, 628, 754, 755, 756, 759, 762, 822, 824, 842, 852, 857, 858, 859, 860, 862, 865, 867, 870, 871, 872, 875, 878, 880, 903, 907, 916, 917, 921, 922, 924, 926, 930
)

Write-Host ""
Write-Host "v18 只重新處理 v18 的 152 首版本不同歌曲。" -ForegroundColor Cyan
Write-Host "副歌若 hymnal.net 未重複列出，或副歌文字版本不同，會保留本機副歌，不再讓整首失敗。" -ForegroundColor Cyan
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
$chorusPreservedSongs = 0

$targets = @(
    $data |
    Where-Object {
        [int]$_.book -eq 2 -and
        $focusCodes -contains [int]$_.code
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
                    status = "相似度低於95%，未修改"
                    similarity = ""
                    url = $page.Url
                }
            )

            Write-Host ("Cs{0}: 相似度低於95%，跳過；保留原歌詞" -f $code) -ForegroundColor Yellow
            continue
        }

        $score =
            [Math]::Round(
                $processed.Similarity * 100,
                1
            )

        $hasPreservedChorus =
            ([int]$processed.PreservedChorusCount -gt 0)

        if ($hasPreservedChorus) {
            $chorusPreservedSongs++
        }

        if ($processed.Lyrics -ne [string]$hymn.lyrics) {
            $hymn.lyrics = $processed.Lyrics
            $changed++

            if ($hasPreservedChorus) {
                $status = "已修正主歌換行；副歌保留本機版本"
            }
            else {
                $status = "已修正換行"
            }
        }
        else {
            $skipped++

            if ($hasPreservedChorus) {
                $status = "主歌原本已一致；副歌保留本機版本"
            }
            else {
                $status = "原本已一致"
            }
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
Write-Host ("其中相似度低於95%：{0} 首" -f $versionDifferent) -ForegroundColor Yellow
Write-Host ("副歌保留本機版本：{0} 首" -f $chorusPreservedSongs) -ForegroundColor Yellow
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
