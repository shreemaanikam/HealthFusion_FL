"""
Privacy accounting monitor.
"""
import json
from pathlib import Path

class PrivacyMonitor:
    """Monitor and account for privacy budget."""
    
    def __init__(self):
        """Initialize monitor."""
        self.rounds = []
        self.total_epsilon_spent = 0.0
        self.delta = 1e-5
        
    def track_round(self, round_num: int, dp_params: dict, clients_participated: int) -> None:
        """Track privacy cost of a single round."""
        epsilon = dp_params.get('epsilon_spent', 0.1)
        self.total_epsilon_spent += epsilon
        self.rounds.append({
            'round_num': round_num,
            'epsilon_spent': epsilon,
            'clients': clients_participated
        })
        
    def get_cumulative_privacy_budget(self) -> dict:
        """Get total privacy budget spent."""
        return {
            'total_epsilon': self.total_epsilon_spent,
            'delta': self.delta
        }
        
    def get_privacy_report(self) -> dict:
        """Get full privacy report."""
        return {
            'cumulative_budget': self.get_cumulative_privacy_budget(),
            'rounds': self.rounds,
            'status': 'ACTIVE'
        }
        
    def save_report(self, filepath: str) -> None:
        """Save report to file."""
        path = Path(filepath)
        path.parent.mkdir(parents=True, exist_ok=True)
        with open(path, 'w') as f:
            json.dump(self.get_privacy_report(), f, indent=4)
