"""
Drift detection.
"""
import numpy as np
from scipy import stats

class DriftDetector:
    """Detect data and prediction drift."""
    
    def __init__(self, reference_data: np.ndarray, feature_names: list[str]):
        """Initialize detector."""
        self.reference_data = reference_data
        self.feature_names = feature_names
        
    def detect_feature_drift(self, current_data: np.ndarray) -> dict:
        """Detect drift per feature using KS test."""
        drift_scores = {}
        for i, name in enumerate(self.feature_names):
            ref_col = self.reference_data[:, i]
            cur_col = current_data[:, i]
            statistic, p_value = stats.ks_2samp(ref_col, cur_col)
            drift_scores[name] = {
                'statistic': float(statistic),
                'p_value': float(p_value)
            }
        return drift_scores
        
    def detect_prediction_drift(self, reference_predictions: np.ndarray, current_predictions: np.ndarray) -> dict:
        """Detect drift in prediction distribution."""
        statistic, p_value = stats.ks_2samp(reference_predictions, current_predictions)
        return {
            'statistic': float(statistic),
            'p_value': float(p_value)
        }
        
    def get_status(self, p_value: float = None) -> str:
        """Get string status based on p-value."""
        if p_value is None:
            return 'NORMAL'
        if p_value < 0.001:
            return 'DRIFT_DETECTED'
        elif p_value < 0.05:
            return 'WARNING'
        return 'NORMAL'
        
    def generate_report(self, current_data: np.ndarray = None) -> dict:
        """Generate drift report for all features."""
        if current_data is None:
            return {'feature_drift': {}, 'overall_status': 'NORMAL'}
            
        feature_drift = self.detect_feature_drift(current_data)
        
        overall_status = 'NORMAL'
        for name, stats_dict in feature_drift.items():
            status = self.get_status(stats_dict['p_value'])
            stats_dict['status'] = status
            if status == 'DRIFT_DETECTED':
                overall_status = 'DRIFT_DETECTED'
            elif status == 'WARNING' and overall_status == 'NORMAL':
                overall_status = 'WARNING'
                
        return {
            'feature_drift': feature_drift,
            'overall_status': overall_status
        }
