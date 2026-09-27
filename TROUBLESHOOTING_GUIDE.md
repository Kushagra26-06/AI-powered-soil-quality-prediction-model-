# Backend Connection Troubleshooting Guide

## Problem: "Cannot Reach Backend Server"

If you're seeing "cannot reach backend server" or similar connection errors, follow these steps:

### 🔧 Step 1: Check Backend Server Status

**Run the backend server manually:**
```bash
cd "c:\Users\Kushagra\OneDrive\Documents\Artificial Intelligence\soil-quality-prediction\backend"
python app.py
```

**Look for these messages:**
- ✅ "Starting backend server on http://127.0.0.1:5000"
- ✅ "Debug mode enabled"
- ✅ "Running on http://127.0.0.1:5000"

**If you see errors like:**
- "Port already in use"
- "Address already in use"
- "Permission denied"

### 🔧 Step 2: Check Frontend Configuration

**Verify API URL in frontend:**
- Open `frontend/script.js`
- Check line: `const API_BASE_URL = 'http://127.0.0.1:5000';`

**URL should match exactly:**
- Backend: `127.0.0.1:5000`
- Frontend: `http://127.0.0.1:5000`

### 🔧 Step 3: Network & Firewall Issues

**Check Windows Firewall:**
1. Open Windows Defender Firewall
2. Go to "Advanced settings" → "Inbound rules"
3. Add rule: Port 5000, Protocol TCP, Action: Allow
4. Save changes

**Check Antivirus Software:**
1. Temporarily disable real-time protection
2. Add exception for localhost connections

### 🔧 Step 4: Browser Testing

**Test backend directly:**
1. Open browser
2. Navigate to `http://127.0.0.1:5000`
3. Look for JSON response or error message

### 🔧 Step 5: Alternative Solutions

**Use different port:**
```python
# In app.py, change:
app.run(debug=True, host='127.0.0.1', port=5001)
```

**Use 0.0.0.0 instead of 127.0.0.1:**
```python
# In app.py, change:
app.run(debug=True, host='0.0.0.0', port=5000)
```

### 🔧 Step 6: Final Verification

**Test complete connection:**
1. Start backend server
2. Start frontend
3. Submit soil parameters
4. Check for successful response

## 📞 Common Error Messages & Solutions

| Error | Solution |
|-------|----------|
| "ECONNREFUSED" | Port conflict, change port |
| "Connection refused" | Backend not running, start server |
| "CORS error" | Check CORS configuration |
| "Network error" | Check network connection |

## 🚀 Quick Start Commands

**Start Backend:**
```bash
cd backend && python app.py
```

**Start Frontend:**
```bash
cd frontend && start_frontend.bat
```

**Test Connection:**
```bash
curl http://127.0.0.1:5000
```

---

If you continue having issues, please provide:
1. Exact error message you're seeing
2. Console output from backend server
3. Screenshots of any error messages

This guide should help resolve most common connection issues!
