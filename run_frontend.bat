@echo off
title RouteX Frontend Application (React + Vite)
color 0A

echo ==============================================================================
echo   RouteX Frontend Application
echo   Team: NextGen ^| Product: RouteX
echo   Tagline: Know the Road Ahead.
echo ==============================================================================
echo.

cd /d "%~dp0frontend"

if not exist "node_modules\" (
    echo [INFO] node_modules not found. Running npm install...
    call npm install
    if errorlevel 1 (
        echo [ERROR] npm install failed. Please check your Node.js and npm installation.
        pause
        exit /b 1
    )
)

echo.
echo ==============================================================================
echo   Starting Vite development server...
echo   RouteX Web App will be available at: http://192.168.0.178:5173/
echo ==============================================================================
echo.

call npm run dev -- --host 0.0.0.0 --port 5173

pause
