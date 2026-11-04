@echo off
title Dream Park ERP - Server (Running)
color 0A

:: الانتقال لمسار المشروع
cd /d "%~dp0"

echo ===================================================
echo   Dream Park Caravan Revenues - Server is STARTING
echo ===================================================
echo.
echo WARNING: DO NOT CLOSE THIS WINDOW! 
echo If you close it, the dashboard will stop working.
echo.
echo Dashboard URL: http://localhost:5000
echo ===================================================
echo.

:: تشغيل السيرفر مباشرة في نفس الشاشة
node server.js

:: لو السيرفر قفل لأي سبب الشاشة هتفضل مفتوحة عشان تقرأ الإيرور
echo.
pause