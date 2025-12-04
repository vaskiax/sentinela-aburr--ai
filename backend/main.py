from fastapi import FastAPI, HTTPException, BackgroundTasks, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from typing import List, Optional
import asyncio
import random
import os
import pandas as pd
from dotenv import load_dotenv
from .models import (
    ScrapingConfig, ScrapedItem, PredictionResult, ProcessingLog, PipelineStage, CleaningStats
)
from .scraper import Scraper
from .predictor import Predictor
from .nlp import NLPProcessor
from .data_loader import DataLoader

# Load environment variables from .env file
import sys
from pathlib import Path
# Get the directory where this file (main.py) is located
backend_dir = Path(__file__).parent
env_file = backend_dir / '.env'
print(f"[STARTUP] Looking for .env at: {env_file}", file=sys.stderr, flush=True)
print(f"[STARTUP] .env exists: {env_file.exists()}", file=sys.stderr, flush=True)
load_dotenv(env_file)
print("[STARTUP] Loading environment variables...", file=sys.stderr, flush=True)
api_key = os.getenv("GEMINI_API_KEY")
print(f"[STARTUP] GEMINI_API_KEY: {'FOUND' if api_key else 'NOT FOUND'}", file=sys.stderr, flush=True)

app = FastAPI(title="Sentinela Aburrá Backend")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all for dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load environment variables from backend/.env if present
try:
    # When running from repo root, this path is correct
    env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'backend', '.env')
    # Fallback to local .env inside backend folder when executed from there
    if not os.path.exists(env_path):
        env_path = os.path.join(os.path.dirname(__file__), '.env')
    load_dotenv(dotenv_path=env_path)
except Exception:
    # Non-fatal: continue with system envs
    pass

# State
current_config: Optional[ScrapingConfig] = None
scraped_data: List[ScrapedItem] = []
logs: List[ProcessingLog] = []
current_stage: PipelineStage = PipelineStage.DASHBOARD  # Start with dashboard view
prediction_result: Optional[PredictionResult] = None

scraper = Scraper(data_loader=DataLoader())
predictor = Predictor()
nlp = NLPProcessor()
data_loader = DataLoader()
data_loader = DataLoader()
scrape_stats: Optional[CleaningStats] = None

def add_log(stage: PipelineStage, message: str, status: str = 'success'):
    global logs
    logs.append(ProcessingLog(
        id=len(logs) + 1,
        timestamp=str(datetime.datetime.now().time()),
        stage=stage,
        message=message,
        status=status
    ))

import datetime

@app.post("/api/config")
async def set_config(config: ScrapingConfig):
    global current_config, logs, scraped_data, current_stage
    current_config = config
    logs = [] # Reset logs
    scraped_data = []
    current_stage = PipelineStage.CONFIGURATION
    add_log(PipelineStage.CONFIGURATION, "Configuration updated.")
    # Debug: log what we received with full details
    print("[CONFIG] ===== BACKEND RECEIVED CONFIG =====")
    print(f"[CONFIG] Organizations ({len(config.target_organizations or [])}): {config.target_organizations}")
    print(f"[CONFIG] Combos ({len(config.local_combos or [])}): {(config.local_combos or [])[:5]}")
    print(f"[CONFIG] Events ({len(config.predictor_events or [])}): {config.predictor_events}")
    print(f"[CONFIG] Ranks ({len(config.predictor_ranks or [])}): {config.predictor_ranks}")
    print(f"[CONFIG] Crimes ({len(config.target_crimes or [])}): {config.target_crimes}")
    print("[CONFIG] ========================================")
    return {"status": "ok"}

@app.get("/api/options")
async def get_options():
    return data_loader.get_options()

