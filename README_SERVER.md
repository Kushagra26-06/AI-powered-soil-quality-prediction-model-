# Soil Quality Prediction System - Server Setup Guide

## Running Servers Independently of IDEs

When you run Python servers directly inside an IDE terminal (such as VS Code, Windsurf, or PyCharm), closing the IDE terminates the child processes. To keep servers running independently, use the standalone launcher or standalone terminal windows.

---

## Recommended Launch Options

### Option 1: Unified Windows Launcher (Recommended)
Double-click **`start_servers.bat`** in the project root directory.

- Starts both backend (Flask API) and frontend (HTTP server) in their own independent Windows command prompt windows.
- Automatically polls `http://127.0.0.1:5000/health` using `curl` until the Random Forest model is loaded and verified online.
- Launches the frontend server on port `3003` and opens your browser directly at `http://127.0.0.1:3003`.
- The servers continue running independently even if your code editor or IDE is closed.

### Option 2: Cross-Platform Python Launcher
Run from the root directory:
```bash
python start_system.py
```

### Option 3: Manual Terminal Commands
Open two separate Command Prompt or PowerShell windows:

1. **Terminal 1 - Backend Server:**
   ```bash
   cd soil-quality-prediction\backend
   python app.py
   ```
   > Listens at `http://127.0.0.1:5000`

2. **Terminal 2 - Frontend Server:**
   ```bash
   cd soil-quality-prediction\frontend
   python server.py
   ```
   > Listens at `http://127.0.0.1:3003`

---

## Server URLs

- **Web Dashboard:** `http://127.0.0.1:3003`
- **Backend API:** `http://127.0.0.1:5000`
- **Health Check:** `http://127.0.0.1:5000/health`
- **Model Features:** `http://127.0.0.1:5000/features`

> **Note on Windows Loopback:** Always use `127.0.0.1` rather than `localhost` to avoid Windows IPv6 `[::1]` resolution latency and connection refusal.
