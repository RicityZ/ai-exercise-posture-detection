@echo off
chcp 65001 >nul
echo ========================================
echo 🛑 Stopping Pose Coach AI
echo ========================================
echo.

echo Closing Backend Server...
taskkill /FI "WindowTitle eq Backend - Flask*" /T /F >nul 2>&1

echo Closing Frontend Server...
taskkill /FI "WindowTitle eq Frontend - Vite*" /T /F >nul 2>&1

echo.
echo ✅ All servers stopped!
echo ========================================
timeout /t 2 >nul

