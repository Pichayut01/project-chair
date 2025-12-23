@echo off
echo Starting Chair App servers...

REM Start the React frontend in a separate window
echo Starting React frontend on port 3000...
start "React Frontend" cmd /k "cd /d Client && npm start"

REM Wait a moment for the frontend to start
timeout /t 2 /nobreak >nul

echo Starting backend server in this window...
echo Server: http://localhost:5000
echo Client: http://localhost:3000
echo.

REM Start the main backend server in background
echo Starting backend server on port 5000...
cd /d Server
start /b npm start

echo.
echo All servers are starting...
echo Press any key to stop all servers...
pause >nul

REM Kill all node processes when user presses a key
echo Stopping all servers...
taskkill /f /im node.exe >nul 2>&1
echo All servers stopped.
