@echo off
setlocal enabledelayedexpansion

title Dream Park ERP - Stop Server
echo ===================================================================
echo   Dream Park Caravan Revenues - Stop Server
echo ===================================================================
echo.

set "PORT=5000"
if exist ".env" (
    for /f "usebackq tokens=1,2 delims==" %%a in (".env") do (
        if /i "%%a"=="PORT" set "PORT=%%b"
    )
)

echo Searching for active process on port %PORT%...
set "FOUND=0"
for /f "tokens=5" %%p in ('netstat -a -n -o ^| findstr /r /c:":%PORT% *LISTENING"') do (
    set "PID=%%p"
    if defined PID (
        set "FOUND=1"
        echo Terminating process with PID: !PID!...
        taskkill /F /PID !PID! >nul 2>nul
    )
)

if "!FOUND!"=="1" (
    echo [OK] Dream Park server on port %PORT% stopped successfully.
) else (
    echo [INFO] No active server process found on port %PORT%.
)

echo.
pause
endlocal

