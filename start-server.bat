@echo off
setlocal enabledelayedexpansion

title Dream Park ERP - Application Launcher
echo ===================================================================
echo   Dream Park Caravan Revenues - Local Production Server
echo ===================================================================
echo.

cd /d "%~dp0"

:: 1. Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not found in your PATH!
    echo Please install Node.js (v18+) from https://nodejs.org
    echo.
    pause
    exit /b 1
)

:: 2. Check if server.js exists
if not exist "server.js" (
    echo [ERROR] server.js was not found in %~dp0
    echo Please run this script from the project root directory.
    echo.
    pause
    exit /b 1
)

:: 3. Read configured PORT from .env or default to 5000
set "PORT=5000"
if exist ".env" (
    for /f "usebackq tokens=1,2 delims==" %%a in (".env") do (
        if /i "%%a"=="PORT" set "PORT=%%b"
    )
)

:: 4. Check if server is already running on the configured port
netstat -ano | findstr /r /c:":%PORT% *LISTENING" >nul 2>nul
if %errorlevel% equ 0 (
    echo [INFO] Port %PORT% is already active.
    echo The Dream Park server appears to be already running.
) else (
    echo [1/2] Starting Dream Park Production Server on Port %PORT%...
    :: In our architecture, Express serves both API (/api/...) and the Next.js static export (public/)
    start "Dream Park ERP Service (Port %PORT%)" /min cmd /c "node server.js"
    
    :: Wait a moment for server initialization
    timeout /t 3 /nobreak >nul
)

:: 5. Display Access URLs
echo.
echo ===================================================================
echo   Dream Park Application is Running!
echo ===================================================================
echo.
echo   * Main Dashboard:     http://localhost:%PORT%/
echo   * Login Page:         http://localhost:%PORT%/login
echo   * API Health Check:   http://localhost:%PORT%/api/health
echo.
echo   Default Credentials:
echo   - Username: admin (or mazhar)
echo   - Password: dreampark2026
echo.
echo ===================================================================
echo.

:: 6. Launch browser automatically
echo [2/2] Opening application in your default web browser...
start http://localhost:%PORT%/

echo.
echo Server window is running minimized in your taskbar.
echo To stop the server, close the minimized "Dream Park ERP Service" window.
echo.
pause
endlocal

