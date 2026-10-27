# AI-Powered Soil Quality Prediction System 🌱

An intelligent, full-stack machine learning application designed to predict soil fertility levels, calculate overall soil health scores, and provide actionable, personalized agricultural recommendations based on chemical and physical soil parameters.

---

## 🚀 Key Features

- **Accurate Machine Learning Classification**: Uses a trained **Random Forest** model with **98.5% accuracy** classifying soil samples into:
  - 🟢 **Fertile** (Optimal soil conditions)
  - 🔴 **Less Fertile** (Nutrient or pH deficiencies requiring intervention)
  - 🔵 **Highly Fertile** (Superior nutrient density)
- **11 Essential Soil Parameters Analyzed**:
  - Macronutrients: Nitrogen ($N$), Phosphorus ($P$), Potassium ($K$), Sulfur ($S$)
  - Micronutrients: Zinc ($Zn$), Iron ($Fe$), Copper ($Cu$), Boron ($B$)
  - Soil Characteristics: pH, Electrical Conductivity ($EC$), Organic Carbon ($OC$)
- **Continuous Soil Quality Scoring**: Calculates an integrated soil health score ($0 - 100$) reflecting parameter deviations from agronomic optima.
- **Personalized Agronomic Recommendations**: Generates tailored crop recommendations, fertilizer suggestions, irrigation advice, and soil improvement actions.
- **Interactive Data Visualizations**:
  - Confidence distribution pie chart with semantic color-coding (Green for Fertile, Red for Less Fertile, Blue for Highly Fertile)
  - Parameter level comparison bar chart
  - Detailed confidence breakdown bars
- **Robust Connection & Health Monitoring**:
  - Clickable status badge in the header displaying live backend status: 🟢 **Backend: Connected**, 🟡 **Connecting...**, 🔴 **Offline (Click to Retry)**.
  - Automatic retry mechanism on page load.
- **Dark / Light Mode**: Seamless theme toggle with animated sliding switch.

---

## 📁 Repository Structure

```
AI-powered-soil-quality-prediction-model-/
├── start_servers.bat              # One-click startup script for Windows (polls health before launching browser)
├── start_system.py                # Python startup script (cross-platform alternative)
├── TROUBLESHOOTING_GUIDE.md       # Diagnostic guide for network and server issues
├── README_SERVER.md               # Server configuration and standalone operation guide
├── README.md                      # Primary documentation
└── soil-quality-prediction/
    ├── backend/
    │   ├── app.py                 # Flask REST API server (port 5000)
    │   ├── soil_quality_model.pkl # Trained Random Forest model
    │   ├── soil_quality_scaler.pkl# Feature standard scaler
    │   ├── model_info.pkl         # Feature mapping and metadata
    │   ├── train_model.py         # Model training script
    │   ├── test_api.py            # API automated verification script
    │   └── requirements.txt       # Backend Python dependencies
    └── frontend/
        ├── index.html             # Responsive dashboard UI (Tailwind CSS)
        ├── script.js              # Client logic, chart rendering & API client
        ├── styles.css             # Theme, animations and custom card styling
        ├── server.py              # Lightweight frontend HTTP server (port 3003)
        ├── test_values.txt        # Sample soil parameters for testing
        └── debug_test.html        # Diagnostic testing page
```

---

## ⚡ Quick Start

### Option 1: One-Click Startup (Recommended for Windows)

Double-click **`start_servers.bat`** in the project root folder.

This script automatically:
1. Starts the backend Flask API in a dedicated terminal.
2. Actively monitors `http://127.0.0.1:5000/health` using `curl` until the model and server are confirmed healthy.
3. Starts the frontend server on port `3003`.
4. Opens your default browser to **`http://127.0.0.1:3003`** with the live connection badge active.

---

### Option 2: Python Startup Script

Run the automated Python launcher from the root folder:

```bash
python start_system.py
```

---

### Option 3: Manual Startup

#### Step 1: Install Dependencies
```bash
cd soil-quality-prediction/backend
pip install -r requirements.txt
```

#### Step 2: Start the Backend API
```bash
cd soil-quality-prediction/backend
python app.py
```
> The backend runs at `http://127.0.0.1:5000`.

#### Step 3: Start the Frontend Server
Open a second terminal:
```bash
cd soil-quality-prediction/frontend
python server.py
```
> The frontend is accessible at `http://127.0.0.1:3003`.

---

## 🌐 API Reference

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/health` | `GET` | Health check endpoint returning model and scaler loaded status |
| `/features` | `GET` | Returns required input features, mappings, and class definitions |
| `/predict` | `POST` | Predicts soil fertility class and confidence scores for a soil sample |
| `/calculate_score` | `POST` | Computes continuous soil health score ($0-100$) based on nutrient deviations |
| `/recommendations` | `POST` | Generates crop, fertilizer, irrigation, and soil improvement suggestions |
| `/batch_predict` | `POST` | Predicts fertility classifications for multiple soil samples simultaneously |

### Sample Prediction Payload (`POST /predict`)
```json
{
  "N": 65.5,
  "P": 28.3,
  "K": 45.2,
  "ph": 6.8,
  "ec": 1.2,
  "oc": 2.8,
  "S": 15.4,
  "zn": 2.1,
  "fe": 25.6,
  "cu": 1.8,
  "B": 3.2
}
```

---

## 🧪 Testing with Sample Values

Click the **"Load Sample Data"** button on the web interface, or consult [`soil-quality-prediction/frontend/test_values.txt`](file:///c:/Users/Kushagra/OneDrive/Documents/AI-powered-soil-quality-prediction-model-/soil-quality-prediction/frontend/test_values.txt) for ready-to-use sample parameters for:
- Highly Fertile soil
- Average Fertile soil
- Deficient / Less Fertile soil
- High pH / Alkaline edge cases