@echo off
chcp 65001
echo Starting Dream local server...
cd /d "%~dp0\.."

if not exist ".venv\Scripts\python.exe" (
    echo Creating isolated Python environment...
    python -m venv .venv
)

".venv\Scripts\python.exe" -m pip install -r localserver\requirements.txt
".venv\Scripts\python.exe" -m localserver.dream_server

pause
