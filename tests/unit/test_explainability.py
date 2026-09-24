"""Unit tests for explainability."""
import pytest
from src.explainability.explanation_formatter import format_explanation
from src.explainability.shap_explainer import ShapExplainer

def test_explanation_format():
    """Verify output structure."""
    res = {
        'prediction': 1,
        'probability': 0.9,
        'feature_names': ['age'],
        'shap_values': [0.5]
    }
    out = format_explanation(res, top_k=1)
    assert 'prediction' in out
    assert 'top_features' in out

def test_feature_names():
    """Verify correct features returned."""
    assert len(ShapExplainer.get_feature_names()) == 8

def test_top_k_features():
    """Verify top_k filtering works."""
    res = {
        'prediction': 1,
        'probability': 0.9,
        'feature_names': ['f1', 'f2', 'f3'],
        'shap_values': [0.1, 0.5, 0.2]
    }
    out = format_explanation(res, top_k=2)
    assert len(out['top_features']) == 2
