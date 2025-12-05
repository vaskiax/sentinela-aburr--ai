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
from lightgbm import LGBMRegressor
from sklearn.metrics import mean_squared_error
from .models import PredictionResult, TrainingMetrics, ScrapingConfig, ModelMetadata, ScrapedItem
from .data_loader import DataLoader

class Predictor:
    def __init__(self, data_loader: DataLoader | None = None):
        # Load barrio → comuna index
        loader = data_loader or DataLoader()
        self.barrio_index = loader.get_barrio_index()
        
        # Extract valid comunas from barrio_index, filtering out None/NaN/empty values
        csv_comunas = sorted({
            b['comuna_nombre'] for b in self.barrio_index 
            if b.get('comuna_nombre') and str(b['comuna_nombre']).strip().lower() not in ['none', 'nan', '']
        })
        
        # FALLBACK: Known zones in Valle de Aburrá (Medellín comunas + metropolitan municipalities)
        known_zones_fallback = [
            # Medellín comunas (from combos_v2.csv)
            "Popular", "Santa Cruz", "Manrique", "Aranjuez", "Castilla",
            "Doce de Octubre", "Robledo", "Villa Hermosa", "Buenos Aires",
            "Candelaria", "Laureles", "La América", "San Javier", "Poblado",
            "Guayabal", "Belén",
            # Valle de Aburrá municipalities (not in CSV but appear in articles)
            "Itagüí", "Envigado", "Bello", "Copacabana", "Sabaneta",
            "La Estrella", "Caldas", "Barbosa", "Girardota"
        ]
        
        # Merge CSV comunas with fallback zones, ensuring no invalid values
        self.comuna_set = sorted(set(csv_comunas + known_zones_fallback))
        print(f"[Predictor] Loaded {len(csv_comunas)} comunas from barrio_index, {len(self.comuna_set)} total after merge", flush=True)
        
        self.models = {}
        self.best_model_name = "None"
        self.best_model = None
        # Use absolute path to ensure model can be found regardless of working directory
        backend_dir = os.path.dirname(os.path.abspath(__file__))
        self.model_path = os.path.join(backend_dir, "data", "sentinela_model.joblib")

    def _count_barrio_mentions(self, text: str) -> Counter:
        text_lower = str(text).lower()
        counts = Counter()
        for entry in self.barrio_index:
            barrio = entry.get('barrio', '')
            if not barrio:
                continue
            b_lower = str(barrio).lower()
            c = text_lower.count(b_lower)
            if c > 0:
                counts[barrio] += c
        return counts

    def _get_historical_max_zone_activity(self, df: pd.DataFrame, window_days: int = 14) -> float:
        """Max rolling sum of mentions per comuna (using barrio mentions + direct comuna mentions)."""
        triggers = df[df['type'] == 'TRIGGER_EVENT'].copy()
        if triggers.empty:
            return 10.0  # Fallback por defecto

        daily_zone_counts = []
        for date in sorted(triggers['date'].unique()):
            day_text = " ".join(triggers[triggers['date'] == date]['text'].tolist())
            day_text_lower = day_text.lower()
            comuna_counts: Dict[str, int] = {}
            
            # 1. Contar barrios y agregar a comunas
            barrio_counts = self._count_barrio_mentions(day_text)
            for barrio, cnt in barrio_counts.items():
                comuna = next((b['comuna_nombre'] for b in self.barrio_index if b['barrio'] == barrio), None)
                if not comuna:
                    continue
                comuna_counts[comuna] = comuna_counts.get(comuna, 0) + cnt
            
            # 2. FALLBACK: También buscar menciones directas de comunas
            for comuna in self.comuna_set:
                direct_count = day_text_lower.count(comuna.lower())
                if direct_count > 0:
                    comuna_counts[comuna] = comuna_counts.get(comuna, 0) + direct_count
            
            if comuna_counts:
                daily_zone_counts.append({"date": date, **comuna_counts})

        if not daily_zone_counts:
            return 10.0

        zone_df = pd.DataFrame(daily_zone_counts).set_index('date').fillna(0)
        rolling_zone_df = zone_df.rolling(window=f'{window_days}D', min_periods=1).sum()
        historical_max = rolling_zone_df.max().max()
        return float(historical_max) if historical_max > 5 else 5.0

    def _calculate_risk_level(self, risk_score: float) -> str:
        """Calcula el nivel de riesgo textual basado en el score numérico (0-100)"""
        if risk_score >= 70:
            return "CRITICAL"
        elif risk_score >= 50:
            return "HIGH"
        elif risk_score >= 30:
            return "ELEVATED"
        elif risk_score >= 10:
            return "MODERATE"
        else:
            return "LOW"

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
        
        # FILTER BY DATE RANGE from config
        if hasattr(config, 'date_range_start') and config.date_range_start:
            date_threshold = pd.to_datetime(config.date_range_start)
            original_count = len(df)
            df = df[df['date'] >= date_threshold]
            filtered_count = original_count - len(df)
            if filtered_count > 0:
                print(f"[Data Filter] Removed {filtered_count} articles before {config.date_range_start} ({original_count} → {len(df)})", flush=True)
            # Verify date range after filter
            if len(df) > 0:
                print(f"[Data Filter] DataFrame date range: {df['date'].min()} to {df['date'].max()}", flush=True)
        else:
            print(f"[Data Filter] WARNING: No date_range_start configured! config.date_range_start = {getattr(config, 'date_range_start', 'NOT SET')}", flush=True)
            if len(df) > 0:
                print(f"[Data Filter] Using FULL date range: {df['date'].min()} to {df['date'].max()}", flush=True)
        
        df.sort_values('date', inplace=True)

        # --- 2. Temporal Feature Engineering ---
        triggers_df = df[df['type'] == 'TRIGGER_EVENT'].copy()
        crimes_df = df[df['type'] != 'TRIGGER_EVENT'].copy()

        # Granularity from Config
        granularity = getattr(config, 'granularity', 'W')
        
        # Determine date range for resampling
        date_threshold = None
        if hasattr(config, 'date_range_start') and config.date_range_start:
            date_threshold = pd.to_datetime(config.date_range_start)
            print(f"[Resample] Date threshold for limiting resampled data: {date_threshold}", flush=True)
        
        # Agregación Dinámica
        daily_triggers = triggers_df.set_index('date').resample(granularity).size().rename('trigger_count')
        daily_trigger_relevance = triggers_df.set_index('date')['relevance'].resample(granularity).sum().rename('trigger_relevance_sum')
        daily_crimes = crimes_df.set_index('date').resample(granularity).size().rename('crime_count')

        features_df = pd.concat([daily_triggers, daily_trigger_relevance], axis=1).fillna(0)
        
        # CRITICAL: After resample, limit index to date_range_start onwards
        # This prevents resample from creating entries for old periods
        if date_threshold is not None:
            original_features_count = len(features_df)
            features_df = features_df[features_df.index >= date_threshold]
            filtered_features_count = original_features_count - len(features_df)
            if filtered_features_count > 0:
                print(f"[Data Filter] Removed {filtered_features_count} resampled rows before {config.date_range_start} ({original_features_count} → {len(features_df)})", flush=True)
            if len(features_df) > 0:
                print(f"[Data Filter] Features date range after filter: {features_df.index.min()} to {features_df.index.max()}", flush=True)

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
        
        # PASO 4: Log explícito de validación de granularidad
        approx_days = horizon_units * (7 if granularity=='W' else (30 if granularity=='M' else 1))
        print(f"[Horizon Logic] Config Days: {horizon_days} | Granularity: {granularity} -> Converted to {horizon_units} units of {suffix} ({approx_days} days approx)")
        print(f"[Horizon Logic] Lookup window: Last {horizon_units} {suffix} of triggers will predict next {horizon_units} {suffix} of crimes")
        
        # Features (X): Sum of triggers in the PAST X units
        features_df[f'triggers_last_{horizon_units}{suffix}'] = features_df['trigger_count'].rolling(window=horizon_units, min_periods=1).sum()
        features_df[f'relevance_last_{horizon_units}{suffix}'] = features_df['trigger_relevance_sum'].rolling(window=horizon_units, min_periods=1).sum()
        
        # NEW: Feature Engineering - Trigger Velocity
        # Calculate the percentage change in trigger count to capture ACCELERATION of police actions
        # This helps distinguish between steady state and escalating situations
        features_df['trigger_velocity'] = features_df['trigger_count'].pct_change().fillna(0)
        # Cap extreme velocity values to avoid outliers overwhelming the model
        features_df['trigger_velocity'] = features_df['trigger_velocity'].clip(-2.0, 2.0)
        print(f"[Feature Engineering] Added trigger_velocity: min={features_df['trigger_velocity'].min():.3f}, max={features_df['trigger_velocity'].max():.3f}")

        # Target (y): Sum of crimes in the NEXT X units
        features_df[f'crimes_next_{horizon_units}{suffix}'] = daily_crimes.rolling(window=horizon_units, min_periods=1).sum().shift(-horizon_units)

        model_data = features_df.dropna()
        
        # ADDITIONAL FILTER: Remove rows from model_data that fall BEFORE the date threshold
        # This ensures Historical Correlation chart only shows data within configured range
        if hasattr(config, 'date_range_start') and config.date_range_start:
            date_threshold = pd.to_datetime(config.date_range_start)
            original_model_count = len(model_data)
            model_data = model_data[model_data.index >= date_threshold]
            filtered_model_count = original_model_count - len(model_data)
            if filtered_model_count > 0:
                print(f"[Data Filter] Removed {filtered_model_count} model_data rows before {config.date_range_start} ({original_model_count} → {len(model_data)})", flush=True)

        min_samples = 10 if granularity == 'D' else 5
        if len(model_data) < min_samples:
            return self._generate_heuristic_result(config, items, f"Not enough overlapping data for temporal model ({granularity}).")

        # Include trigger_velocity as a predictor alongside volume and relevance
        X = model_data[[f'triggers_last_{horizon_units}{suffix}', f'relevance_last_{horizon_units}{suffix}', 'trigger_velocity']]
        y = model_data[f'crimes_next_{horizon_units}{suffix}']

        # --- 3. Train/Test Split ---
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, shuffle=False) # No shuffle for time series

        # --- 4. Multi-Model REGRESSION Training ---
        self.models = {
            "Random Forest Regressor": RandomForestRegressor(n_estimators=30, max_depth=10, random_state=42, n_jobs=-1),
            "XGBoost Regressor": XGBRegressor(objective='reg:squarederror', n_estimators=30, random_state=42, n_jobs=-1),
            "LightGBM Regressor": LGBMRegressor(objective='regression', n_estimators=30, random_state=42, n_jobs=-1, verbosity=-1)
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

        # --- 5A. CÁLCULO A: Evaluación en Test Set (Validación) ---
        print(f"[Dashboard Híbrido] === CÁLCULO A: TEST SET EVALUATION ===")
        # Predecir sobre el último punto del Test Set para validación
        test_features_last = X_test.iloc[-1:]  # Última ventana del test
        test_predicted_volume = self.best_model.predict(test_features_last)[0]
        test_actual_volume = y_test.iloc[-1] if len(y_test) > 0 else None
        print(f"[Test Eval] Predicted: {test_predicted_volume:.2f}, Actual: {test_actual_volume if test_actual_volume is not None else 'N/A'}")
        
        # --- 5B. CÁLCULO B: Proyección Operativa (Todo el Dataset) ---
        print(f"[Dashboard Híbrido] === CÁLCULO B: FULL DATASET PROJECTION ===")
        # Usar la última ventana disponible de TODO el dataset para proyección futura
        last_features = features_df[[f'triggers_last_{horizon_units}{suffix}', f'relevance_last_{horizon_units}{suffix}', 'trigger_velocity']].iloc[-1:]

        # DEBUG: imprimir la última fila de features para comparar contra inferencia
        print("[DEBUG TRAIN] ===== FEATURE VALUES (Last Row) =====")
        print(last_features)
        print("[DEBUG TRAIN] triggers_last_{0}{1}={2}".format(horizon_units, suffix, last_features.iloc[0][f'triggers_last_{horizon_units}{suffix}']))
        print("[DEBUG TRAIN] relevance_last_{0}{1}={2}".format(horizon_units, suffix, last_features.iloc[0][f'relevance_last_{horizon_units}{suffix}']))
        print("[DEBUG TRAIN] trigger_velocity={0}".format(last_features.iloc[0]['trigger_velocity']))

        predicted_crime_volume = self.best_model.predict(last_features)[0]
        print(f"[Full Projection] Using last window of entire dataset -> Predicted Volume: {predicted_crime_volume:.2f}")

        # --- NUEVO: CALIBRACIÓN DINÁMICA ---
        # 1. Máximo Volumen del Modelo (Target Y histórico)
        max_observed_crimes = float(y.max()) if not y.empty else 30.0
        
        # 2. Máxima Actividad de Zona (Heurística Histórica basada en data real)
        max_observed_zone_activity = self._get_historical_max_zone_activity(df, window_days=14)
        print(f"[Training] Calibrated Max Zone Activity: {max_observed_zone_activity}")

        # A. Riesgo del Modelo (Normalizado contra máximo histórico)
        model_risk = min(99.0, (predicted_crime_volume / max_observed_crimes) * 100 if max_observed_crimes > 0 else 50.0)

        # B. Riesgo de Zona (Normalizado contra el PEOR caso histórico, no contra 10 fijo)
        zone_risks, max_zone_risk = self._calculate_zone_risks(df, benchmark_max=max_observed_zone_activity)
        print(f"[CALC] Zone Risk based on {len(zone_risks)} zones, max mentions in history: {max_observed_zone_activity:.0f}")
        if zone_risks:
            print(f"[CALC] Top zone risk: {zone_risks[0]['zone']} = {zone_risks[0]['risk']:.1f}%")
        
        # C. Riesgo Global (Promedio Ponderado: 70% Modelo + 30% Zona)
        final_risk_score = (model_risk * 0.7) + (max_zone_risk * 0.3)
        print(f"[CALC] Final Risk Score = (70% × {model_risk:.1f}) + (30% × {max_zone_risk:.1f}) = {final_risk_score:.1f}%")
        
        # --- CÁLCULO A: Test Evaluation Metrics ---
        # Calcular riesgo en test set usando el volumen predicho en test
        test_model_risk = min(99.0, (test_predicted_volume / max_observed_crimes) * 100 if max_observed_crimes > 0 else 50.0)
        # Para test, no tenemos contexto temporal completo para zone_risk, usamos el actual
        test_zone_risk = max_zone_risk  # Proxy: mismo contexto zonal
        test_risk_score = (test_model_risk * 0.7) + (test_zone_risk * 0.3)
        test_risk_level = self._calculate_risk_level(test_risk_score)
        print(f"[Test Eval] Test Risk Score = (70% × {test_model_risk:.1f}) + (30% × {test_zone_risk:.1f}) = {test_risk_score:.1f}% [{test_risk_level}]")
        
        # Empaquetar evaluación del test set
        test_evaluation = {
            "test_risk_score": round(float(test_risk_score), 1),
            "test_predicted_volume": round(float(test_predicted_volume), 2),
            "test_actual_volume": round(float(test_actual_volume), 2) if test_actual_volume is not None else None,
            "test_risk_level": test_risk_level,
            "test_model_risk": round(float(test_model_risk), 1),
            "test_zone_risk": round(float(test_zone_risk), 1),
            "rmse": round(float(results[self.best_model_name]['rmse']), 2),
            "note": "Calculated on last point of 20% test set (unseen data during training)"
        }

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
            
            # Also save model metadata for inference (granularity, horizon, calibration, etc.)
            import json
            metadata_path = self.model_path.replace('.joblib', '_metadata.json')
            metadata = {
                'granularity': granularity,
                'horizon_days': horizon_days,
                'horizon_units': horizon_units,
                'horizon_suffix': suffix,
                'model_name': self.best_model_name,
                'max_observed_crimes': max_observed_crimes,  # NUEVO: calibración del modelo
                'max_observed_zone_activity': max_observed_zone_activity  # NUEVO: calibración de zonas
            }
            with open(metadata_path, 'w') as f:
                json.dump(metadata, f)
            print(f"[Predictor] Model metadata saved to {metadata_path}")
        except Exception as e:
            print(f"[Predictor] Warning: Failed to save model: {e}")

        return PredictionResult(
            # === PREDICCIÓN ACTUAL (Proyección Operativa - Todo el Dataset) ===
            risk_score=round(float(final_risk_score), 1),
            risk_level=self._calculate_risk_level(final_risk_score),
            model_risk_score=round(float(model_risk), 1),
            zone_risk_score=round(float(max_zone_risk), 1),
            predicted_volume=round(float(predicted_crime_volume), 2),  # Volumen proyectado FUTURO
            expected_crime_type=f"Volume: {round(float(predicted_crime_volume), 1)} incidents",
            affected_zones=self._extract_recent_zones(df),
            duration_days=int(horizon_days),
            confidence_interval=(float(max(0, final_risk_score - 10)), float(min(100, final_risk_score + 10))),
            
            # === VALIDACIÓN DEL MODELO (Test Set Evaluation) ===
            test_evaluation=test_evaluation,
            
            # === MÉTRICAS TÉCNICAS ===
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
                data_period_end=str(model_data.index.max().date()),
                granularity=granularity,
                horizon_days=horizon_days,
                horizon_units=horizon_units,
                horizon_suffix=suffix,
                max_observed_crimes=max_observed_crimes,
                max_observed_zone_activity=max_observed_zone_activity
            ),
            training_data_sample=training_data_sample,
            test_data_sample=test_data_sample,
            training_data_full=training_data_full,
            test_data_full=test_data_full,
            # Audit trail: Calculation breakdown for transparency
            calculation_breakdown={
                "raw_predicted_volume": float(predicted_crime_volume),
                "historical_max_volume": float(max_observed_crimes),
                "model_risk_formula": f"({predicted_crime_volume:.2f} / {max_observed_crimes:.2f}) * 100",
                "model_risk_score": float(model_risk),
                "historical_max_zone_mentions": float(max_observed_zone_activity),
                "max_zone_mentions_current": float(max_zone_risk) if max_zone_risk > 0 else 0.0,
                "zone_risk_formula": f"(mentions / {max_observed_zone_activity:.2f}) * 100",
                "zone_risk_score": float(max_zone_risk),
                "final_risk_score": float(final_risk_score),
                "risk_calculation": "0.7 * model_risk + 0.3 * zone_risk"
            }
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
        
        # Load model metadata (granularity, horizon, etc.)
        import json
        metadata_path = self.model_path.replace('.joblib', '_metadata.json')
        training_metadata = {}
        if os.path.exists(metadata_path):
            try:
                with open(metadata_path, 'r') as f:
                    training_metadata = json.load(f)
                print(f"[Predictor] Model metadata loaded from {metadata_path}")
                print(f"[Predictor] Training granularity: {training_metadata.get('granularity')}")
            except Exception as e:
                print(f"[Predictor] Warning: Failed to load metadata: {e}")
        
        print(f"[Predictor] ===== INFERENCE DEBUG LOG =====")
        print(f"[Predictor] Input items count: {len(new_items)}")

        # CHECK FOR MANUAL PARAMETERS (extracted_metadata)
        # If user provides manual_trigger_volume, manual_relevance_score, and manual_trigger_velocity, use them directly
        manual_trigger_volume = None
        manual_relevance_score = None
        manual_trigger_velocity = None
        
        for item in new_items:
            if hasattr(item, 'extracted_metadata') and item.extracted_metadata:
                if isinstance(item.extracted_metadata, dict):
                    manual_trigger_volume = item.extracted_metadata.get('manual_trigger_volume')
                    manual_relevance_score = item.extracted_metadata.get('manual_relevance_score')
                    manual_trigger_velocity = item.extracted_metadata.get('manual_trigger_velocity')
                    if manual_trigger_volume is not None and manual_relevance_score is not None and manual_trigger_velocity is not None:
                        print(f"[Predictor] MANUAL PARAMETERS DETECTED:")
                        print(f"[Predictor] - Manual trigger volume: {manual_trigger_volume}")
                        print(f"[Predictor] - Manual relevance score: {manual_relevance_score}")
                        print(f"[Predictor] - Manual trigger velocity: {manual_trigger_velocity}")
                        break

        # Replicar la misma ingeniería de características que en el entrenamiento
        df = pd.DataFrame([
            {
                "date": pd.to_datetime(item.date, errors='coerce'),
                "type": item.type,
                "relevance": item.relevance_score,
                "text": item.headline or item.snippet or "",
                "url": getattr(item, "url", "") or ""
            }
            for item in new_items
        ])
        df.dropna(subset=['date'], inplace=True)
        # Deduplicate exactly the same way as training (url + date) to avoid drift in sums
        df.drop_duplicates(subset=['url', 'date'], inplace=True)
        df.sort_values('date', inplace=True)
        
        print(f"[Predictor] After date parsing: {len(df)} valid items")
        if len(df) > 0:
            print(f"[Predictor] Date range: {df['date'].min()} to {df['date'].max()}")

        triggers_df = df[df['type'] == 'TRIGGER_EVENT'].copy()
        print(f"[Predictor] Trigger events found: {len(triggers_df)}")
        
        if triggers_df.empty:
             print(f"[Predictor] WARNING: No trigger events found in input data!")
             max_observed_crimes = training_metadata.get('max_observed_crimes', 30.0)
             max_observed_zone_activity = training_metadata.get('max_observed_zone_activity', 10.0)
             return PredictionResult(
                risk_score=0,
                risk_level="LOW",
                model_risk_score=0,
                zone_risk_score=0,
                predicted_volume=0,
                expected_crime_type="No data",
                affected_zones=[],
                duration_days=7,
                confidence_interval=(0.0, 10.0),
                feature_importance=[],
                timeline_data=[],
                zone_risks=[],
                training_metrics=TrainingMetrics(accuracy=0, precision=0, recall=0, f1_score=0, confusion_matrix=[], dataset_size=0, test_set_size=0),
                model_metadata=ModelMetadata(
                    regressors=[],
                    targets=[],
                    training_steps=[],
                    model_type="Inference",
                    granularity=training_metadata.get('granularity', getattr(config, 'granularity', 'W')),
                    horizon_days=getattr(config, 'forecast_horizon', 7) or 7,
                    horizon_units=0,
                    horizon_suffix='d',
                    max_observed_crimes=max_observed_crimes,
                    max_observed_zone_activity=max_observed_zone_activity
                ),
                status="warning",
                warning_message="No trigger events found in input data."
            )

        # Use granularity from training (stored metadata), not from config
        # This ensures consistency between training and inference feature engineering
        granularity = training_metadata.get('granularity', getattr(config, 'granularity', 'W'))
        print(f"[Predictor] Using granularity for inference: {granularity}")

        # Agregación Dinámica
        daily_triggers = triggers_df.set_index('date').resample(granularity).size().rename('trigger_count')
        daily_trigger_relevance = triggers_df.set_index('date')['relevance'].resample(granularity).sum().rename('trigger_relevance_sum')
        
        features_df = pd.concat([daily_triggers, daily_trigger_relevance], axis=1).fillna(0)
        
        # Dynamic Horizon Calculation - USE TRAINING VALUES FROM METADATA
        # This ensures we use the EXACT same horizon that was used during training
        horizon_days = training_metadata.get('horizon_days', 7)
        horizon_units = training_metadata.get('horizon_units', None)
        suffix = training_metadata.get('horizon_suffix', None)
        
        # If metadata doesn't have these, calculate from granularity
        if horizon_units is None or suffix is None:
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
        
        # NEW: Feature Engineering - Trigger Velocity
        # Calculate the percentage change in trigger count (same as in training)
        features_df['trigger_velocity'] = features_df['trigger_count'].pct_change().fillna(0)
        features_df['trigger_velocity'] = features_df['trigger_velocity'].clip(-2.0, 2.0)
        print(f"[Predictor] Added trigger_velocity for inference: min={features_df['trigger_velocity'].min():.3f}, max={features_df['trigger_velocity'].max():.3f}")

        # Usar el último dato disponible para la predicción
        last_features = features_df[[f'triggers_last_{horizon_units}{suffix}', f'relevance_last_{horizon_units}{suffix}', 'trigger_velocity']].iloc[-1:]

        # OVERRIDE FEATURES WITH MANUAL PARAMETERS IF PROVIDED
        if manual_trigger_volume is not None and manual_relevance_score is not None and manual_trigger_velocity is not None:
            print(f"[Predictor] ===== USING MANUAL PARAMETERS FOR PREDICTION =====")
            # Create a DataFrame with manual values (including manual trigger_velocity if provided)
            last_features = pd.DataFrame({
                f'triggers_last_{horizon_units}{suffix}': [float(manual_trigger_volume)],
                f'relevance_last_{horizon_units}{suffix}': [float(manual_relevance_score)],
                'trigger_velocity': [float(manual_trigger_velocity)]
            })
            print(f"[Predictor] Manual features created:")
            print(f"[Predictor] triggers_last_{horizon_units}{suffix}: {float(manual_trigger_volume)}")
            print(f"[Predictor] relevance_last_{horizon_units}{suffix}: {float(manual_relevance_score)}")
            print(f"[Predictor] trigger_velocity: {float(manual_trigger_velocity)} (manual input)")
        
        # DEBUG: Print feature values before prediction
        # Print raw trigger data for last period
        print(f"[Predictor] === RAW TRIGGERS (Last {horizon_units} {suffix}) ===")
        last_period_triggers = triggers_df[triggers_df['date'] >= (triggers_df['date'].max() - pd.Timedelta(days=max(horizon_days, 30)))]
        for _, row in last_period_triggers.sort_values('date', ascending=False).head(10).iterrows():
            print(f"[Predictor]   {row['date'].date()}: relevance={row['relevance']:.2f}")
        
        print(f"[Predictor] ===== FEATURE VALUES (Last Row) =====")
        print(f"[Predictor] triggers_last_{horizon_units}{suffix}: {last_features.iloc[0][f'triggers_last_{horizon_units}{suffix}']}")
        print(f"[Predictor] relevance_last_{horizon_units}{suffix}: {last_features.iloc[0][f'relevance_last_{horizon_units}{suffix}']}")
        print(f"[Predictor] trigger_velocity: {last_features.iloc[0]['trigger_velocity']}")
        print(f"[Predictor] Feature shape: {last_features.shape}")
        print(f"[Predictor] Feature columns: {list(last_features.columns)}")
        
        # Ensure columns match model expectation (sklearn models might complain about feature names if passed as df)
        predicted_volume = model.predict(last_features)[0]
        
        print(f"[Predictor] ===== PREDICTION RESULT =====")
        print(f"[Predictor] Predicted crime volume: {predicted_volume}")
        print(f"[Predictor] =====================================")

        # --- NUEVO: CALIBRACIÓN DINÁMICA EN INFERENCIA ---
        # Recuperar valores de calibración del entrenamiento
        max_observed_crimes = training_metadata.get('max_observed_crimes', 30.0)
        max_observed_zone_activity = training_metadata.get('max_observed_zone_activity', 10.0)
        
        # CHECK DE DATA SCARCITY (Advertencia de Lag)
        warning_msg = None
        if not df.empty:
            data_duration_days = (df['date'].max() - df['date'].min()).days
            horizon_days_needed = training_metadata.get('horizon_days', 7)
            
            # Si tengo menos días de historia que los que el modelo necesita para mirar atrás
            if data_duration_days < horizon_days_needed:
                warning_msg = f"ADVERTENCIA: Datos insuficientes. Tienes {data_duration_days} días de historia, pero el modelo requiere una ventana de {horizon_days_needed} días. El riesgo podría estar subestimado."
                print(f"[Predictor] Data Scarcity Warning: {warning_msg}")

        # === RISK CALCULATION WITH TRANSPARENCY ===
        # 1. Riesgo del Modelo (Dinámico, normalizado)
        # Formula: (Predicted_Volume / Historical_Max_Volume) * 100
        # This normalizes current prediction against the worst case seen in history
        model_risk = min(99.0, (predicted_volume / max_observed_crimes) * 100 if max_observed_crimes > 0 else 50.0)
        print(f"[CALC] Model Risk = ({predicted_volume:.2f} / {max_observed_crimes:.2f}) * 100 = {model_risk:.1f}%")
        
        # 2. Riesgo de Zona (Dinámico usando el benchmark histórico)
        # IMPORTANT: When manual parameters are used, there's no actual text data for zone extraction
        # So zone_risk should be 0, and overall risk should be based ONLY on model_risk
        if manual_trigger_volume is not None and manual_relevance_score is not None and manual_trigger_velocity is not None:
            print(f"[Predictor] Manual parameters detected - skipping zone risk calculation (no real text data)")
            zone_risks = []
            max_zone_risk_val = 0.0
        else:
            zone_risks, max_zone_risk_val = self._calculate_zone_risks(df, benchmark_max=max_observed_zone_activity)
            print(f"[CALC] Zone Risk based on {len(zone_risks)} zones, max mentions in history: {max_observed_zone_activity:.0f}")
            if zone_risks:
                print(f"[CALC] Top zone risk: {zone_risks[0]['zone']} = {zone_risks[0]['risk']:.1f}%")

        # 3. Global (Promedio Ponderado: 70% Modelo + 30% Zona)
        final_risk_score = (model_risk * 0.7) + (max_zone_risk_val * 0.3)
        print(f"[CALC] Final Risk Score = (70% × {model_risk:.1f}) + (30% × {max_zone_risk_val:.1f}) = {final_risk_score:.1f}%")

        # Export inference data sample for visualization (last 10 rows)
        # If manual parameters were used, create a synthetic row showing those values
        if manual_trigger_volume is not None and manual_relevance_score is not None and manual_trigger_velocity is not None:
            inference_sample = pd.DataFrame({
                f'triggers_last_{horizon_units}{suffix}': [float(manual_trigger_volume)],
                f'relevance_last_{horizon_units}{suffix}': [float(manual_relevance_score)],
                'trigger_count': [float(manual_trigger_volume)],
                'trigger_relevance_sum': [float(manual_relevance_score)],
                'trigger_velocity': [float(manual_trigger_velocity)]
            })
            inference_sample['date'] = pd.Timestamp.now().strftime('%Y-%m-%d')
            inference_data_sample = inference_sample.reset_index(drop=True).to_dict('records')
            inference_data_full = inference_data_sample  # Same as sample for manual inputs
            print(f"[Predictor] Created synthetic inference data for manual parameters")
        else:
            inference_sample = features_df.copy()
            inference_sample['date'] = inference_sample.index.astype(str)
            inference_data_sample = inference_sample.tail(10).reset_index(drop=True).to_dict('records')
            
            # Complete inference DataFrame for download
            inference_full = features_df.copy()
            inference_full['date'] = inference_full.index.astype(str)
            inference_data_full = inference_full.reset_index(drop=True).to_dict('records')

        return PredictionResult(
            risk_score=round(float(final_risk_score), 1),
            risk_level=self._calculate_risk_level(final_risk_score),
            model_risk_score=round(float(model_risk), 1),
            zone_risk_score=round(float(max_zone_risk_val), 1),
            predicted_volume=round(float(predicted_volume), 2),
            expected_crime_type=f"Volume: {round(float(predicted_volume), 2)} incidents",
            affected_zones=self._extract_recent_zones(df),
            duration_days=horizon_days,
            confidence_interval=(float(max(0, final_risk_score - 10)), float(min(100, final_risk_score + 10))),
            feature_importance=[],  # No calculado en inferencia
            timeline_data=[],  # No calculado en inferencia
            zone_risks=zone_risks,
            training_metrics=TrainingMetrics(
                accuracy=0, precision=0, recall=0,
                f1_score=0,
                confusion_matrix=[], 
                dataset_size=0,
                test_set_size=0
            ),
            model_metadata=ModelMetadata(
                regressors=[],
                targets=[],
                training_steps=[],
                model_type="Inference",
                granularity=training_metadata.get('granularity', granularity),
                horizon_days=training_metadata.get('horizon_days', horizon_days),
                horizon_units=training_metadata.get('horizon_units', horizon_units),
                horizon_suffix=training_metadata.get('horizon_suffix', suffix),
                max_observed_crimes=max_observed_crimes,
                max_observed_zone_activity=max_observed_zone_activity
            ),
            status="success",
            warning_message=warning_msg,
            inference_data_sample=inference_data_sample,
            inference_data_full=inference_data_full,
            # Audit trail: Calculation breakdown for transparency
            calculation_breakdown={
                "raw_predicted_volume": float(predicted_volume),
                "historical_max_volume": float(max_observed_crimes),
                "model_risk_formula": f"({predicted_volume:.2f} / {max_observed_crimes:.2f}) * 100",
                "model_risk_score": float(model_risk),
                "historical_max_zone_mentions": float(max_observed_zone_activity),
                "zone_risk_current_mentions": float(max_zone_risk_val / 100 * max_observed_zone_activity) if max_zone_risk_val > 0 else 0.0,
                "zone_risk_formula": f"({max_zone_risk_val / 100 * max_observed_zone_activity:.2f} / {max_observed_zone_activity:.2f}) * 100" if max_zone_risk_val > 0 else "No zone data",
                "zone_risk_score": float(max_zone_risk_val),
                "final_risk_score": float(final_risk_score),
                "risk_calculation": "0.7 * model_risk + 0.3 * zone_risk",
                "manual_parameters_used": manual_trigger_volume is not None and manual_relevance_score is not None and manual_trigger_velocity is not None
            }
        )


    def _extract_recent_zones(self, df: pd.DataFrame) -> List[str]:
        # Helper to get zones (comunas) from triggers in the last 14 days using barrio mentions + direct comuna mentions
        if df.empty or 'text' not in df.columns:
            return []
        recent_triggers = df[(df['type'] == 'TRIGGER_EVENT') & (df['date'] > df['date'].max() - pd.Timedelta(days=14))]
        comuna_mentions: Dict[str, int] = {}
        for text in recent_triggers['text']:
            text_lower = str(text).lower()
            
            # Contar barrios y agregar a comunas
            counts = self._count_barrio_mentions(text)
            for barrio, cnt in counts.items():
                comuna = next((b['comuna_nombre'] for b in self.barrio_index if b['barrio'] == barrio), None)
                if not comuna:
                    continue
                comuna_mentions[comuna] = comuna_mentions.get(comuna, 0) + cnt
            
            # FALLBACK: También buscar menciones directas de comunas
            for comuna in self.comuna_set:
                direct_count = text_lower.count(comuna.lower())
                if direct_count > 0:
                    comuna_mentions[comuna] = comuna_mentions.get(comuna, 0) + direct_count
        
        return [zona for zona, count in sorted(comuna_mentions.items(), key=lambda x: x[1], reverse=True)[:5]]

    def _calculate_zone_risks(self, df: pd.DataFrame, benchmark_max: float = 10.0) -> Tuple[List[dict], float]:
        """Calcula riesgo por comuna usando menciones de barrios + menciones directas de comunas.

        Retorna (lista_zone_risks, max_zone_risk_score) donde cada entrada incluye:
        { zone: comuna, risk: %, mentions: total_menciones, breakdown: [{barrio, mentions}] }
        """
        if df.empty or 'text' not in df.columns:
            return [], 0.0

        recent_triggers = df[(df['type'] == 'TRIGGER_EVENT') & (df['date'] > df['date'].max() - pd.Timedelta(days=14))]
        if recent_triggers.empty:
            return [], 0.0

        # Conteo por barrio y agregado a comuna
        comuna_mentions: Dict[str, int] = {}
        comuna_breakdown: Dict[str, Dict[str, int]] = {}

        for text in recent_triggers['text']:
            text_lower = str(text).lower()
            
            # 1. Contar barrios y agregar a comunas
            counts = self._count_barrio_mentions(text)
            for barrio, cnt in counts.items():
                comuna = next((b['comuna_nombre'] for b in self.barrio_index if b['barrio'] == barrio), None)
                if not comuna:
                    continue
                comuna_mentions[comuna] = comuna_mentions.get(comuna, 0) + cnt
                bd = comuna_breakdown.setdefault(comuna, {})
                bd[barrio] = bd.get(barrio, 0) + cnt
            
            # 2. FALLBACK: También buscar menciones directas de comunas (para "Itagüí", "La Candelaria", etc.)
            # Solo si no se encontraron barrios, para evitar doble conteo
            for comuna in self.comuna_set:
                comuna_lower = comuna.lower()
                # Buscar el nombre de la comuna directamente
                direct_count = text_lower.count(comuna_lower)
                if direct_count > 0:
                    comuna_mentions[comuna] = comuna_mentions.get(comuna, 0) + direct_count
                    bd = comuna_breakdown.setdefault(comuna, {})
                    # Marcar como mención directa de comuna
                    bd[f"({comuna})"] = bd.get(f"({comuna})", 0) + direct_count

        zone_risks = []
        max_current_risk = 0.0

        for comuna in self.comuna_set:
            count = comuna_mentions.get(comuna, 0)
            risk = min(99.0, (count / benchmark_max) * 100 if benchmark_max > 0 else 50.0) if count > 0 else 0.0
            breakdown_list = [
                {"barrio": b, "mentions": m}
                for b, m in sorted(comuna_breakdown.get(comuna, {}).items(), key=lambda x: x[1], reverse=True)
            ]
            
            # SKIP invalid zones (None, NaN, empty strings)
            if not comuna or str(comuna).lower() in ['none', 'nan', '']:
                print(f"[CALC] Skipping invalid zone: {repr(comuna)}", flush=True)
                continue
            
            zone_risks.append({
                "zone": comuna,
                "risk": round(risk, 1),
                "mentions": int(count),
                "breakdown": breakdown_list
            })
            if risk > max_current_risk:
                max_current_risk = risk

        return sorted(zone_risks, key=lambda x: x['risk'], reverse=True), max_current_risk

    def _generate_heuristic_result(self, config, items, message="Insufficient Data for ML") -> PredictionResult:
        return PredictionResult(
            risk_score=10,
            risk_level="LOW",
            model_risk_score=10.0,
            zone_risk_score=0.0,
            predicted_volume=0,
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
            ),
            warning_message=message
        )
