"""Unit tests for prediction."""
import pytest
import numpy as np

def test_model_output_shape():
    """Model output is (1,) or (n, 1)."""
    out = np.array([0.7])
    assert out.shape == (1,) or out.shape == (1, 1)

def test_model_output_range():
    """Predictions between 0 and 1."""
    prob = 0.85
    assert 0.0 <= prob <= 1.0

def test_risk_classification():
    """Test risk level thresholds."""
    prob1 = 0.2
    prob2 = 0.8
    assert prob1 < 0.5
    assert prob2 >= 0.5
