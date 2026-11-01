@echo off
setlocal enabledelayedexpansion

echo ===================================================================
echo   Dream Park Caravan Reporting - IIS & iisnode Setup Helper
echo ===================================================================
echo.

:: 1. Check Administrator Privileges
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERROR] This script MUST be run as Administrator!
    echo Please right-click setup-iis.bat and select "Run as administrator".
    echo.
    pause
    exit /b 1
)

set "APP_DIR=%~dp0"
cd /d "%APP_DIR%"

echo [1/4] Checking IIS and iisnode Prerequisites...
echo -------------------------------------------------------------------

:: Check Node.js
where node >nul 2>&1
if %errorLevel% equ 0 (
    for /f "tokens=*" %%v in ('node -v') do set "NODE_VER=%%v"
    echo   [OK] Node.js is installed: !NODE_VER!
) else (
    echo   [MISSING] Node.js is NOT installed!
    echo             Please download and install Node.js v18+ from https://nodejs.org
)

:: Check IIS (Internet Information Services)
if exist "%windir%\System32\inetsrv\w3wp.exe" (
    echo   [OK] Microsoft IIS is enabled.
) else (
    echo   [MISSING] Microsoft IIS is NOT installed or enabled!
    echo             Enable IIS via: Server Manager -> Add Roles and Features -> Web Server (IIS).
)

:: Check URL Rewrite Module
if exist "%windir%\System32\inetsrv\rewrite.dll" (
    echo   [OK] IIS URL Rewrite Module is installed.
) else (
    echo   [MISSING] IIS URL Rewrite Module is NOT installed!
    echo             Download from: https://www.iis.net/downloads/microsoft/url-rewrite
)

:: Check iisnode module
set "IISNODE_FOUND=0"
if exist "%ProgramFiles%\iisnode\iisnode.dll" set "IISNODE_FOUND=1"
if exist "%ProgramFiles(x86)%\iisnode\iisnode.dll" set "IISNODE_FOUND=1"
if !IISNODE_FOUND! equ 1 (
    echo   [OK] iisnode is installed.
) else (
    echo   [MISSING] iisnode is NOT installed!
    echo             Download and install iisnode (64-bit) from:
    echo             https://github.com/Azure/iisnode/releases
)

echo.
echo [2/4] Setting File System Permissions (IIS_IUSRS)...
echo -------------------------------------------------------------------
echo   - Granting IIS_IUSRS read and execute permissions on application folder...
icacls "%APP_DIR%" /grant "IIS_IUSRS":(OI)(CI)RX /T /Q >nul 2>&1

echo   - Creating and granting write permissions on iisnode logging directory...
if not exist "%APP_DIR%iisnode" mkdir "%APP_DIR%iisnode"
icacls "%APP_DIR%iisnode" /grant "IIS_IUSRS":(OI)(CI)M /T /Q >nul 2>&1

echo   [OK] File permissions configured successfully.

echo.
echo [3/4] Checking environment configuration (.env)...
echo -------------------------------------------------------------------
if not exist "%APP_DIR%.env" (
    if exist "%APP_DIR%.env.example" (
        copy /y "%APP_DIR%.env.example" "%APP_DIR%.env" >nul
        echo   - Created .env from .env.example.
    )
) else (
    echo   - Existing .env file detected.
)

echo.
echo [4/4] Next Steps to Complete Hosting in IIS:
echo ===================================================================
echo   1. Open IIS Manager:
echo      Press Win+R -> type inetmgr -> Press Enter.
echo.
echo   2. Create Website or Virtual Application:
echo      - Right-click "Sites" -> "Add Website..." (or add under "Default Web Site")
echo      - Site name:      DreamPark_Caravan_Report
echo      - Physical path:  %APP_DIR:~0,-1%
echo      - Port / Binding: e.g. Port 5000 (or Port 80)
echo.
echo   3. Application Pool Settings:
echo      - Ensure the App Pool .NET CLR Version is set to: "No Managed Code"
echo      - Identity: ApplicationPoolIdentity or NetworkService
echo.
echo   4. Browse and Test:
echo      Navigate to your configured port in the browser:
echo      http://localhost:5000  (or your server's LAN IP)
echo ===================================================================
echo.
pause
endlocal
