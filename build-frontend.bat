@echo off
setlocal enabledelayedexpansion

echo ===================================================================
echo   Building Next.js Static Export for Dream Park Reports
echo ===================================================================
echo.

set "ROOT_DIR=%~dp0"
set "FRONTEND_DIR=%ROOT_DIR%frontend"
set "PUBLIC_DIR=%ROOT_DIR%public"

cd /d "%FRONTEND_DIR%"

echo [1/3] Building Next.js application (output: 'export')...
set "NEXT_DIST_DIR=.next-build"
if exist "%FRONTEND_DIR%\.next-build" rmdir /s /q "%FRONTEND_DIR%\.next-build"

call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Next.js build failed!
    exit /b %errorlevel%
)

echo.
echo [2/3] Verifying static export in frontend\out...
set "EXPORT_SRC=%FRONTEND_DIR%\out"
if not exist "%EXPORT_SRC%\index.html" (
    if exist "%FRONTEND_DIR%\.next-build\index.html" (
        set "EXPORT_SRC=%FRONTEND_DIR%\.next-build"
    ) else (
        echo [ERROR] Static export index.html not found!
        exit /b 1
    )
)

echo.
echo [3/3] Synchronizing static export to root public\ directory...
xcopy "%EXPORT_SRC%" "%PUBLIC_DIR%" /e /i /y /q

echo.
echo ===================================================================
echo   SUCCESS: Next.js static export synchronized to public/!
echo ===================================================================
echo.
endlocal
