@echo off
setlocal enabledelayedexpansion

echo ===================================================================
echo   Dream Park Caravan Reporting - Target Server Setup Tool
echo ===================================================================
echo.

:: 1. Check Administrator Privileges
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERROR] This setup script MUST be run as Administrator!
    echo Please right-click server-setup.bat and select "Run as administrator".
    echo.
    pause
    exit /b 1
)

set "APP_DIR=%~dp0"
cd /d "%APP_DIR%"

:: 2. Check Node.js and NPM
where node >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in system PATH!
    echo Please install Node.js v18 or higher from https://nodejs.org before running this script.
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%v in ('node -v') do set "NODE_VERSION=%%v"
echo [1/6] Verified Node.js runtime: !NODE_VERSION!

:: 3. Prepare Environment Configuration (.env)
echo.
echo [2/6] Checking environment configuration...
if exist "%APP_DIR%.env" goto :env_ready

if exist "%APP_DIR%.env.example" (
    echo   - Generating .env from .env.example...
    copy /y "%APP_DIR%.env.example" "%APP_DIR%.env" >nul
) else (
    echo   - Generating basic .env configuration file...
    > "%APP_DIR%.env" echo PORT=3005
    >> "%APP_DIR%.env" echo DB_SERVER=DP-DATABASESRV2\SQL2014
    >> "%APP_DIR%.env" echo DB_INSTANCE=SQLEXPRESS
    >> "%APP_DIR%.env" echo DB_NAME=dbDream_Park_Resturant
    >> "%APP_DIR%.env" echo DB_USER=next
    >> "%APP_DIR%.env" echo DB_PASSWORD=1981
    >> "%APP_DIR%.env" echo DB_PORT=1433
    >> "%APP_DIR%.env" echo DB_ENCRYPT=false
    >> "%APP_DIR%.env" echo DB_TRUST_SERVER_CERTIFICATE=true
)
echo   - Environment configuration file ready.

:env_ready
:: Extract configured port or default to 3005
set "APP_PORT=3005"
for /f "tokens=1,2 delims==" %%a in ('type "%APP_DIR%.env"') do (
    set "key=%%a"
    set "val=%%b"
    set "key=!key: =!"
    if /i "!key!"=="PORT" set "APP_PORT=!val: =!"
)

:: 4. Validate server.js syntax before installing service
echo.
echo [3/6] Running diagnostic syntax check on server.js...
call node --check server.js
if %errorLevel% neq 0 (
    echo.
    echo [ERROR] server.js failed syntax verification!
    echo Please fix JavaScript errors in server.js before continuing.
    echo.
    pause
    exit /b 1
)
echo   [OK] server.js syntax verified successfully.

:: 5. Install / Update Production Dependencies
echo.
echo [4/6] Verifying production dependencies...
call npm install --omit=dev
if %errorLevel% neq 0 (
    echo [WARNING] npm install had non-zero exit code, retrying with --force...
    call npm install --omit=dev --force
)

echo   - Verifying node-windows package...
call npm install node-windows

:: 6. Automatic Clean Reinstallation Flow
echo.
echo [5/6] Checking for existing Windows Service installation...

set "NEEDS_UNINSTALL=0"
sc query "DreamPark_Caravan_Report" >nul 2>&1
if %errorLevel% equ 0 set "NEEDS_UNINSTALL=1"

if exist "%APP_DIR%daemon" set "NEEDS_UNINSTALL=1"

if !NEEDS_UNINSTALL! equ 1 (
    echo   - Existing "DreamPark_Caravan_Report" service or daemon detected.
    echo   - Stopping and uninstalling previous service instance cleanly...
    call node uninstall_service.js
    echo   - Waiting 3 seconds for Windows to fully release process and port...
    timeout /t 3 /nobreak >nul
) else (
    echo   - No previous service installation detected.
)

:: 7. Register & Start Fresh Windows Service
echo.
echo [6/6] Registering and starting fresh Windows Service...
call node install_service.js

:: Brief pause for service initialization
timeout /t 3 /nobreak >nul

:: Diagnostic Error Log Check: Inspect daemon/*.err.log if errors exist
set "LOGS_FOUND=0"
for %%f in ("%APP_DIR%daemon\*.err.log") do (
    for %%s in ("%%f") do (
        if %%~zs gtr 0 (
            echo.
            echo ===================================================================
            echo [DIAGNOSTIC ERROR DETECTED] Content of: %%~nxf
            echo ===================================================================
            type "%%f"
            echo ===================================================================
            set "LOGS_FOUND=1"
        )
    )
)

:: 8. Configure Windows Defender Firewall for TCP Port
echo.
echo Configuring Windows Defender Firewall for TCP Port %APP_PORT%...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$rule = Get-NetFirewallRule -DisplayName 'DreamPark Caravan Reporting Service' -ErrorAction SilentlyContinue; if (-not $rule) { New-NetFirewallRule -DisplayName 'DreamPark Caravan Reporting Service' -Direction Inbound -LocalPort %APP_PORT% -Protocol TCP -Action Allow -Profile Any | Out-Null; Write-Host '  - Firewall rule added for TCP port %APP_PORT%.' } else { Write-Host '  - Firewall rule already exists for port %APP_PORT%.' }"

:: 9. Discover LAN IP Address
echo.
echo Discovering local server network IP address...
set "SERVER_IP=127.0.0.1"
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4" ^| findstr /v "127.0.0.1"') do (
    set "ip=%%a"
    set "ip=!ip: =!"
    if not "!ip!"=="" (
        set "SERVER_IP=!ip!"
        goto :ip_found
    )
)
:ip_found

echo.
echo ===================================================================
echo   SETUP COMPLETE: Dream Park Caravan Service is Active!
echo ===================================================================
echo   Service Name:    DreamPark_Caravan_Report
echo   Configured Port: %APP_PORT%
echo.
echo   Local Access URL:       http://localhost:%APP_PORT%
echo   Internal LAN Network:   http://!SERVER_IP!:%APP_PORT%
echo.
echo   To uninstall or stop the service in the future:
echo   Run: node uninstall_service.js (as Administrator)
echo ===================================================================
echo.
pause
endlocal
