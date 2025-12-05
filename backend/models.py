from pydantic import BaseModel
from typing import List, Optional, Dict, Tuple, Any
from enum import Enum

class CriminalRank(str, Enum):
    CABECILLA = 'Cabecilla (Kingpin/Leader)'
    COORDINADOR = 'Coordinador (Manager)'
    LUGARTENIENTE = 'Lugarteniente (Lieutenant)'
    SUPERVISOR = 'Supervisor (Supervisor)'
    JIBARO = 'Jíbaro/Raso (Low Level)'
    RASO = 'Raso (Low Level)'

class Organization(str, Enum):
    OFICINA_DE_ENVIGADO = 'La Oficina'
    CLAN_DEL_GOLFO = 'Clan del Golfo (AGC)'
    LOS_CHATAS = 'Los Chatas'
    PACHELLY = 'Los Pachelly'
    LA_TERRAZA = 'La Terraza'
    LOS_TRIANA = 'Los Triana'
    ROBLEDO = 'Los del 12 / Robledo'
    LA_SIERRA = 'La Sierra'
    LA_SINTETICA = 'La Sintética (Belén Rincón)'
    OTHER = 'Other / Unknown'

class PipelineStage(str, Enum):
    IDLE = 'IDLE'
    CONFIGURATION = 'CONFIGURATION'
    SCRAPING = 'SCRAPING'
    DATA_PREVIEW = 'DATA_PREVIEW'
    TRAINING = 'TRAINING'
    INFERENCE = 'INFERENCE'
    DASHBOARD = 'DASHBOARD'

class ScrapingConfig(BaseModel):
    target_organizations: List[str]
    local_combos: List[str]
    date_range_start: str
    predictor_events: List[str]
    predictor_ranks: List[str]
    target_crimes: List[str]
    forecast_horizon: int = 7 # Default to 7 days
    granularity: str = 'W' # 'D' (Daily), 'W' (Weekly), 'M' (Monthly)
    max_scraping_time_minutes: Optional[int] = None  # None = sin límite de tiempo
    max_articles: Optional[int] = None  # None = sin límite de artículos

class ScrapedItem(BaseModel):
    id: str
    source: str
    date: str
    headline: str
    snippet: str
    url: str
    relevance_score: float
    type: str = "TRIGGER_EVENT"
    extracted_metadata: Optional[Dict[str, Any]] = None # Structured data: { "crime": "...", "org": "...", "locations": [...] }

class TrainingMetrics(BaseModel):
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    confusion_matrix: List[List[int]]
    dataset_size: int
    test_set_size: int = 0

class CleaningStats(BaseModel):
    total_scraped: int
    filtered_relevance: int
    filtered_date: int
    duplicates_removed: int
    final_count: int

class ModelMetadata(BaseModel):
    regressors: List[str]
    targets: List[str]
    training_steps: List[str]
    model_type: str
    model_name: Optional[str] = None  # Descriptive name: "ModelAbbrev_DateStart_Granularity_Size"
    data_period_start: Optional[str] = None
    data_period_end: Optional[str] = None
    granularity: Optional[str] = None  # 'D' | 'W' | 'M'
    horizon_days: Optional[int] = None  # Number of days for lookback window
    horizon_units: Optional[int] = None  # Number of periods (e.g., 2 for 2 weeks)
    horizon_suffix: Optional[str] = None  # 'd' | 'w' | 'm'
    # NUEVO: Calibración dinámica basada en historia
    max_observed_crimes: Optional[float] = 30.0  # Máximo volumen de crímenes en historia
    max_observed_zone_activity: Optional[float] = 10.0  # Máxima actividad de zona en historia

class PredictionResult(BaseModel):
    # === PREDICCIÓN ACTUAL (Inferencia - Futuro) ===
    # Estos campos representan la proyección operativa usando TODO el dataset
    risk_score: float  # Weighted: 0.7*model_risk + 0.3*zone_risk
    risk_level: str  # 'LOW', 'MODERATE', 'ELEVATED', 'HIGH', 'CRITICAL'
    model_risk_score: float  # Desglose: Riesgo del modelo (0-100, normalizado)
    zone_risk_score: float  # Desglose: Riesgo de zona (0-100, normalizado)
    predicted_volume: float  # Volumen de crímenes proyectado (raw prediction)
    expected_crime_type: str
    affected_zones: List[str]
    duration_days: int
    confidence_interval: Tuple[float, float]
    
    # === VALIDACIÓN DEL MODELO (Test Set Evaluation) ===
    # Estos campos representan el desempeño del modelo en datos históricos NO vistos (20% Test)
    test_evaluation: Optional[Dict[str, Any]] = None  # {
    #   "test_risk_score": float,           # Risk calculado en último punto del test set
    #   "test_predicted_volume": float,     # Volumen predicho en test set
    #   "test_actual_volume": float,        # Volumen real en test set (si disponible)
    #   "test_risk_level": str,             # Nivel de riesgo en test
    #   "test_model_risk": float,           # Desglose modelo en test
    #   "test_zone_risk": float             # Desglose zona en test
    # }
    
    # === MÉTRICAS TÉCNICAS ===
    training_metrics: TrainingMetrics  # RMSE, Accuracy, Dataset Size
    model_comparison: Optional[List[Dict[str, Any]]] = None  # Multi-model comparison
    feature_importance: List[Dict[str, Any]]  # { feature: string; importance: number }
    timeline_data: List[Dict[str, Any]]  # { day: string; risk_score: number }
    zone_risks: List[Dict[str, Any]]  # { zone: string; risk: number; mentions?: int; breakdown?: List[{barrio, mentions}] }
    model_metadata: Optional[ModelMetadata] = None
    
    # === ESTADO Y ALERTAS ===
    status: str = 'success'
    warning_message: Optional[str] = None  # Alerta si datos insuficientes
    
    # === DATA SOURCE TRACKING ===
    data_source: str = 'live_inference'  # 'live_inference' si alignment exitoso, 'training_fallback' si falló
    
    # === MUESTRAS DE DATOS (Visualización) ===
    training_data_sample: Optional[List[Dict[str, Any]]] = None
    test_data_sample: Optional[List[Dict[str, Any]]] = None
    inference_data_sample: Optional[List[Dict[str, Any]]] = None
    # Complete DataFrames for download
    training_data_full: Optional[List[Dict[str, Any]]] = None
    test_data_full: Optional[List[Dict[str, Any]]] = None
    inference_data_full: Optional[List[Dict[str, Any]]] = None
    
    # === AUDITORÍA Y TRANSPARENCIA ===
    calculation_breakdown: Optional[Dict[str, Any]] = None  # Desglose matemático completo

class ProcessingLog(BaseModel):
    id: int
    timestamp: str
    stage: PipelineStage
    message: str
    status: str # 'pending' | 'success' | 'error'
