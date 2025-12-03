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

class ScrapedItem(BaseModel):
    id: str
    source: str
    date: str
    headline: str
    snippet: str
    url: str
    relevance_score: float
    type: str  # 'TRIGGER_EVENT' | 'CRIME_STAT'

class TrainingMetrics(BaseModel):
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    confusion_matrix: List[List[int]]
    dataset_size: int

class PredictionResult(BaseModel):
    risk_score: float
    expected_crime_type: str
    affected_zones: List[str]
    duration_days: int
    confidence_interval: Tuple[float, float]
    feature_importance: List[Dict[str, Any]] # { feature: string; importance: number }
    timeline_data: List[Dict[str, Any]] # { day: string; risk_score: number }
    training_metrics: TrainingMetrics

    status: str # 'pending' | 'success' | 'error'

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

class PredictionResult(BaseModel):
    risk_score: float
    expected_crime_type: str
    affected_zones: List[str]
    duration_days: int
    confidence_interval: Tuple[float, float]
    feature_importance: List[Dict[str, Any]] # { feature: string; importance: number }
    training_metrics: TrainingMetrics
    model_metadata: Optional[ModelMetadata] = None

class ProcessingLog(BaseModel):
    id: int
    timestamp: str
    stage: PipelineStage
    message: str
    status: str # 'pending' | 'success' | 'error'