async def run_scraping_task():
    import sys
    global current_stage, scraped_data
    current_stage = PipelineStage.SCRAPING
    add_log(PipelineStage.SCRAPING, "Starting scraping process...")
    
    print("[SCRAPING TASK] Task started", file=sys.stderr, flush=True)
    
    try:
        if current_config:
            print("[SCRAPING TASK] Current config exists, starting scraper...", file=sys.stderr, flush=True)
            print("[SCRAPER] ===== PASSING CONFIG TO SCRAPER =====", file=sys.stderr, flush=True)
            print(f"[SCRAPER] Organizations: {current_config.target_organizations}", file=sys.stderr, flush=True)
            print(f"[SCRAPER] Combos: {(current_config.local_combos or [])[:5]}", file=sys.stderr, flush=True)
            print(f"[SCRAPER] Events: {current_config.predictor_events}", file=sys.stderr, flush=True)
            print(f"[SCRAPER] Ranks: {current_config.predictor_ranks}", file=sys.stderr, flush=True)
            print(f"[SCRAPER] Crimes: {current_config.target_crimes}", file=sys.stderr, flush=True)
            print("[SCRAPER] ========================================", file=sys.stderr, flush=True)
            
            items, stats = scraper.scrape(current_config)
            print(f"[SCRAPING TASK] Scraper returned {len(items)} items", file=sys.stderr, flush=True)
            scraped_data = items
            scrape_stats = stats
            
            add_log(PipelineStage.SCRAPING, f"Scraped {len(items)} items. Filtered {stats.filtered_relevance} low relevance.")
            # Try to capture spider errors if available
            try:
                from .spiders.sentinela_news import NewsSpider
                # Not directly accessible; errors are internal to the run.
                # We keep existing errors empty for now.
            except Exception:
                pass
            
            # Simulate NLP processing
            add_log(PipelineStage.SCRAPING, "Running NLP analysis...")
            for item in items[:5]: # Analyze first 5 just to show
                analysis = nlp.analyze_text(item.snippet)
                # In real app, we'd enrich item with analysis
            
            current_stage = PipelineStage.DATA_PREVIEW
            add_log(PipelineStage.DATA_PREVIEW, "Data ready for preview.")
    except Exception as e:
        import sys
        import traceback
        print(f"[SCRAPING TASK] EXCEPTION: {e}", file=sys.stderr, flush=True)
        traceback.print_exc(file=sys.stderr)
        add_log(PipelineStage.SCRAPING, f"Error: {str(e)}", "error")
        current_stage = PipelineStage.CONFIGURATION

@app.post("/api/scrape")
async def start_scraping(background_tasks: BackgroundTasks):
    background_tasks.add_task(run_scraping_task)
    return {"status": "started"}

@app.post("/api/reset")
async def reset_pipeline():
    """Reset the entire pipeline state"""
    global current_stage, scraped_data, prediction_result, logs, current_config, scrape_stats
    print("[RESET] Resetting all pipeline state")
    current_stage = PipelineStage.DASHBOARD
    scraped_data = []
    prediction_result = None
    logs = []
    current_config = None
    scrape_stats = None
    return {"status": "reset"}

@app.get("/api/debug/config")
async def debug_config():
    """Debug endpoint to see current config"""
    if current_config is None:
        return {"error": "No config set"}
    return {
        "organizations": current_config.target_organizations,
        "combos": (current_config.local_combos or [])[:10],
        "events": current_config.predictor_events,
        "ranks": current_config.predictor_ranks,
        "crimes": current_config.target_crimes
    }

@app.get("/api/status")
async def get_status():
    print(f"[STATUS] Current stage: {current_stage}, Has result: {prediction_result is not None}", flush=True)
    return {
        "stage": current_stage,
        "logs": logs
    }

@app.get("/api/data")
async def get_data():
    return scraped_data

async def run_training_task():
    global current_stage, prediction_result, current_config
    current_stage = PipelineStage.TRAINING
    add_log(PipelineStage.TRAINING, "Starting model training...")
    print("[TRAINING] Task started", flush=True)
    
    try:
        # If no config exists (e.g., from CSV upload), create a default one
        if not current_config:
            print("[TRAINING] No config found, creating default config", flush=True)
            current_config = ScrapingConfig(
                target_organizations=[],
                local_combos=[],
                date_range_start="2023-01-01",
                predictor_events=[],
                predictor_ranks=[],
                target_crimes=[],
                forecast_horizon=7
            )
        
        print(f"[TRAINING] Calling predictor.train_and_predict with {len(scraped_data)} items...", flush=True)
        result = predictor.train_and_predict(current_config, scraped_data)
        print(f"[TRAINING] Training completed. Result: {result is not None}", flush=True)
        prediction_result = result
        add_log(PipelineStage.TRAINING, "Training complete. Model saved.")
        # IMPORTANT: Stay in TRAINING stage so user can review results
        # User must manually click "Proceed to Inference" button
        print(f"[TRAINING] Staying in TRAINING stage for user review", flush=True)
        add_log(PipelineStage.TRAINING, "Review training results and click 'Proceed' when ready.")
    except Exception as e:
        print(f"[TRAINING] ERROR: {str(e)}", flush=True)
        import traceback
        traceback.print_exc()
        add_log(PipelineStage.TRAINING, f"Error: {str(e)}", "error")
        current_stage = PipelineStage.IDLE

