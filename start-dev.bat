@echo off
echo Killing any existing Node.js processes...
taskkill /F /IM node.exe 2>nul
if %errorlevel% equ 0 (
    echo Node processes terminated.
) else (
    echo No Node processes found.
)
echo.
echo Starting dev server...
npm run dev
