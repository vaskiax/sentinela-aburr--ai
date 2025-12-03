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
  confusion_matrix: [[number, number], [number, number]]; // [TP, FP], [FN, TN]
  dataset_size: number;
}

export interface PredictionResult {
  risk_score: number; 
  expected_crime_type: string;
  affected_zones: string[];
  duration_days: number;
  confidence_interval: [number, number];
  feature_importance: { feature: string; importance: number }[];
  timeline_data: { day: string; risk_score: number }[];
  training_metrics: TrainingMetrics; 
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
  language?: 'python' | 'json' | 'markdown' | 'text' | 'csv' | 'bash';
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
}