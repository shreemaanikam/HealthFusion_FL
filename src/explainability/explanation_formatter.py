"""
Format SHAP explanations.
"""

def format_explanation(shap_result: dict, top_k: int = 5) -> dict:
    """Format SHAP explanation output."""
    feature_names = shap_result['feature_names']
    shap_values = shap_result['shap_values']
    
    features = []
    for name, val in zip(feature_names, shap_values):
        features.append({
            'feature': name,
            'impact': 'positive' if val > 0 else 'negative',
            'contribution': abs(val),
            'value': val
        })
        
    features.sort(key=lambda x: x['contribution'], reverse=True)
    top_features = features[:top_k]
    
    return {
        'prediction': shap_result['prediction'],
        'probability': shap_result['probability'],
        'top_features': top_features
    }

def format_global_importance(importance_data: list) -> dict:
    """Format global feature importance."""
    return {
        'features': importance_data,
        'status': 'success'
    }
