@echo off
echo Starting Soil Quality Prediction Backend Server...
cd /d "c:\Users\Kushagra\OneDrive\Documents\Artificial Intelligence\soil-quality-prediction\backend"
echo Checking Python installation...
python --version
echo.
echo Starting backend server...
python app.py
echo.
echo Backend server started. Check console output for any errors.
echo Press Ctrl+C to stop the server.
pause
