@echo off
setlocal
cd /d "%~dp0"

echo.
echo ============================================
echo Supplement Hymnal Cs line-break tool - v15
echo ============================================
echo.
echo Target: book 2 only
echo Source: hymnal.net /zh/hymn/ts/N (CsN)
echo.
echo New v15 behavior:
echo - Preflight mismatch will NOT stop the whole run.
echo - Matching lyrics: fix line breaks only.
echo - Different lyrics version: skip that song and report it.
echo - Other books, code, title, favorite stay untouched.
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
