@echo off
setlocal
cd /d "%~dp0"

echo.
echo ============================================
echo Supplement Hymnal Cs line-break tool - v17
echo ============================================
echo.
echo ONLY retries the same 152 songs from v15.
echo.
echo v17 matching:
echo - Ignore existing line breaks completely.
echo - Ignore punctuation / quote differences for matching.
echo - Compare continuous lyric text.
echo - Then restore hymnal.net official line boundaries.
echo - Keep YOUR lyric wording and punctuation unchanged.
echo.
echo Chorus:
echo - Supports (chorus), chorus 1, chorus 2, etc.
echo - hymnal.net does not need to repeat chorus under every stanza.
echo - Your repeated chorus structure is preserved.
echo.
echo Target: book 2 only.
echo.

if not exist "%~dp0hymns.js" (
  echo ERROR: hymns.js was not found.
  pause
  exit /b 1
)

if not exist "%~dp0linebreak_tool.ps1" (
  echo ERROR: linebreak_tool.ps1 was not found.
  pause
  exit /b 1
)

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0linebreak_tool.ps1"

echo.
echo ============================================
echo PowerShell finished.
echo Exit code: %ERRORLEVEL%
echo ============================================
echo.
pause
endlocal
