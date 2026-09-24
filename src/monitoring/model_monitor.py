"""
Model monitoring.
"""
import json
import numpy as np
from pathlib import Path
from collections import deque

class ModelMonitor:
    """Monitor model predictions and performance."""
    
    def __init__(self, max_samples: int = 1000):
        """Initialize monitor."""
        self.predictions = deque(maxlen=max_samples)
        self.probabilities = deque(maxlen=max_samples)
        self.features = deque(maxlen=max_samples)
        self.timestamps = deque(maxlen=max_samples)
        
    def track_prediction(self, prediction: int, probability: float, features: list, timestamp: str) -> None:
        """Track a single prediction."""
        self.predictions.append(prediction)
        self.probabilities.append(probability)
        self.features.append(features)
        self.timestamps.append(timestamp)
        
    def get_prediction_distribution(self) -> dict:
        """Get stats on predictions."""
        if not self.predictions:
            return {}
        preds = list(self.predictions)
        probs = list(self.probabilities)
        return {
            'positive_rate': float(np.mean(preds)),
            'mean_probability': float(np.mean(probs)),
            'std_probability': float(np.std(probs)),
            'count': len(preds)
        }
        
    def get_feature_distributions(self) -> dict:
        """Get feature stats."""
        if not self.features:
            return {}
        feats = np.array(list(self.features))
        return {
            'mean': np.mean(feats, axis=0).tolist(),
            'std': np.std(feats, axis=0).tolist()
        }
        
    def get_performance_metrics(self) -> dict:
        """Get mock performance metrics."""
        return {
            'f1_score': 0.85,
            'accuracy': 0.88
        }
        
    def get_status(self) -> dict:
        """Get monitor status."""
        return {
            'model_version': '1.0',
            'drift_status': 'NORMAL',
            'prediction_stats': self.get_prediction_distribution()
        }
        
    def save_snapshot(self, filepath: str) -> None:
        """Save snapshot to file."""
        path = Path(filepath)
        path.parent.mkdir(parents=True, exist_ok=True)
        with open(path, 'w') as f:
            json.dump(self.get_status(), f, indent=4)
