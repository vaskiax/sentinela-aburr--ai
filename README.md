# Sentinela Aburrá — Future Risk Forecasting Platform

**Sentinela Aburrá** is a machine learning operations platform for **relative risk forecasting** in the Valle de Aburrá region (Medellín, Colombia). It predicts elevated threat levels from precursor signals—not specific crimes—using supervised ML models trained on historical trigger events and criminal activity data.

---

## 📋 Core Principles

### What We Predict
- **Relative risk** from precursor activity patterns (leadership disruption, seizures, media mentions)
- **Not** point predictions of specific crimes, dates, or locations
- Risk is benchmarked against **historical worst-case scenarios** (100% = historical maximum observed)

### What We Do
✅ Detect shifts vs. historical patterns  
✅ Quantify anomaly levels  
✅ Benchmark against historical maxima  
✅ Provide operational decision support  

### What We Do NOT
❌ Predict exact crimes, dates, or places  
❌ Guarantee violence will occur  
❌ Use fixed 100% thresholds  
❌ Operate without historical context  

---

## 🚀 End-to-End Pipeline (5 Stages)

### Stage 1: Configuration
Select forecast parameters:
- **Horizon**: 7/14/30/90 days ahead (shorter = reactive, longer = stable)
- **Granularity**: Daily (sensitive), Weekly (balanced), Monthly (trend)
- **Historical Scope**: 90–365 days for calibration

### Stage 2: Scraping / Data Ingest
Upload CSV with historical events:
```csv
Date,Source,Type,Headline,Relevance,URL
2025-01-15,Perplexity,TRIGGER_EVENT,Capture Urabenos in Manrique,0.9,https://...
2025-01-16,News,CRIME_STAT,Homicides barrio Obrero,0.85,https://...
```

**Types:**
- `TRIGGER_EVENT`: Captures, seizures, leadership disruption
- `CRIME_STAT`: Homicides, robberies, reported crimes

### Stage 3: Data Preview & QA
Validates schema, removes duplicates, checks required columns (Date, Type, Headline, Relevance). Shows cleaning stats before training.

### Stage 4: Training
**Feature Engineering:**
- Rolling window aggregations (7/14/30 days)
- Trigger volume, relevance sums, velocity/recency
- Zone activity, historical calibration (max observed crimes, max zone activity)

**Model Selection:**
- Trains: RandomForest, XGBoost, LightGBM
- Selects lowest RMSE
- Persists: `sentinela_model_metadata.json` (includes granularity, horizon, RMSE, model type)

### Stage 5: Dashboard & Inference
**Dashboard** auto-loads latest trained result with persistent model configuration.  
**Inference** enables manual what-if runs without overwriting model metadata.

---

## 📊 Risk Model & Semaphores

### Model Risk (Volume)
```
(predicted_volume / max_observed_crimes) * 100
```
Benchmarks forecasted volume against historical maximum.

### Zone Risk (Activity)
```
(current_zone_mentions / max_observed_zone_activity) * 100
```
Captures local hotspot pressure.

### Global Risk Formula
```
Global Risk = 0.70 × Model Risk + 0.30 × Zone Risk
```
70% weight on aggregated volume forecast, 30% on localized hotspot activity.

### Semaphores
| Range | Color | Level |
|-------|-------|-------|
| 0-20% | 🟢 GREEN | Low |
| 21-40% | 🔵 BLUE | Guarded |
| 41-60% | 🟡 YELLOW | Elevated |
| 61-80% | 🟠 ORANGE | High |
| 81-100% | 🔴 RED | Critical |

---

## 🏗️ Technical Architecture

### Stack
**Frontend:**
- React 18 + TypeScript + Vite
- TailwindCSS, Lucide Icons, Recharts

**Backend:**
- FastAPI (Python)
- Scikit-learn, XGBoost, LightGBM
- Google Generative AI (Gemini) for NLP
- Pandas, NumPy

