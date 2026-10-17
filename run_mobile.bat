@echo off
title RouteX Mobile App (React Native + Expo)
color 05

echo ==============================================================================
echo   RouteX Mobile Application (Expo React Native Shell)
echo   Team: NextGen ^| Product: RouteX
echo   Tagline: Know the Road Ahead.
echo ==============================================================================
echo.

cd /d "%~dp0mobile"

if not exist ".env" (
    echo [WARNING] mobile/.env not found!
    echo Creating mobile/.env with default Android emulator URL...
    if exist ".env.example" (
        copy /Y .env.example .env >nul
    )
    echo EXPO_PUBLIC_WEB_URL=http://10.0.2.2:5173>.env
    echo [NOTE] If testing on physical Android device, edit mobile/.env with your LAN IP:
    echo        EXPO_PUBLIC_WEB_URL=http://192.168.0.178:5173
    echo.
)

if not exist "node_modules\" (
    echo [INFO] node_modules not found. Running npm install...
    call npm install
    if errorlevel 1 (
        echo [ERROR] npm install failed. Please check your Node.js and npm installation.
        pause
        exit /b 1
    )
)

echo ==============================================================================
echo   Starting Expo development server...
echo   - Press 'a' in the Expo console to launch on Android emulator
echo   - Scan QR code with Expo Go app on your physical Android phone
echo ==============================================================================
echo.

call npm start

pause
