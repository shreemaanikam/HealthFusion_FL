"""
Aggregation metrics tracking.
"""
import json
from pathlib import Path
from typing import List, Dict, Any

class AggregationMetrics:
    """Class to track and save aggregation metrics per round."""
    
    def __init__(self):
        self.history = []
        
    def track(self, round_number: int, client_weights: List[float], client_metrics: List[Dict[str, Any]], aggregation_type: str) -> None:
        """Track metrics for a single round."""
        record = {
            "round_number": round_number,
            "client_weights": client_weights,
            "client_metrics": client_metrics,
            "aggregation_type": aggregation_type
        }
        self.history.append(record)
        
    def to_dict(self) -> List[Dict[str, Any]]:
        """Return history as a list of dictionaries."""
        return self.history
        
    def save(self, filepath: str) -> None:
        """Save metrics history to a JSON file."""
        path = Path(filepath)
        path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(path, "w") as f:
            json.dump(self.history, f, indent=4)
