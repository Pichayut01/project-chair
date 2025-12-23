@echo off
echo Starting Chair App servers...

REM Start the React frontend in a separate window
echo Starting React frontend on port 3000...
start "React Frontend" cmd /k "cd /d web-app-chair && npm start"

REM Wait a moment for the frontend to start
timeout /t 2 /nobreak >nul

echo Starting backend servers in this window...
echo Main Backend: http://localhost:5000
echo Presets Backend: http://localhost:5001
echo React Frontend: http://localhost:3000
echo.

REM Start the main backend server in background
echo Starting main backend server on port 5000...
cd /d chairbackend
start /b npm run dev

REM Wait a moment for the first server to start
timeout /t 3 /nobreak >nul

REM Start the presets backend server in background
echo Starting presets backend server on port 5001...
cd /d ../presets-backend
start /b npm run dev

echo.
echo All servers are starting...
echo Press any key to stop all servers...
pause >nul

REM Kill all node processes when user presses a key
echo Stopping all servers...
taskkill /f /im node.exe >nul 2>&1
echo All servers stopped.
