@echo off
setlocal enabledelayedexpansion

title Dream Park ERP - Update & Build System
echo ===================================================================
echo   Dream Park Caravan Revenues - Full Update & Build
echo ===================================================================
echo.

set "ROOT_DIR=%~dp0"
set "FRONTEND_DIR=%ROOT_DIR%frontend"
set "PUBLIC_DIR=%ROOT_DIR%public"

:: 1. Navigate to root and install backend dependencies
echo [1/4] Installing / Updating Backend Dependencies (Root)...
cd /d "%ROOT_DIR%"
call npm install
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Backend npm install failed with error code %errorlevel%!
    pause
    exit /b %errorlevel%
)
echo [OK] Backend dependencies updated successfully.
echo.

:: 2. Navigate to frontend and install frontend dependencies
echo [2/4] Installing / Updating Frontend Dependencies...
cd /d "%FRONTEND_DIR%"
call npm install
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Frontend npm install failed with error code %errorlevel%!
    pause
    exit /b %errorlevel%
)
echo [OK] Frontend dependencies updated successfully.
echo.

:: 3. Build Next.js static export
echo [3/4] Building Next.js Production Static Export...
call npm run build
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Next.js build failed with error code %errorlevel%!
    pause
    exit /b %errorlevel%
)
echo [OK] Next.js production build succeeded.
echo.

:: 4. Verify static export and synchronize to public directory
echo [4/4] Synchronizing Static Export to Root Public Directory...
if not exist "%FRONTEND_DIR%\out\index.html" (
    echo.
    echo [ERROR] Exported index.html not found in frontend\out!
    pause
    exit /b 1
)

:: Remove legacy reports directory if present
if exist "%PUBLIC_DIR%\reports" rmdir /s /q "%PUBLIC_DIR%\reports"

:: Synchronize all files from frontend/out to public
xcopy "%FRONTEND_DIR%\out" "%PUBLIC_DIR%" /e /i /y /q
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] File synchronization to public/ failed!
    pause
    exit /b %errorlevel%
)

echo.
echo ===================================================================
echo   UPDATE & BUILD COMPLETED SUCCESSFULLY!
echo   Frontend static assets synchronized to public/
echo   The application is ready to start via start-server.bat
echo ===================================================================
echo.
pause
endlocal

