@echo off
setlocal
cd /d "%~dp0"

echo.
echo ============================================
echo Supplement Hymnal Cs line-break tool - v18
echo ============================================
echo.
echo Only the 107 songs still unprocessed after v17.
echo.
echo v18:
echo - Ignore original line breaks.
echo - Ignore punctuation differences for matching.
echo - Allow small wording differences.
echo - Accept only similarity 95%% or higher.
echo - Use hymnal.net line boundaries only.
echo - Keep your original lyric wording unchanged.
echo - Chorus logic from v17 is preserved.
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
