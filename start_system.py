#!/usr/bin/env python3
"""
Soil Quality Prediction System - Startup Script
This script automatically starts both backend and frontend servers
"""

import subprocess
import time
import sys
import os
import webbrowser
from pathlib import Path

def check_dependencies():
    """Check if required dependencies are installed"""
    print("Checking dependencies...")

    # Check Python packages
    package_mapping = {
        'flask': 'flask',
        'flask-cors': 'flask_cors',
        'joblib': 'joblib',
        'numpy': 'numpy',
        'scikit-learn': 'sklearn'
    }
    missing_packages = []

    for package, import_name in package_mapping.items():
        try:
            __import__(import_name)
        except ImportError:
            missing_packages.append(package)

    if missing_packages:
        print(f"Missing packages: {missing_packages}")
        print("Please install them with: pip install " + " ".join(missing_packages))
        return False

    print("All dependencies are installed!")
    return True

def main():
    """Main startup function"""
    print("=" * 50)
    print("Soil Quality Prediction System - Starting Up")
    print("=" * 50)

    # Check dependencies
    if not check_dependencies():
        return

    backend_path = Path(__file__).parent / "soil-quality-prediction" / "backend"
    frontend_path = Path(__file__).parent / "soil-quality-prediction" / "frontend"

    print("\nStarting backend server...")
    print(f"Backend path: {backend_path}")

    # Start backend using start command
    subprocess.Popen(['start', 'cmd', '/k', f'cd /d "{backend_path}" && python app.py'], shell=True)

    print("Waiting for backend to initialize (5 seconds)...")
    time.sleep(5)

    print("\nStarting frontend server...")
    print(f"Frontend path: {frontend_path}")

    # Start frontend using start command
    subprocess.Popen(['start', 'cmd', '/k', f'cd /d "{frontend_path}" && python server.py'], shell=True)

    print("Waiting for frontend to initialize (3 seconds)...")
    time.sleep(3)

    print("\n" + "=" * 50)
    print("System is ready!")
    print("Backend: http://127.0.0.1:5000")
    print("Frontend: http://127.0.0.1:3003")
    print("=" * 50)

    # Open browser
    print("\nOpening browser...")
    webbrowser.open('http://127.0.0.1:3003')

    print("\nPress Enter to close this window (servers will continue running in their own windows)...")
    input()

if __name__ == "__main__":
    main()
