@echo off
echo ========================================
echo   Sentinela Aburra AI - Startup
echo ========================================
echo.

cd /d "%~dp0"

echo [1/3] Activating Python Virtual Environment...
call venv\Scripts\activate.bat

echo [2/3] Starting Backend Server (FastAPI + Uvicorn)...
start "Sentinela Backend" cmd /k "venv\Scripts\activate.bat && uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000"

timeout /t 3 /nobreak >nul

echo [3/3] Starting Frontend Server (Vite + React)...
npm run dev
