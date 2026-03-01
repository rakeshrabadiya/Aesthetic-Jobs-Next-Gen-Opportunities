@echo off
echo Starting Aesthetic Job Board Server...
echo ====================================
echo.

:: Check if virtual environment exists
if not exist "venv\Scripts\activate.bat" (
    echo Error: Virtual environment not found in %CD%\venv
    echo Please ensure the project is fully set up.
    pause
    exit /b 1
)

:: Activate the virtual environment
call venv\Scripts\activate.bat

:: Check if app.py exists
if not exist "app.py" (
    echo Error: app.py not found!
    pause
    exit /b 1
)

:: Run the Flask application
echo Running Flask on http://127.0.0.1:5000
echo Keep this window open to keep the server running.
echo You can close this window to stop the server, or use the Stop_Server.bat script.
echo.

python app.py
pause
