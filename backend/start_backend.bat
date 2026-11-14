@echo off
echo ========================================================
echo  Starting FoodGuard AI Backend Server (FastAPI + Vision)
echo ========================================================
cd /d "%~dp0"
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
pause
