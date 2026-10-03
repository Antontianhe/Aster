@echo off
setlocal
set "ASTER_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
if not exist "%ASTER_NODE%" set "ASTER_NODE=node"
"%ASTER_NODE%" "%~dp0scripts\start-aster.mjs" %*
if errorlevel 1 (
  echo.
  echo Aster could not fully start. See the message above.
  if /I not "%~1"=="--no-browser" pause
  exit /b 1
)
