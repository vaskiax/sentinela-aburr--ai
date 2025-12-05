export enum CriminalRank {
  CABECILLA = 'Cabecilla (Kingpin/Leader)',
  COORDINADOR = 'Coordinador (Manager)',
  LUGARTENIENTE = 'Lugarteniente (Lieutenant)',
  SUPERVISOR = 'Supervisor (Supervisor)',
  JIBARO = 'Jíbaro/Raso (Low Level)',
  RASO = 'Raso (Low Level)'
}

export enum Organization {
  OFICINA_DE_ENVIGADO = 'La Oficina',
  CLAN_DEL_GOLFO = 'Clan del Golfo (AGC)',
  LOS_CHATAS = 'Los Chatas',
  PACHELLY = 'Los Pachelly',
  LA_TERRAZA = 'La Terraza',
  LOS_TRIANA = 'Los Triana',
  ROBLEDO = 'Los del 12 / Robledo',
  OTHER = 'Other / Unknown'
}

export interface CriminalProfile {
  alias: string;
  rank: CriminalRank;
  organization: Organization;
  territory_influence: string[];
  status: 'CAPTURED' | 'NEUTRALIZED' | 'ACTIVE';
  capture_date: string;
}

export interface ModelFeatures {
  rank_weight: number;
  org_influence_score: number;
  territory_volatility: number;
  status_impact: number;
}

export interface TrainingMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  confusion_matrix: number[][];
  dataset_size: number;
  test_set_size?: number;
}

export interface CleaningStats {
  total_scraped: number;
  filtered_relevance: number;
  filtered_date: number;
  duplicates_removed: number;
  final_count: number;
}

export interface ModelMetadata {
  regressors: string[];
  targets: string[];
  training_steps: string[];
  model_type: string;
  model_name?: string; // Descriptive name: "ModelAbbrev_DateStart_Granularity_Size"
  data_period_start?: string;
  data_period_end?: string;
  granularity?: string; // 'D' | 'W' | 'M'
  horizon_days?: number; // Number of days for lookback window
  horizon_units?: number; // Number of periods (e.g., 2 for 2 weeks)
  horizon_suffix?: string; // 'd' | 'w' | 'm'
  // Calibración dinámica
  max_observed_crimes?: number;  // Máximo volumen histórico
  max_observed_zone_activity?: number;  // Máxima actividad de zona histórica
  rmse?: number;  // Root Mean Squared Error from training
  winning_model?: string;  // Original model name (e.g., 'XGBoost Regressor')
}

export interface PredictionResult {
  // === PREDICCIÓN OPERACIONAL (Operational Forecast) ===
  // Campos raíz = predicción hacia adelante usando dataset completo
  risk_score: number;
  risk_level: string;  // 'LOW', 'MODERATE', 'ELEVATED', 'HIGH', 'CRITICAL'
  model_risk_score: number;  // Desglose del riesgo del modelo
  zone_risk_score: number;  // Desglose del riesgo de zona
  predicted_volume: number;  // Volumen de crímenes proyectado
  expected_crime_type: string;
  affected_zones: string[];
  duration_days: number;
  confidence_interval: [number, number];
  feature_importance: Array<{ feature: string; importance: number }>;
  timeline_data: Array<{ day: string; risk_score: number }>;
  zone_risks: Array<{ zone: string; risk: number; mentions?: number; breakdown?: Array<{ barrio: string; mentions: number }> }>;
  training_metrics: TrainingMetrics;
  model_comparison?: Array<{ model: string; rmse: number }>;
  model_metadata?: ModelMetadata;
  warning_message?: string;  // Alerta si datos insuficientes
  data_source?: string;  // 'live_inference' o 'training_fallback'
  calculation_breakdown?: Record<string, any>;  // Breakdown detallado de cálculos para audit trail
  
  // === VALIDACIÓN (Test Set Evaluation) ===
  // Evaluación en conjunto de prueba (20% datos históricos no vistos)
  // Propósito: Medir precisión del modelo vs. predicción operacional
  test_evaluation?: {
    test_risk_score: number;          // Risk score calculado en test set
    test_predicted_volume: number;    // Volumen predicho en test set
    test_actual_volume: number | null; // Volumen real en test set (si disponible)
    test_risk_level: string;          // Nivel de riesgo en test set
    test_model_risk: number;          // Model risk en test set
    test_zone_risk: number;           // Zone risk en test set
    rmse: number;                     // Error cuadrático medio
    note: string;                     // Descripción del test evaluation
  };
}

export interface ProcessingLog {
  id: number;
  timestamp: string;
  stage: PipelineStage;
  message: string;
  status: 'pending' | 'success' | 'error';
}

export interface ProjectFile {
  name: string;
  type: 'file' | 'folder';
  content?: string;
  children?: ProjectFile[];
  language?: 'python' | 'json' | 'markdown' | 'text' | 'csv' | 'bash' | 'tsx' | 'typescript';
}

export type PipelineStage = 'IDLE' | 'CONFIGURATION' | 'SCRAPING' | 'DATA_PREVIEW' | 'TRAINING' | 'INFERENCE' | 'DASHBOARD';

export interface ScrapingConfig {
  // Global Scope (Scope of Investigation)
  target_organizations: string[];
  local_combos: string[];
  date_range_start: string;

  // Predictor Variables (X) - The Input Triggers
  predictor_events: string[]; // e.g., ['Capture', 'Neutralization']
  predictor_ranks: string[];  // e.g., ['Leader', 'Lieutenant']

  // Predicted Variables (Y) - The Output Targets
  target_crimes: string[];    // e.g., ['Homicide', 'Extortion']

  // Model Configuration
  forecast_horizon?: number;
  granularity?: 'D' | 'W' | 'M';
  
  // Scraping Limits
  max_scraping_time_minutes?: number;  // Time limit for scraping in minutes
  max_articles?: number;               // Maximum number of articles to scrape
}

export interface ScrapedItem {
  id: string;
  source: string;
  date: string;
  headline: string;
  snippet: string;
  url: string;
  relevance_score: number;
  type: 'TRIGGER_EVENT' | 'CRIME_STAT'; // Strict separation for X and Y
  extracted_metadata?: Record<string, any>; // Optional metadata for manual parameters and NLP data
}