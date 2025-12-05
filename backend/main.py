from fastapi import FastAPI, HTTPException, BackgroundTasks, File, UploadFile, Form
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
    options = data_loader.get_options()
    print(f"[OPTIONS] Returning {len(options.get('barrios', []))} barrios, {len(options.get('combos', []))} combos", flush=True)
    return options

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
    
    # Simple logging to console without complex formatting
    print("\n" + "="*80)
    print("TRAINING PASO 1: ENTRENAR MODELO CON DATOS ORIGINALES")
    print("="*80)
    sys.stderr.flush()
    sys.stdout.flush()
    
    try:
        # If no config exists (e.g., from CSV upload), create a default one
        if not current_config:
            print("No config found, creating default", flush=True)
            from datetime import datetime, timedelta
            default_date = (datetime.now() - timedelta(days=90)).strftime('%Y-%m-%d')
            current_config = ScrapingConfig(
                target_organizations=[],
                local_combos=[],
                date_range_start=default_date,
                predictor_events=[],
                predictor_ranks=[],
                target_crimes=[],
                forecast_horizon=7
            )
        
        print(f"Dataset items: {len(scraped_data)}", flush=True)
        result = predictor.train_and_predict(current_config, scraped_data)
        print(f"Training Result - Risk: {result.risk_score}, Volume: {result.predicted_volume}", flush=True)
        
        print("\n" + "="*80)
        print("TRAINING PASO 2: ALIGNMENT - APLICAR MODELO A MISMO DATASET")
        print("="*80)
        sys.stderr.flush()
        sys.stdout.flush()
        
        try:
            aligned_result = predictor.predict_on_demand(scraped_data, current_config)
            print(f"Aligned Result - Risk: {aligned_result.risk_score}, Volume: {aligned_result.predicted_volume}", flush=True)
            
            # COMPARACIÓN
            risk_delta = abs(result.risk_score - aligned_result.risk_score)
            volume_delta = abs(result.predicted_volume - aligned_result.predicted_volume)
            
            print("\n" + "="*80)
            print("COMPARACIÓN: TRAINING vs ALIGNED")
            print("="*80)
            print(f"Risk: {result.risk_score} vs {aligned_result.risk_score} (Delta: {risk_delta:.2f})", flush=True)
            print(f"Volume: {result.predicted_volume} vs {aligned_result.predicted_volume} (Delta: {volume_delta:.2f})", flush=True)
            print("="*80 + "\n", flush=True)
            sys.stderr.flush()
            sys.stdout.flush()
            
            # Use model_dump() for Pydantic v2 compatibility
            result_dict = result.model_dump()
            # OVERWRITE ALL risk-related fields from aligned_result to ensure consistency
            result_dict.update({
                "risk_score": aligned_result.risk_score,
                "risk_level": aligned_result.risk_level,
                "model_risk_score": aligned_result.model_risk_score,
                "zone_risk_score": aligned_result.zone_risk_score,
                "predicted_volume": aligned_result.predicted_volume,
                "expected_crime_type": aligned_result.expected_crime_type,
                "affected_zones": aligned_result.affected_zones,
                "duration_days": aligned_result.duration_days,
                "confidence_interval": aligned_result.confidence_interval,
                "zone_risks": aligned_result.zone_risks,
                "inference_data_sample": aligned_result.inference_data_sample,
                "inference_data_full": aligned_result.inference_data_full,
                "calculation_breakdown": aligned_result.calculation_breakdown,
                "status": aligned_result.status,
                "warning_message": aligned_result.warning_message,
                "data_source": "live_inference",  # Mark as fresh inference
            })
            prediction_result = PredictionResult(**result_dict)
            print(f"[TRAINING] ✓ Dashboard NOW shows inference results on training dataset. All fields synchronized.", flush=True)
        except Exception as align_err:
            print(f"[TRAINING] Alignment failed: {str(align_err)}", flush=True)
            import traceback
            traceback.print_exc(file=__import__('sys').stderr)
            print(f"[TRAINING] Fallback: using training result directly. Risk score: {result.risk_score}", flush=True)
            result_dict = result.model_dump()
            result_dict["data_source"] = "training_fallback"  # Mark as fallback
            prediction_result = PredictionResult(**result_dict)
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
    global prediction_result
    
    # If we have a cached prediction_result, return it
    if prediction_result:
        return prediction_result
    
    # Otherwise, try to load persisted model metadata
    # This allows inferencing on page reload without retraining
    try:
        import json
        model_path = os.path.join(backend_dir, "data", "sentinela_model.joblib")
        metadata_path = model_path.replace('.joblib', '_metadata.json')
        
        if os.path.exists(metadata_path):
            with open(metadata_path, 'r') as f:
                metadata_dict = json.load(f)
            print(f"[API] Loaded persisted model metadata: {metadata_dict.get('model_name')}")
            
            # Return a minimal PredictionResult with just the metadata
            # so frontend can display model configuration
            from models import ModelMetadata
            model_metadata = ModelMetadata(**metadata_dict)
            
            # Return a stub result with metadata only (for dashboard display)
            return {
                "risk_score": 0,
                "risk_level": "UNKNOWN",
                "model_risk_score": 0,
                "zone_risk_score": 0,
                "predicted_volume": 0,
                "expected_crime_type": "No inference data",
                "affected_zones": [],
                "duration_days": 0,
                "confidence_interval": [0, 0],
                "feature_importance": [],
                "timeline_data": [],
                "zone_risks": [],
                "training_metrics": {
                    "accuracy": 0,
                    "precision": 0,
                    "recall": 0,
                    "f1_score": 0,
                    "confusion_matrix": [],
                    "dataset_size": 0
                },
                "model_metadata": model_metadata.model_dump(),
                "warning_message": "No inference data available. Model loaded from storage.",
                "data_source": "persisted_model"
            }
    except Exception as e:
        print(f"[API] Error loading persisted metadata: {e}")
    
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
async def upload_data(file: UploadFile = File(...), forecast_horizon: int = Form(7), granularity: str = Form('W'), date_range_start_param: str = Form(None)):
    global scraped_data, current_stage, scrape_stats, current_config
    
    try:
        print(f"[UPLOAD] Starting file upload: {file.filename}", flush=True)
        print(f"[UPLOAD] Parameters: forecast_horizon={forecast_horizon}, granularity={granularity}, date_range_start={date_range_start_param}", flush=True)
        
        try:
            df = pd.read_csv(file.file)
        except Exception as csv_error:
            print(f"[UPLOAD ERROR] Failed to parse CSV: {csv_error}", flush=True)
            raise HTTPException(status_code=400, detail=f"Failed to parse CSV file: {str(csv_error)}")
        
        print(f"[UPLOAD] Successfully read CSV with {len(df)} rows and columns: {df.columns.tolist()}", flush=True)
        
        # Validar columnas necesarias (Flexible check)
        # We expect at least Date, Type, Headline/Text
        required_cols = ['Date', 'Type', 'Headline']
        if not all(col in df.columns for col in required_cols):
            print(f"[UPLOAD ERROR] Missing columns. Required: {required_cols}, Got: {df.columns.tolist()}", flush=True)
            raise HTTPException(status_code=400, detail=f"CSV must contain columns: {required_cols}")

        # Convertir DataFrame a lista de ScrapedItem
        items = []
        for i, row in df.iterrows():
            try:
                # Handle NaN values - convert to empty string or default value
                headline = row.get('Headline', '')
                if pd.isna(headline):
                    headline = ''
                
                source = row.get('Source', 'Upload')
                if pd.isna(source):
                    source = 'Upload'
                
                type_val = row.get('Type', 'TRIGGER_EVENT')
                if pd.isna(type_val):
                    type_val = 'TRIGGER_EVENT'
                
                url = row.get('URL', f"upload://row_{i}")
                if pd.isna(url):
                    url = f"upload://row_{i}"
                
                # Use Headline for snippet if Snippet column doesn't exist
                snippet_text = row.get('Snippet', headline)
                if pd.isna(snippet_text):
                    snippet_text = headline if not pd.isna(headline) else ''
                
                relevance = row.get('Relevance Score', 1.0)
                if pd.isna(relevance):
                    relevance = 1.0
                
                item = ScrapedItem(
                    id=f"upload_{i}",
                    date=str(row['Date']),
                    source=str(source),
                    type=str(type_val),
                    headline=str(headline),
                    snippet=str(snippet_text),
                    relevance_score=float(relevance),
                    url=str(url)
                )
                items.append(item)
            except Exception as row_error:
                print(f"[UPLOAD ERROR] Error processing row {i}: {row_error}", flush=True)
                print(f"[UPLOAD ERROR] Row data: {row.to_dict()}", flush=True)
                raise HTTPException(status_code=400, detail=f"Error processing row {i}: {str(row_error)}")
        
        print(f"[UPLOAD] Successfully converted {len(items)} rows to ScrapedItem objects", flush=True)
        
        scraped_data = items
        # Crear estadísticas de limpieza simuladas
        scrape_stats = CleaningStats(
            total_scraped=len(items),
            filtered_relevance=0,
            filtered_date=0,
            duplicates_removed=0,
            final_count=len(items)
        )
        
        # Store training parameters from CSV upload - use date_range_start_param
        date_range_start = date_range_start_param
        print(f"[UPLOAD] Received date_range_start_param (raw from form): '{date_range_start_param}'", flush=True)
        print(f"[UPLOAD] Received forecast_horizon={forecast_horizon}, granularity={granularity}, date_range_start (after assign)='{date_range_start}'", flush=True)
        
        # Handle 'None' string from FormData (when null is sent from frontend)
        if date_range_start == 'None' or date_range_start is None or date_range_start == '':
            date_range_start = None
            print(f"[UPLOAD] date_range_start is empty/None, will use fallback logic", flush=True)
        
        # Determine date_range_start: use parameter if provided, otherwise preserve current_config or use 90 days ago
        if not date_range_start or date_range_start == "":
            if current_config and current_config.date_range_start:
                date_range_start = current_config.date_range_start
                print(f"[UPLOAD] Using date_range_start from current_config: {date_range_start}", flush=True)
            else:
                from datetime import datetime, timedelta
                date_range_start = (datetime.now() - timedelta(days=90)).strftime('%Y-%m-%d')
                print(f"[UPLOAD] No date_range_start provided, using default (90 days ago): {date_range_start}", flush=True)
        else:
            print(f"[UPLOAD] Using date_range_start from form parameter: {date_range_start}", flush=True)
        
        if not current_config:
            current_config = ScrapingConfig(
                target_organizations=[],
                local_combos=[],
                date_range_start=date_range_start,
                predictor_events=[],
                predictor_ranks=[],
                target_crimes=[],
                forecast_horizon=forecast_horizon,
                granularity=granularity
            )
        else:
            current_config.forecast_horizon = forecast_horizon
            current_config.granularity = granularity
        print(f"[UPLOAD] Config updated: forecast_horizon={current_config.forecast_horizon}, granularity={current_config.granularity}", flush=True)
        
        current_stage = PipelineStage.DATA_PREVIEW
        add_log(PipelineStage.CONFIGURATION, f"Successfully uploaded and parsed {len(items)} records.")
        add_log(PipelineStage.DATA_PREVIEW, f"Data ready for preview. Training params: horizon={forecast_horizon}d, granularity={granularity}")
        
        print(f"[UPLOAD] Upload completed successfully", flush=True)
        return {"status": "success", "item_count": len(items)}

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_detail = f"Failed to process file: {str(e)}"
        print(f"[UPLOAD] ERROR: {error_detail}", flush=True)
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=error_detail)

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
