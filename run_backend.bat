@echo off
title RouteX Backend Server (Django REST Framework)
color 0B

echo ==============================================================================
echo   RouteX Backend Server
echo   Team: NextGen ^| Product: RouteX ^| Know the Road Ahead.
echo ==============================================================================
echo.

cd /d "%~dp0"

if not exist "backend\venv\Scripts\python.exe" (
    echo [ERROR] Python virtual environment not found in backend\venv.
    echo Creating virtual environment now...
    python -m venv backend\venv
    if errorlevel 1 (
        echo [ERROR] Failed to create virtual environment. Please ensure Python 3.11+ is installed.
        pause
        exit /b 1
    )
    echo Installing backend dependencies...
    backend\venv\Scripts\pip install -r backend\requirements.txt
)

echo [1/3] Activating virtual environment...
call backend\venv\Scripts\activate.bat

echo [2/3] Checking and applying database migrations...
python backend\manage.py migrate
if errorlevel 1 (
    echo [ERROR] Database migration failed.
    pause
    exit /b 1
)

echo [3/3] Seeding platform accounts and road hazards...
python seed_db.py

echo.
echo ==============================================================================
echo   RouteX Backend is ready!
echo   - API Root:       http://192.168.0.178:8000/api/v1/
echo   - Swagger UI:     http://192.168.0.178:8000/api/docs/
echo   - ReDoc:          http://192.168.0.178:8000/api/redoc/
echo   - Health Check:   http://192.168.0.178:8000/api/v1/health/
echo   - Django Admin:   http://192.168.0.178:8000/admin/
echo ==============================================================================
echo.
echo Starting Django development server on port 8000...
python backend\manage.py runserver 0.0.0.0:8000

pause
