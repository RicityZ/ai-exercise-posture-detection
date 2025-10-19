@echo off
chcp 65001 >nul
echo ========================================
echo 🚀 Starting Pose Coach AI
echo ========================================
echo.

REM เปิด Backend (Python Flask)
echo [1/2] Starting Backend Server...
start "Backend - Flask" cmd /k "cd /d %~dp0backend && python app.py"
timeout /t 3 /nobreak >nul

REM เปิด Frontend (Vite React)
echo [2/2] Starting Frontend Server...
start "Frontend - Vite" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ========================================
echo ✅ Both servers are starting!
echo ========================================
echo Backend: http://localhost:5000
echo Frontend: http://localhost:5175
echo.
timeout /t 2 >nul