### Data Flow
1. Upload CSV → frontend schema validation
2. `POST /config` → set horizon/granularity
3. `POST /scrape` → simulated ingest → `DATA_PREVIEW`
4. `POST /train` → NLP + features + model selection → `TRAINING`
5. `GET /result` → prediction + risk + metadata → `DASHBOARD`
6. `GET /options` → enums + combos CSV for dropdowns

### Key Folders
```
backend/
├─ main.py → FastAPI routes
├─ models.py → Pydantic schemas (PredictionResult, ModelMetadata)
├─ predictor.py → training/inference + persistence
├─ nlp.py → Gemini NLP (mock if no key)
├─ data_loader.py → options from combos_v2.csv
└─ data/ → combos_v2.csv, sentinela_model_metadata.json

src/
├─ App.tsx → orchestration & polling
├─ services/api.ts → single HTTP client
├─ components/ → pipeline views, dashboard widgets
└─ services/geminiService.ts → frontend NER only
```

---

## 🛠️ Installation & Deployment

### Environment Variables
**Backend:**
```bash
GEMINI_API_KEY=your_key_here  # Enables real NLP; mock otherwise
```

**Frontend:**
```bash
VITE_GEMINI_API_KEY=your_key_here  # Injected by Vite for geminiService
```

### Quick Start (Windows PowerShell)
**Backend:**
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r backend/requirements.txt
$env:GEMINI_API_KEY="your_key"
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

**Frontend:**
```powershell
npm install
$env:VITE_GEMINI_API_KEY="your_key"
npm run dev
```

**One-shot:**
```powershell
.\start_app.bat  # Launches backend + frontend
```

---

## 📖 Operational Guide

### Configure
- **Forecast Horizon:** 7 for operations; 30+ for strategic planning
- **Granularity:** D (sensitive), W (balanced), M (trend)
- **Historical Scope:** 90–365 days (more data helps if clean)

### Prepare Data
CSV schema (required):
```csv
Date,Source,Type,Headline,Relevance,URL
```
- **Date:** ISO format (YYYY-MM-DD)
- **Type:** `TRIGGER_EVENT` or `CRIME_STAT`
- **Relevance:** 0.0–1.0

### Interpret Results
- **Forecast Panel (red):** Live prediction vs. historical max (75% = three quarters of worst scenario)
- **Audit Trail:** Transparent calculation breakdown
- **Validation (Training view):** RMSE, dataset size, model choice (past performance; not shown on Dashboard)
- **Zone Breakdown:** Top neighborhoods driving risk for resource allocation

### Warnings
⚠️ **Data Scarcity:** Short history → weak signal  
⚠️ **Scale Mismatch:** Fallback uses last good model if data doesn't align  
⚠️ **Outliers:** Abrupt jumps may be real or data errors—review manually  

---

## 🔍 FAQ

**Why did risk jump from 30% to 75%?**  
Likely surge in triggers or high-impact events. Check zone breakdown and timeline. If genuine, treat as alert; if not, review data quality.

**What does 150% risk mean?**  
Forecast exceeded historical max. Worse than any observed scenario. Investigate immediately.

**How to read RMSE?**  
Root Mean Squared Error in event units. RMSE=2.5 means average error ~2-3 events. Lower is better.

**Why "data_source: training_fallback"?**  
New data did not align with historical scale. System served last good model. Re-run with cleaner or longer history.

**Can I use 10-year history?**  
Possible but risky: gangs, context, and measurement change. Best: 12–18 months of relevant, clean data.

**Why not predict specific crimes?**  
Discrete crimes are unpredictable. We forecast elevated risk from precursor patterns to guide resource allocation.

---

## 📄 License
© 2025 Sentinela Aburrá. All rights reserved.

---

## 🔗 Resources
- **Documentation:** In-app Docs tab (ultra-detailed pipeline, metrics, architecture)
- **API:** `http://localhost:8000/docs` (FastAPI auto-generated)
- **Codebase Explorer:** In-app Architecture tab
