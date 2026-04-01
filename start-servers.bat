@echo off
setlocal enabledelayedexpansion

echo ==========================================
echo    Starting All Chair App Services...
echo ==========================================

:: 1. Start Main Backend Server (Port 5000)
echo [1/4] Starting Main Backend Server...
start "Backend Server" cmd /k "cd /d Server && npm run dev"

:: 2. Start Frontend Client (Port 3000)
echo [2/4] Starting React Frontend...
start "React Frontend" cmd /k "cd /d Client && npm start"

:: 3. Start Admin Panel
if exist admin (
    echo [3/4] Starting Admin Panel...
    start "Admin Panel" cmd /k "cd /d admin && npm start"
)

:: 4. Start Landing Page
if exist landing-page-app (
    echo [4/4] Starting Landing Page...
    start "Landing Page" cmd /k "cd /d landing-page-app && npm run dev"
)

echo.
echo All services are starting in separate windows.
echo ------------------------------------------
echo Server: http://localhost:5000
echo Client: http://localhost:3000
echo.
echo Press any key to stop all Node processes and exit...
pause >nul

echo Stopping all services...
taskkill /f /im node.exe >nul 2>&1
echo All services stopped.
pause

