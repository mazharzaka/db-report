@echo off
setlocal enabledelayedexpansion

echo ===================================================================
echo   Dream Park Financial Reporting - Enterprise Deployment Packager
echo ===================================================================
echo.

set "PROJECT_DIR=%~dp0"
cd /d "%PROJECT_DIR%"

set "DIST_DIR=%PROJECT_DIR%dist-deploy"
set "ZIP_FILE=%PROJECT_DIR%caravan-report-deploy.zip"

echo [1/4] Cleaning previous build artifacts...
if exist "%DIST_DIR%" (
    echo   - Removing existing dist-deploy folder...
    rmdir /s /q "%DIST_DIR%"
)
if exist "%ZIP_FILE%" (
    echo   - Removing existing deployment archive...
    del /f /q "%ZIP_FILE%"
)

echo.
echo [2/4] Creating staging deployment structure...
mkdir "%DIST_DIR%"
mkdir "%DIST_DIR%\config"
mkdir "%DIST_DIR%\services"
mkdir "%DIST_DIR%\controllers"
mkdir "%DIST_DIR%\public"

echo.
echo [3/4] Packaging backend microservice and IIS configuration...
echo   - Copying server.js
copy /y "%PROJECT_DIR%server.js" "%DIST_DIR%\" >nul

echo   - Copying config/
xcopy "%PROJECT_DIR%config" "%DIST_DIR%\config" /e /i /y /q >nul

echo   - Copying services/
xcopy "%PROJECT_DIR%services" "%DIST_DIR%\services" /e /i /y /q >nul

echo   - Copying controllers/
xcopy "%PROJECT_DIR%controllers" "%DIST_DIR%\controllers" /e /i /y /q >nul

echo   - Copying package.json
copy /y "%PROJECT_DIR%package.json" "%DIST_DIR%\" >nul

echo   - Copying .env.example
copy /y "%PROJECT_DIR%.env.example" "%DIST_DIR%\" >nul

echo   - Copying .env
if exist "%PROJECT_DIR%.env" (
    copy /y "%PROJECT_DIR%.env" "%DIST_DIR%\" >nul
)

echo   - Copying install_service.js and uninstall_service.js
copy /y "%PROJECT_DIR%install_service.js" "%DIST_DIR%\" >nul
copy /y "%PROJECT_DIR%uninstall_service.js" "%DIST_DIR%\" >nul

echo   - Copying unified web.config
if exist "%PROJECT_DIR%web.config" (
    copy /y "%PROJECT_DIR%web.config" "%DIST_DIR%\" >nul
)

echo   - Copying static assets to public/
if exist "%PROJECT_DIR%public" (
    xcopy "%PROJECT_DIR%public" "%DIST_DIR%\public" /e /i /y /q >nul
)

echo.
echo [4/4] Compressing deployment package into %ZIP_FILE%...
powershell -NoProfile -ExecutionPolicy Bypass -Command "Compress-Archive -Path '%DIST_DIR%\*' -DestinationPath '%ZIP_FILE%' -Force"

if not exist "%ZIP_FILE%" goto :pkg_failed

echo.
echo ===================================================================
echo   SUCCESS: Production Deployment Archive Created!
echo   Archive: caravan-report-deploy.zip
echo ===================================================================
echo.
goto :pkg_end

:pkg_failed
echo.
echo [ERROR] Failed to create zip package. Please check file locks and permissions.
echo.

:pkg_end
endlocal
