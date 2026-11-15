@echo off
title Dear NOVA - Mars Mission Command
cd /d "%~dp0"

echo ===================================================
echo             DEAR NOVA - LOCAL LAUNCHER
echo ===================================================
echo.

:: Verify Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js was not found in your system PATH.
    echo Please download and install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

:: Install dependencies if node_modules is missing
if not exist "node_modules\" (
    echo [INFO] Installing npm dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] npm install failed.
        pause
        exit /b 1
    )
)

echo [INFO] Launching Dear NOVA Vite server...
echo [INFO] Your browser will open automatically at http://localhost:5173
echo.

call npm run dev -- --open

pause
