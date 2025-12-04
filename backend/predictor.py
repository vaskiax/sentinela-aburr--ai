import random
import math
import pandas as pd
import numpy as np
import joblib
import os
from typing import List, Dict, Tuple, Any
from collections import Counter
from datetime import datetime, timedelta
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from xgboost import XGBRegressor
from sklearn.metrics import mean_squared_error
from .models import PredictionResult, TrainingMetrics, ScrapingConfig, ModelMetadata, ScrapedItem

class Predictor:
    def __init__(self):
        # Known zones in Medellin/Aburra Valley for mapping
        self.known_zones = [
            'Manrique', 'Aranjuez', 'Bello', 'Robledo', 'San Javier', 'Villa Hermosa', 'Belén',
            'La Candelaria', 'La América', 'Castilla', 'Doce de Octubre', 'Buenos Aires',
            'Poblado', 'Guayabal', 'Itagüí', 'Envigado', 'Sabaneta', 'Caldas', 'Barbosa',
            'Girardota', 'Copacabana', 'La Estrella'
        ]
        self.models = {}
        self.best_model_name = "None"
        self.best_model = None
        self.model_path = "backend/data/sentinela_model.joblib"

    def train_and_predict(self, config: ScrapingConfig, items: List[ScrapedItem]) -> PredictionResult:
        """
        Temporal Prediction Pipeline:
        1. Data Preparation, Cleaning & Time Series Creation
        2. Temporal Feature Engineering (Rolling Windows)
        3. Train/Test Split
        4. Multi-Model Regression Training (RFR, XGBR)
        5. Prediction & Risk Index Generation
        """
        if len(items) < 20:
            return self._generate_heuristic_result(config, items)

        # --- 1. Data Preparation, Cleaning & Time Series Creation ---
        df = pd.DataFrame([
            {
                "date": pd.to_datetime(item.date, errors='coerce'),
                "type": item.type,
                "relevance": item.relevance_score,
                "text": (item.headline + " " + item.snippet).lower(),
                "url": item.url
            }
            for item in items
        ])
        df.dropna(subset=['date'], inplace=True)
        df.drop_duplicates(subset=['url', 'date'], inplace=True) # Remove duplicate articles
        df.sort_values('date', inplace=True)

        # --- 2. Temporal Feature Engineering ---
        triggers_df = df[df['type'] == 'TRIGGER_EVENT'].copy()
        crimes_df = df[df['type'] != 'TRIGGER_EVENT'].copy()

        # Granularity from Config
        granularity = getattr(config, 'granularity', 'W')
        
        # Agregación Dinámica
        daily_triggers = triggers_df.set_index('date').resample(granularity).size().rename('trigger_count')
        daily_trigger_relevance = triggers_df.set_index('date')['relevance'].resample(granularity).sum().rename('trigger_relevance_sum')
        daily_crimes = crimes_df.set_index('date').resample(granularity).size().rename('crime_count')

        features_df = pd.concat([daily_triggers, daily_trigger_relevance], axis=1).fillna(0)

        # Dynamic Horizon Calculation
        horizon_days = getattr(config, 'forecast_horizon', 7) or 7
        
        if granularity == 'D':
            horizon_units = horizon_days
            suffix = 'd'
        elif granularity == 'M':
            horizon_units = max(1, round(horizon_days / 30))
            suffix = 'm'
        else: # Default 'W'
            horizon_units = max(1, round(horizon_days / 7))
            suffix = 'w'
        
        # Features (X): Sum of triggers in the PAST X units
        features_df[f'triggers_last_{horizon_units}{suffix}'] = features_df['trigger_count'].rolling(window=horizon_units, min_periods=1).sum()
        features_df[f'relevance_last_{horizon_units}{suffix}'] = features_df['trigger_relevance_sum'].rolling(window=horizon_units, min_periods=1).sum()

        # Target (y): Sum of crimes in the NEXT X units
        features_df[f'crimes_next_{horizon_units}{suffix}'] = daily_crimes.rolling(window=horizon_units, min_periods=1).sum().shift(-horizon_units)

        model_data = features_df.dropna()

        min_samples = 10 if granularity == 'D' else 5
        if len(model_data) < min_samples:
            return self._generate_heuristic_result(config, items, f"Not enough overlapping data for temporal model ({granularity}).")

        X = model_data[[f'triggers_last_{horizon_units}{suffix}', f'relevance_last_{horizon_units}{suffix}']]
        y = model_data[f'crimes_next_{horizon_units}{suffix}']

        # --- 3. Train/Test Split ---
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, shuffle=False) # No shuffle for time series

        # --- 4. Multi-Model REGRESSION Training ---
        self.models = {
            "Random Forest Regressor": RandomForestRegressor(n_estimators=30, max_depth=10, random_state=42, n_jobs=-1),
            "XGBoost Regressor": XGBRegressor(objective='reg:squarederror', n_estimators=30, random_state=42, n_jobs=-1)
        }
        results = {}
        best_mse = float('inf')

        for name, model in self.models.items():
            model.fit(X_train, y_train)
            y_pred = model.predict(X_test)
            mse = mean_squared_error(y_test, y_pred)
            if mse < best_mse:
                best_mse = mse
                self.best_model_name = name
                self.best_model = model
            results[name] = {"mse": mse, "rmse": np.sqrt(mse)}

        # --- 5. Prediction & Output Generation ---
        last_features = features_df[[f'triggers_last_{horizon_units}{suffix}', f'relevance_last_{horizon_units}{suffix}']].iloc[-1:]
        predicted_crime_volume = self.best_model.predict(last_features)[0]

        max_observed_crimes = y.max() if not y.empty else 30
        # Model-based risk (Future Volume)
        model_risk = min(99.0, (predicted_crime_volume / max_observed_crimes) * 100 if max_observed_crimes > 0 else 50.0)

        # Calculate Zone Risks first to use in Global Risk
        zone_risks = self._calculate_zone_risks(df, model_risk)
        
        # Heuristic Risk (Current Activity) - Max risk of any single zone
        max_zone_risk = max([z['risk'] for z in zone_risks]) if zone_risks else 0
        
        # Final Global Risk is the HIGHER of the two (Conservative approach)
        final_risk_score = max(model_risk, max_zone_risk)

        full_series_predictions = self.best_model.predict(X)
        timeline_data = [{"day": str(date.date()), "risk_score": int(round(min(99, (pred / max_observed_crimes) * 100 if max_observed_crimes > 0 else 50)))}
                         for date, pred in zip(model_data.index, full_series_predictions)]

        # --- 6. Export DataFrame Samples for Visualization ---
        # Training set sample (first 10 rows)
        train_sample = X_train.copy()
        train_sample['target'] = y_train
        train_sample['date'] = train_sample.index.astype(str)
        training_data_sample = train_sample.head(10).reset_index(drop=True).to_dict('records')
        
        # Test set sample (first 10 rows)
        test_sample = X_test.copy()
        test_sample['target'] = y_test
        test_sample['date'] = test_sample.index.astype(str)
        test_data_sample = test_sample.head(10).reset_index(drop=True).to_dict('records')
        
        # Complete DataFrames for download
        train_full = X_train.copy()
        train_full['target'] = y_train
        train_full['date'] = train_full.index.astype(str)
        training_data_full = train_full.reset_index(drop=True).to_dict('records')
        
        test_full = X_test.copy()
        test_full['target'] = y_test
        test_full['date'] = test_full.index.astype(str)
        test_data_full = test_full.reset_index(drop=True).to_dict('records')

        # Guardar el modelo ganador para la fase de inferencia
        try:
            os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
            joblib.dump(self.best_model, self.model_path)
            print(f"[Predictor] Model '{self.best_model_name}' saved to {self.model_path}")
        except Exception as e:
            print(f"[Predictor] Warning: Failed to save model: {e}")

        return PredictionResult(
            risk_score=round(float(final_risk_score), 1),
            expected_crime_type=f"Volume: {round(float(predicted_crime_volume), 1)} incidents",
            affected_zones=self._extract_recent_zones(df),
            duration_days=int(horizon_days),
            confidence_interval=(float(max(0, final_risk_score - 10)), float(min(100, final_risk_score + 10))),
            feature_importance=[{"feature": name, "importance": int(round(imp * 100))} for name, imp in zip(X.columns, self.best_model.feature_importances_)],
            timeline_data=timeline_data,
            zone_risks=zone_risks,
            training_metrics=TrainingMetrics(
                accuracy=0, precision=0, recall=0,
                f1_score=results[self.best_model_name]['rmse'],
                confusion_matrix=[], 
                dataset_size=len(X_train),
                test_set_size=len(X_test)
            ),
            model_comparison=[{"model": name, "rmse": metrics["rmse"]} for name, metrics in results.items()],
            model_metadata=ModelMetadata(
                regressors=list(X.columns),
                targets=[f"Volume of crime reports in next {horizon_units} {suffix}"],
                training_steps=[
                    "1. Separated data into Triggers and Crimes.",
                    f"2. Created {granularity}-aggregated time series of events.",
                    f"3. Engineered features based on a {horizon_units}-{suffix} rolling window of past triggers.",
                    f"4. Defined target as the volume of crimes in the next {horizon_units} {suffix}.",
                    f"5. Selected {self.best_model_name} based on lowest Root Mean Squared Error (RMSE)."
                ],
                model_type=f"Supervised Time-Series Regression ({self.best_model_name})",
                data_period_start=str(model_data.index.min().date()),
                data_period_end=str(model_data.index.max().date())
            ),
            training_data_sample=training_data_sample,
            test_data_sample=test_data_sample,
            training_data_full=training_data_full,
            test_data_full=test_data_full
        )

    def predict_on_demand(self, new_items: List[ScrapedItem], config: ScrapingConfig) -> Dict[str, Any]:
        """
        Usa el modelo ya entrenado para predecir sobre un nuevo conjunto de datos de entrada.
        """
        if not os.path.exists(self.model_path):
            raise FileNotFoundError("No trained model found. Please run the training pipeline first.")

        # Cargar el modelo entrenado
        model = joblib.load(self.model_path)
        print(f"[Predictor] Model loaded from {self.model_path} for inference.")
        print(f"[Predictor] ===== INFERENCE DEBUG LOG =====")
        print(f"[Predictor] Input items count: {len(new_items)}")

        # Replicar la misma ingeniería de características que en el entrenamiento
        df = pd.DataFrame([
            {
                "date": pd.to_datetime(item.date, errors='coerce'),
                "type": item.type,
                "relevance": item.relevance_score
            }
            for item in new_items
        ])
        df.dropna(subset=['date'], inplace=True)
        df.sort_values('date', inplace=True)
        
        print(f"[Predictor] After date parsing: {len(df)} valid items")
        if len(df) > 0:
            print(f"[Predictor] Date range: {df['date'].min()} to {df['date'].max()}")

        triggers_df = df[df['type'] == 'TRIGGER_EVENT'].copy()
        print(f"[Predictor] Trigger events found: {len(triggers_df)}")
        
        if triggers_df.empty:
             print(f"[Predictor] WARNING: No trigger events found in input data!")
             return {
                "predicted_crime_volume": 0,
                "forecast_horizon": getattr(config, 'forecast_horizon', 7) or 7,
                "status": "warning",
                "message": "No trigger events found in input data."
            }

        # Granularity from Config
        granularity = getattr(config, 'granularity', 'W')

        # Agregación Dinámica
        daily_triggers = triggers_df.set_index('date').resample(granularity).size().rename('trigger_count')
        daily_trigger_relevance = triggers_df.set_index('date')['relevance'].resample(granularity).sum().rename('trigger_relevance_sum')
        
        features_df = pd.concat([daily_triggers, daily_trigger_relevance], axis=1).fillna(0)
        
        # Dynamic Horizon Calculation
        horizon_days = getattr(config, 'forecast_horizon', 7) or 7
        
        if granularity == 'D':
            horizon_units = horizon_days
            suffix = 'd'
        elif granularity == 'M':
            horizon_units = max(1, round(horizon_days / 30))
            suffix = 'm'
        else: # Default 'W'
            horizon_units = max(1, round(horizon_days / 7))
            suffix = 'w'
            
        print(f"[Predictor] Forecast horizon: {horizon_units} {suffix} ({horizon_days} days)")
        
        # Features (X): Sum of triggers in the PAST X units
        features_df[f'triggers_last_{horizon_units}{suffix}'] = features_df['trigger_count'].rolling(window=horizon_units, min_periods=1).sum()
        features_df[f'relevance_last_{horizon_units}{suffix}'] = features_df['trigger_relevance_sum'].rolling(window=horizon_units, min_periods=1).sum()

        # Usar el último dato disponible para la predicción
        if features_df.empty:
             print(f"[Predictor] ERROR: Features dataframe is empty after engineering!")
             return {
                "predicted_crime_volume": 0,
                "forecast_horizon": horizon_days,
                "status": "warning",
                "message": "Insufficient data for feature engineering."
            }

        last_features = features_df[[f'triggers_last_{horizon_units}{suffix}', f'relevance_last_{horizon_units}{suffix}']].iloc[-1:]
        
        # DEBUG: Print feature values before prediction
        print(f"[Predictor] ===== FEATURE VALUES (Last Row) =====")
        print(f"[Predictor] triggers_last_{horizon_units}{suffix}: {last_features.iloc[0][f'triggers_last_{horizon_units}{suffix}']}")
        print(f"[Predictor] relevance_last_{horizon_units}{suffix}: {last_features.iloc[0][f'relevance_last_{horizon_units}{suffix}']}")
        print(f"[Predictor] Feature shape: {last_features.shape}")
        print(f"[Predictor] Feature columns: {list(last_features.columns)}")
        
        # Ensure columns match model expectation (sklearn models might complain about feature names if passed as df)
        predicted_volume = model.predict(last_features)[0]
        
        print(f"[Predictor] ===== PREDICTION RESULT =====")
        print(f"[Predictor] Predicted crime volume: {predicted_volume}")
        print(f"[Predictor] =====================================")

        # Export inference data sample for visualization (last 10 rows)
        inference_sample = features_df.copy()
        inference_sample['date'] = inference_sample.index.astype(str)
        inference_data_sample = inference_sample.tail(10).reset_index(drop=True).to_dict('records')
        
        # Complete inference DataFrame for download
        inference_full = features_df.copy()
        inference_full['date'] = inference_full.index.astype(str)
        inference_data_full = inference_full.reset_index(drop=True).to_dict('records')

        return {
            "predicted_crime_volume": round(float(predicted_volume), 2),
            "forecast_horizon": horizon_days,
            "status": "success",
            "inference_data_sample": inference_data_sample,
            "inference_data_full": inference_data_full
        }

    def _extract_recent_zones(self, df: pd.DataFrame) -> List[str]:
        # Helper to get zones from triggers in the last 14 days
        recent_triggers = df[(df['type'] == 'TRIGGER_EVENT') & (df['date'] > df['date'].max() - pd.Timedelta(days=14))]
        zone_mentions = Counter()
        for text in recent_triggers['text']:
            for zone in self.known_zones:
                if zone.lower() in text:
                    zone_mentions[zone] += 1
        return [zone for zone, count in zone_mentions.most_common(5)]

    def _calculate_zone_risks(self, df: pd.DataFrame, global_risk: float) -> List[dict]:
        # Calculate risk for ALL known zones with MINIMUM baseline of 30
        recent_triggers = df[(df['type'] == 'TRIGGER_EVENT') & (df['date'] > df['date'].max() - pd.Timedelta(days=14))]
        zone_mentions = Counter()
        for text in recent_triggers['text']:
            for zone in self.known_zones:
                if zone.lower() in text:
                    zone_mentions[zone] += 1
        
        total_mentions = sum(zone_mentions.values())
        zone_risks = []
        
        # BASELINE: All zones start at 30 (minimum risk)
        BASELINE_RISK = 30
        
        for zone in self.known_zones:
            count = zone_mentions.get(zone, 0)
            
            # ONLY include zones that were actually mentioned
            if count == 0:
                continue
                
            if total_mentions > 0:
                zone_contribution = (count / total_mentions)
                # Zone risk = BASELINE (30) + proportional share of remaining risk (0-70)
                # If a zone has activity, it gets more of the 70-point range
                additional_risk = zone_contribution * 70
                zone_risk = BASELINE_RISK + additional_risk
            else:
                # No activity detected, all zones get baseline
                zone_risk = BASELINE_RISK
            
            zone_risks.append({"zone": zone, "risk": min(99, round(zone_risk))})
            
        # Sort by risk descending
        return sorted(zone_risks, key=lambda x: x['risk'], reverse=True)

    def _generate_heuristic_result(self, config, items, message="Insufficient Data for ML") -> PredictionResult:
        return PredictionResult(
            risk_score=10,
            expected_crime_type=message,
            affected_zones=[],
            duration_days=0,
            confidence_interval=(0, 0),
            feature_importance=[],
            timeline_data=[],
            zone_risks=[],
            training_metrics=TrainingMetrics(
                accuracy=0, precision=0, recall=0, f1_score=0,
                confusion_matrix=[], dataset_size=len(items)
            ),
            model_metadata=ModelMetadata(
                regressors=[], targets=[], training_steps=[message], model_type="Heuristic Fallback"
            )
        )
