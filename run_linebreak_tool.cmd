@echo off
setlocal
cd /d "%~dp0"

echo.
echo ============================================
echo Hymnal C1-C780 line-break tool - v12
echo ============================================
echo.
echo Preflight: C1, C3, C6, C16, C170.
echo Faster stanza matching + visible progress.
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
