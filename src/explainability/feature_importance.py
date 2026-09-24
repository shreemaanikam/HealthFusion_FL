"""
Global feature importance computation.
"""
import json
import os
from pathlib import Path
import numpy as np

def compute_global_importance(explainer, data_sample: np.ndarray) -> list[dict]:
    """Compute global feature importance using SHAP values."""
    explanations = explainer.explain_batch(data_sample)
    
    feature_names = explainer.get_feature_names()
    importance_dict = {name: [] for name in feature_names}
    
    for exp in explanations:
        for name, shap_val in zip(feature_names, exp['shap_values']):
            importance_dict[name].append(abs(shap_val))
            
    mean_importance = []
    for name in feature_names:
        mean_val = float(np.mean(importance_dict[name]))
        mean_importance.append({
            'feature': name,
            'importance': mean_val
        })
        
    mean_importance.sort(key=lambda x: x['importance'], reverse=True)
    
    for idx, item in enumerate(mean_importance):
        item['rank'] = idx + 1
        
    # Save to reports
    report_dir = Path("reports")
    report_dir.mkdir(exist_ok=True)
    report_path = report_dir / "global_feature_importance.json"
    
    with open(report_path, 'w') as f:
        json.dump(mean_importance, f, indent=4)
        
    return mean_importance
