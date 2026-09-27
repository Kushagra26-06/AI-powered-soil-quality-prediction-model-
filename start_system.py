#!/usr/bin/env python3
"""
Soil Quality Prediction System - Startup Script
This script automatically starts both backend and frontend servers
"""

import subprocess
import time
import sys
import os
from pathlib import Path

def start_backend():
    """Start the Flask backend server"""
    print("Starting backend server...")
    backend_path = Path(__file__).parent / "backend"
    
    try:
        # Start backend server
        process = subprocess.Popen(
            [sys.executable, "app.py"],
            cwd=backend_path,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        
        # Wait a moment for server to start
        time.sleep(2)
        
        # Check if process is still running
        if process.poll() is None:
            print("Backend server started successfully!")
            return process
        else:
            print("Backend server failed to start")
            return None
            
    except Exception as e:
        print(f"Error starting backend: {e}")
        return None

def start_frontend():
    """Start the frontend server"""
    print("Starting frontend server...")
    frontend_path = Path(__file__).parent / "frontend"
    
    try:
        # Start frontend server
        process = subprocess.Popen(
            [sys.executable, "server.py"],
            cwd=frontend_path,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        
        # Wait a moment for server to start
        time.sleep(2)
        
        # Check if process is still running
        if process.poll() is None:
            print("Frontend server started successfully!")
            return process
        else:
            print("Frontend server failed to start")
            return None
            
    except Exception as e:
        print(f"Error starting frontend: {e}")
        return None

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
    
    # Start backend
    backend_process = start_backend()
    if not backend_process:
        print("Failed to start backend. Exiting...")
        return
    
    # Start frontend
    frontend_process = start_frontend()
    if not frontend_process:
        print("Failed to start frontend. Exiting...")
        backend_process.terminate()
        return
    
    print("\n" + "=" * 50)
    print("System is ready!")
    print("Backend: http://localhost:5000")
    print("Frontend: http://localhost:3003")
    print("Press Ctrl+C to stop both servers")
    print("=" * 50)
    
    try:
        # Keep the script running
        while True:
            time.sleep(1)
            
            # Check if processes are still running
            if backend_process.poll() is not None:
                print("Backend server stopped unexpectedly. Restarting...")
                backend_process = start_backend()
                if not backend_process:
                    break
            
            if frontend_process.poll() is not None:
                print("Frontend server stopped unexpectedly. Restarting...")
                frontend_process = start_frontend()
                if not frontend_process:
                    break
                    
    except KeyboardInterrupt:
        print("\nShutting down servers...")
        backend_process.terminate()
        frontend_process.terminate()
        print("Servers stopped successfully!")

if __name__ == "__main__":
    main()
