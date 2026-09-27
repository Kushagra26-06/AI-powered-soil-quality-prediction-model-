# Soil Quality Prediction System - Server Setup

## Why Backend Server Stops When Closing Windsurf

The backend server stops running when you close Windsurf because:
1. **Background Process**: The server runs as a background process in your current IDE session
2. **Session Termination**: When you close Windsurf, all running processes are terminated
3. **No Persistence**: The server isn't configured to run as a persistent service

## Solutions

### Option 1: Use Batch Files (Recommended)
I've created two batch files for you:

**Start Backend Server:**
- File: `start_backend.bat`
- Double-click to run the backend server independently
- Server will run until you manually close the terminal

**Start Frontend Server:**
- File: `start_frontend.bat`
- Double-click to run the frontend server independently
- Server will run until you manually close the terminal

### Option 2: Manual Terminal Commands
1. Open Command Prompt or PowerShell
2. Navigate to backend directory:
   ```
   cd "c:\Users\Kushagra\OneDrive\Documents\Artificial Intelligence\soil-quality-prediction\backend"
   ```
3. Start backend:
   ```
   python app.py
   ```
4. Open another terminal for frontend:
   ```
   cd "c:\Users\Kushagra\OneDrive\Documents\Artificial Intelligence\soil-quality-prediction\frontend"
   python server.py
   ```

### Option 3: Keep Windsurf Open
- Simply keep Windsurf running in the background
- The servers will continue running as long as Windsurf is open

## Access URLs
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000
- **Health Check:** http://localhost:5000/health

## Quick Start
1. Double-click `start_backend.bat` to start the backend
2. Double-click `start_frontend.bat` to start the frontend
3. Open http://localhost:3000 in your browser
4. Done! Servers will run independently of Windsurf
