@echo off
title RouteX Launcher
color 0E

echo ==============================================================================
echo   RouteX Application Suite Launcher
echo   Team: NextGen ^| Product: RouteX ^| Know the Road Ahead.
echo ==============================================================================
echo.

cd /d "%~dp0"

echo Launching RouteX Backend server in a separate window...
start "RouteX Backend (Django)" cmd /k "run_backend.bat"

echo Waiting 3 seconds for backend initialization...
timeout /t 3 /nobreak >nul

echo Launching RouteX Frontend application in a separate window...
start "RouteX Frontend (Vite)" cmd /k "run_frontend.bat"

echo.
echo ==============================================================================
echo   Both services are starting!
echo.
echo   - Web App UI:        http://localhost:5173/
echo   - Swagger UI Docs:   http://127.0.0.1:8000/api/docs/
echo   - ReDoc API Docs:    http://127.0.0.1:8000/api/redoc/
echo   - Django REST API:   http://127.0.0.1:8000/api/v1/
echo.
echo   Press any key to close this launcher window (services will stay running).
echo ==============================================================================
pause >nul
