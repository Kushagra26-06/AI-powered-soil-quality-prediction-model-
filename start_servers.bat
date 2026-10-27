@echo off
setlocal enabledelayedexpansion

echo ========================================
echo Soil Quality Prediction System
echo Starting Backend and Frontend Servers
echo ========================================
echo.

set "PROJECT_DIR=%~dp0"
set "BACKEND_DIR=%PROJECT_DIR%soil-quality-prediction\backend"
set "FRONTEND_DIR=%PROJECT_DIR%soil-quality-prediction\frontend"

echo Starting Backend Server (Flask API on port 5000)...
start "Soil Quality Backend" /D "%BACKEND_DIR%" cmd /k "python app.py"

echo Waiting for backend server to initialize...
set RETRY_COUNT=0

:check_backend
curl.exe -s http://127.0.0.1:5000/health | findstr /i "healthy" >nul 2>&1
if !ERRORLEVEL! equ 0 (
    echo [OK] Backend server is online and healthy!
    goto launch_frontend
)

set /a RETRY_COUNT+=1
if !RETRY_COUNT! geq 20 (
    echo [NOTE] Backend is taking a little longer to start. Launching frontend now...
    goto launch_frontend
)

timeout /t 1 /nobreak >nul
goto check_backend

:launch_frontend
echo.
echo Starting Frontend Server (HTTP server on port 3003)...
start "Soil Quality Frontend" /D "%FRONTEND_DIR%" cmd /k "python server.py"

echo Waiting for frontend to initialize...
timeout /t 2 /nobreak >nul

echo Opening browser at http://127.0.0.1:3003...
start "" "http://127.0.0.1:3003"

echo.
echo ========================================
echo Both servers are running!
echo Backend:  http://127.0.0.1:5000
echo Frontend: http://127.0.0.1:3003
echo Check the opened command windows for server logs.
echo ========================================
echo.
pause
