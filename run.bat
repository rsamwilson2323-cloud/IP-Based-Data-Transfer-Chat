@echo off
title DataBridge Launcher
color 0B

echo.
echo  ============================================
echo   ^<^< DataBridge -- Starting... ^>^>
echo  ============================================
echo.

echo  [1/2] Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo.
    echo  ERROR: npm install failed.
    echo  Make sure Node.js is installed: https://nodejs.org
    pause
    exit /b 1
)

echo.
echo  [2/2] Starting server...
echo.
node server.js

pause