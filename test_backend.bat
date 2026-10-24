@echo off
title RouteX Backend Tests
color 0F

cd /d "%~dp0"

echo Running RouteX Backend Test Suite...
echo.

call backend\venv\Scripts\activate.bat
python backend\manage.py test apps --verbosity=2

echo.
echo Test execution complete.
pause
