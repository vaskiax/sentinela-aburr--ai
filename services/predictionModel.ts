import { CriminalProfile, CriminalRank, Organization, ModelFeatures, PredictionResult } from "../types";

/**
 * FEATURE ENGINEERING
 * Converts categorical data into numerical vectors for the regression model.
 * This simulates 'src/features/build_features.py'
 */
export const buildFeatures = (profile: CriminalProfile): ModelFeatures => {
  let rank_weight = 0.2;
  switch (profile.rank) {
    case CriminalRank.CABECILLA: rank_weight = 1.0; break;
    case CriminalRank.LUGARTENIENTE: rank_weight = 0.8; break; // Mapped from high level
    case CriminalRank.COORDINADOR: rank_weight = 0.7; break;
    case CriminalRank.SUPERVISOR: rank_weight = 0.4; break; // Mapped from mid level
    case CriminalRank.JIBARO: rank_weight = 0.2; break; // Mapped from low level
    default: rank_weight = 0.1;
  }

  let org_influence_score = 0.5;
  switch (profile.organization) {
    case Organization.CLAN_DEL_GOLFO: org_influence_score = 0.95; break; // High expansion aggression
    case Organization.OFICINA_DE_ENVIGADO: org_influence_score = 0.90; break; // High systemic control
    case Organization.LOS_CHATAS: org_influence_score = 0.75; break;
    case Organization.PACHELLY: org_influence_score = 0.70; break;
    case Organization.LA_TERRAZA: org_influence_score = 0.65; break;
    default: org_influence_score = 0.4;
  }

  // Simplified logic: More territories = more volatility potential
  const territory_volatility = Math.min((profile.territory_influence?.length || 1) * 0.15, 1.0);

  const status_impact = profile.status === 'NEUTRALIZED' ? 1.0 : 0.8; // Death creates more vacuum than capture

  return { rank_weight, org_influence_score, territory_volatility, status_impact };
};

/**
 * MODEL INFERENCE (REGRESSION)
 * Deterministic mathematical calculation based on weights.
 * This simulates 'src/models/predict_model.py'
 */
export const runRegressionModel = (features: ModelFeatures, profile: CriminalProfile): PredictionResult => {
  // Coefficients (Simulating trained weights from XGBoost/Linear Regression)
  const W_RANK = 0.45;
  const W_ORG = 0.25;
  const W_TERR = 0.20;
  const W_STATUS = 0.10;

  // Linear Combination
  const raw_score = (
    (features.rank_weight * W_RANK) +
    (features.org_influence_score * W_ORG) +
    (features.territory_volatility * W_TERR) +
    (features.status_impact * W_STATUS)
  );

  // Normalize to 0-100 scale
  const risk_score = Math.min(Math.round(raw_score * 100), 100);

  // Classification Logic based on Regression Score
  let expected_crime_type = 'Ajuste de Cuentas';
  let duration = 3;
  
  if (risk_score > 80) {
    expected_crime_type = 'Confrontación Armada Generalizada';
    duration = 14;
  } else if (risk_score > 60) {
    expected_crime_type = 'Homicidios Selectivos (Plan Pistola)';
    duration = 7;
  } else if (risk_score > 40) {
    expected_crime_type = 'Reorganización Interna';
    duration = 5;
  }

  // Generate Timeline Projection (Decay function)
  const timeline_data = [];
  for (let i = 0; i < 7; i++) {
    // Exponential decay formula
    const daily_risk = risk_score * Math.exp(-0.15 * i); 
    timeline_data.push({
      day: `Day +${i}`,
      risk_score: Math.round(daily_risk)
    });
  }

  // Simulated Training Metrics (Hardcoded simulation of XGBoost evaluation)
  const training_metrics = {
    accuracy: 0.87,
    precision: 0.84,
    recall: 0.89,
    f1_score: 0.86,
    confusion_matrix: [[120, 15], [20, 145]] as [[number, number], [number, number]], // [TP, FP], [FN, TN]
    dataset_size: 15420
  };

  return {
    risk_score,
    expected_crime_type,
    affected_zones: profile.territory_influence || [],
    duration_days: duration,
    confidence_interval: [Math.max(0, risk_score - 5), Math.min(100, risk_score + 5)],
    feature_importance: [
      { feature: 'Rank Weight', importance: Math.round(features.rank_weight * 100) },
      { feature: 'Org Influence', importance: Math.round(features.org_influence_score * 100) },
      { feature: 'Territory Volatility', importance: Math.round(features.territory_volatility * 100) },
      { feature: 'Status Impact', importance: Math.round(features.status_impact * 100) },
    ],
    timeline_data,
    training_metrics
  };
};