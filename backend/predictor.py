import random
import math
from typing import List
from .models import PredictionResult, TrainingMetrics, ScrapingConfig

class Predictor:
    def __init__(self):
        pass

    def train_and_predict(self, config: ScrapingConfig, data_size: int) -> PredictionResult:
        # Mock training process and prediction generation
        
        # Calculate a pseudo-risk score based on inputs
        base_risk = 50
        if "Clan del Golfo" in config.target_organizations:
            base_risk += 15
        if "Cabecilla" in config.predictor_ranks:
            base_risk += 10
            
        risk_score = min(95, max(10, base_risk + random.randint(-5, 10)))
        
        expected_crime = config.target_crimes[0] if config.target_crimes else "Confrontación"
        
        # Generate affected zones
        zones = ['Manrique', 'Aranjuez', 'Bello', 'Robledo', 'San Javier']
        affected = random.sample(zones, k=random.randint(2, 4))
        
        # Generate feature importance
        features = [
            {"feature": "Org Influence", "importance": random.randint(40, 60)},
            {"feature": "Territory Volatility", "importance": random.randint(20, 40)},
            {"feature": "Recent Captures", "importance": random.randint(10, 30)}
        ]
        
        # Generate timeline
        timeline = []
        for i in range(7):
            day_risk = risk_score * math.exp(-0.1 * i) + random.randint(-2, 2)
            timeline.append({"day": f"Day +{i}", "risk_score": round(day_risk)})
            
        return PredictionResult(
            risk_score=risk_score,
            expected_crime_type=expected_crime,
            affected_zones=affected,
            duration_days=random.choice([7, 14, 21]),
            confidence_interval=(risk_score - 5, risk_score + 5),
            feature_importance=features,
            timeline_data=timeline,
            training_metrics=TrainingMetrics(
                accuracy=random.uniform(0.8, 0.92),
                precision=random.uniform(0.75, 0.88),
                recall=random.uniform(0.78, 0.9),
                f1_score=random.uniform(0.8, 0.89),
                confusion_matrix=[[random.randint(80, 100), random.randint(5, 15)], [random.randint(10, 20), random.randint(80, 100)]],
                dataset_size=data_size
            )
        )
