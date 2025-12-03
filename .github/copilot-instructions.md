# Sentinela Aburrá — AI Agent Working Notes

## Big Picture
- Frontend: Vite + React (TypeScript) under `./` uses `services/api.ts` to talk to the backend and `services/geminiService.ts` for NER-only Gemini calls.
- Backend: FastAPI under `backend/` exposes a simple pipeline API and mocks scraping, NLP, and model training. State lives in-process (no DB).
- Data flow: CONFIG → SCRAPING → DATA_PREVIEW → TRAINING → DASHBOARD. UI polls `/api/status` every 1s and fetches `/api/data` (at DATA_PREVIEW) and `/api/result` (at DASHBOARD).
- Types mirror across tiers: TS `types.ts` aligns with Pydantic models in `backend/models.py` (keep field names and enums identical).

## Run/Debug
- Frontend (port 3000):
  - `npm install`
  - Create `.env.local` at repo root with `GEMINI_API_KEY=...` (Vite injects to `process.env.API_KEY`).
  - `npm run dev`
- Backend (port 8000):
  - Python venv with packages from `backend/requirements.txt`.
  - Env var `GEMINI_API_KEY` enables real LLM in `backend/nlp.py`; otherwise NLP is mocked.
  - Run: `uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000`.
- One-shot on Windows: `start_app.bat` launches backend and then the frontend.
- Backend quick test: `python backend/test_api.py` (exercises `/config` → `/scrape` → `/data` → `/train` → `/result`).

## API Contract (backend/main.py)
- Base URL: `http://localhost:8000/api`
- `POST /config` → set `ScrapingConfig`.
- `POST /scrape` → starts background scraping; stage advances to `SCRAPING`, then `DATA_PREVIEW`.
- `GET /status` → `{ stage: PipelineStage, logs: ProcessingLog[] }`.
- `GET /data` → `ScrapedItem[]` (mixed `TRIGGER_EVENT` and `CRIME_STAT`).
- `POST /train` → starts background training; stage moves to `TRAINING` then `DASHBOARD`.
- `GET /result` → `PredictionResult | null`.
- `GET /options` → enumerations + CSV-driven options from `DataLoader`.

## Conventions & Patterns
- Shared enums: update both `backend/models.py` and `types.ts` when changing `PipelineStage`, `Organization`, `CriminalRank`.
- Options source: `DataLoader` reads `backend/data/combos_v2.csv` (semicolon `;` separator). Required cols: `Combo/Banda`, `Barrio`, `Comuna`, `estructura`. UI `PipelineConfig` consumes `/api/options`.
- Frontend NER: `services/geminiService.ts` uses `@google/genai` (`model: 'gemini-2.5-flash'`) strictly for entity extraction; do not use this for risk prediction.
- Backend NLP: `backend/nlp.py` uses `google-generativeai` (`'gemini-pro'`) if `GEMINI_API_KEY` exists; returns mocked structure otherwise.
- Polling: `App.tsx` polls status every 1000 ms; on `DATA_PREVIEW` calls `getData()`, on `DASHBOARD` calls `getResult()`.
- API client: `services/api.ts` is the single source for fetch calls. Extend here when adding endpoints.

## Typical Changes (how-to)
- Add endpoint: define Pydantic model in `backend/models.py` → implement route in `backend/main.py` → add client in `services/api.ts` → add/adjust TS types in `types.ts` → update UI.
- Add pipeline stage: extend `PipelineStage` (both tiers) → adjust `App.tsx` switch and `components/PipelineStatus.tsx` ribbons.
- Extend org/rank lists: prefer changing backend enums and/or the CSV; UI picks up via `/api/options` (avoid frontend hardcoding).

## Useful Commands (Windows PowerShell)
```powershell
# Backend env
python -m venv venv; .\venv\Scripts\Activate.ps1
pip install -r backend/requirements.txt
$env:GEMINI_API_KEY="your_key_here"  # optional for real NLP
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000

# Frontend
npm install
$env:GEMINI_API_KEY="your_key_here"  # used by Vite define()
npm run dev

# Smoke test API (in another shell)
python backend/test_api.py
```

## File Landmarks
- Frontend entry: `index.html`, `index.tsx`, `App.tsx`.
- API client: `services/api.ts`; Gemini NER: `services/geminiService.ts`.
- UI pipeline: `components/PipelineConfig.tsx`, `DataPreview.tsx`, `PipelineStatus.tsx`, `ModelMetrics.tsx`, `AburraMap.tsx`.
- Backend: `backend/main.py` (routes), `scraper.py` (mock ingest), `nlp.py` (LLM), `predictor.py` (mock training), `data_loader.py` (CSV options), `models.py` (schemas).