@app.post("/api/train")
async def start_training():
    print("[API] /api/train called", flush=True)
    # Run training synchronously (it's fast enough)
    await run_training_task()
    return {"status": "started"}

@app.get("/api/result")
async def get_result():
    return prediction_result

@app.get("/api/nlp-status")
async def nlp_status():
    key = os.getenv("GEMINI_API_KEY")
    masked = None
    if key:
        # Mask all but last 4 chars
        masked = ("*" * max(0, len(key) - 4)) + key[-4:]
    return {
        "gemini_key_present": bool(key),
        "gemini_key_masked": masked,
        "nlp_mode": "real" if getattr(nlp, "model", None) else "mock",
        "model_name": getattr(getattr(nlp, "model", None), "model_name", None)
    }

@app.get("/api/scrape-stats")
async def get_scrape_stats():
    return scrape_stats

# --- New MLOps Endpoints ---

@app.post("/api/upload/data")
async def upload_data(file: UploadFile = File(...)):
    global scraped_data, current_stage, scrape_stats
    
    try:
        df = pd.read_csv(file.file)
        # Validar columnas necesarias (Flexible check)
        # We expect at least Date, Type, Headline/Text
        required_cols = ['Date', 'Type', 'Headline']
        if not all(col in df.columns for col in required_cols):
             raise HTTPException(status_code=400, detail=f"CSV must contain columns: {required_cols}")

        # Convertir DataFrame a lista de ScrapedItem
        items = []
        for i, row in df.iterrows():
            items.append(ScrapedItem(
                id=f"upload_{i}",
                date=str(row['Date']),
                source=row.get('Source', 'Upload'),
                type=row['Type'],
                headline=row['Headline'],
                snippet=row.get('Snippet', ''),
                relevance_score=float(row.get('Relevance Score', 1.0)),
                url=row.get('URL', f"upload://row_{i}")
            ))
        
        scraped_data = items
        # Crear estadísticas de limpieza simuladas
        scrape_stats = CleaningStats(
            total_scraped=len(items),
            filtered_relevance=0,
            filtered_date=0,
            duplicates_removed=0,
            final_count=len(items)
        )
        
        current_stage = PipelineStage.DATA_PREVIEW
        add_log(PipelineStage.CONFIGURATION, f"Successfully uploaded and parsed {len(items)} records.")
        add_log(PipelineStage.DATA_PREVIEW, "Data ready for preview.")
        
        return {"status": "success", "item_count": len(items)}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process file: {str(e)}")

@app.post("/api/predict")
async def run_prediction(items: List[ScrapedItem]):
    if not current_config:
        # If no config, create a dummy one with default horizon
        dummy_config = ScrapingConfig(
            target_organizations=[], local_combos=[], date_range_start="", 
            predictor_events=[], predictor_ranks=[], target_crimes=[], forecast_horizon=7
        )
        try:
            result = predictor.predict_on_demand(items, dummy_config)
            return result
        except FileNotFoundError:
             raise HTTPException(status_code=404, detail="Model not found. Please train first.")
    
    try:
        result = predictor.predict_on_demand(items, current_config)
        return result
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Model not found. Please train first.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/download/model")
async def download_model():
    model_path = predictor.model_path
    if not os.path.exists(model_path):
        raise HTTPException(status_code=404, detail="Model file not found.")
    return FileResponse(path=model_path, filename="sentinela_model.joblib", media_type='application/octet-stream')
