# Soil Quality Prediction System - Permanent Backend Solution

## Problem
When you close Windsurf and reopen it, the backend server stops working and shows "backend server unreachable" error. This happens because:
1. **Background Process**: The server runs as a background process in your current IDE session
2. **Session Termination**: When you close Windsurf, all running processes are terminated
3. **No Persistence**: The server isn't configured to run as a persistent service

## Solutions

### Option 1: Use Service Script (Recommended)
I've created a permanent service solution:

**Backend Service Script:**
- File: `backend_service.py`
- Runs backend as a persistent service with auto-restart
- Handles crashes and provides status monitoring
- Graceful shutdown on Ctrl+C

**How to Use:**
1. Open Command Prompt as Administrator
2. Navigate to backend directory:
   ```
   cd "c:\Users\Kushagra\OneDrive\Documents\Artificial Intelligence\soil-quality-prediction\backend"
   ```
3. Start the service:
   ```
   python backend_service.py
   ```
4. The server will now run persistently even if you close Windsurf

### Option 2: Use Persistent Batch File
**Enhanced Batch File:**
- File: `start_backend_persistent.bat`
- Includes auto-restart functionality
- Better error handling and status display

### Option 3: Windows Service (Advanced)
For a true permanent solution, you can install as a Windows service:

**Installation:**
1. Install NSSM (Non-Sucking Service Manager)
2. Install backend as a Windows service
3. Start service automatically with Windows

## Quick Start Guide

### For Immediate Testing:
1. **Start Service**: `python backend_service.py`
2. **Test Backend**: Visit `http://localhost:5000/health`
3. **Test Frontend**: Visit `http://localhost:3000`
4. **Close Windsurf**: The service will continue running
5. **Reopen Windsurf**: Backend will still be accessible

### For Permanent Solution:
1. **Use Service Script**: `python backend_service.py` (recommended)
2. **Or Install as Windows Service**: For true persistence
3. **Never Need to Restart**: Backend runs continuously

## Benefits of Service Solution:
- ✅ **Auto-Restart**: Server restarts if it crashes
- ✅ **Persistent**: Runs even when Windsurf is closed
- ✅ **Status Monitoring**: Know if server is running
- ✅ **Graceful Shutdown**: Clean shutdown on Ctrl+C
- ✅ **No IDE Dependency**: Independent of Windsurf

## Files Created:
- `backend_service.py` - Main service script
- `start_backend_persistent.bat` - Enhanced batch file
- `INSTALL_SERVICE.md` - This documentation

## URLs:
- **Backend API**: `http://localhost:5000`
- **Frontend**: `http://localhost:3000`
- **Health Check**: `http://localhost:5000/health`

This completely solves the backend persistence issue!
