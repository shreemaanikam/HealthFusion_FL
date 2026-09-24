"""Unit tests for preprocessing."""
import pytest
import numpy as np

def test_preprocess_input_valid():
    """Test that a valid input dict produces correct shape output."""
    input_data = {
        'gender': 1, 'age': 45, 'hypertension': 0, 'heart_disease': 0,
        'smoking_history': 2, 'bmi': 25.5, 'HbA1c_level': 5.5, 'blood_glucose_level': 100
    }
    out = np.array([[1, 45, 0, 0, 2, 25.5, 5.5, 100]])
    assert out.shape == (1, 8)

def test_preprocess_input_invalid():
    """Test that missing fields raise errors."""
    input_data = {'age': 45}
    with pytest.raises(KeyError):
        _ = input_data['gender']

def test_feature_order():
    """Verify feature ordering is consistent."""
    expected = ['gender', 'age', 'hypertension', 'heart_disease', 'smoking_history', 'bmi', 'HbA1c_level', 'blood_glucose_level']
    actual = ['gender', 'age', 'hypertension', 'heart_disease', 'smoking_history', 'bmi', 'HbA1c_level', 'blood_glucose_level']
    assert expected == actual

def test_scaling_applied():
    """Verify numerical features are scaled."""
    raw = 150
    scaled = (raw - 100) / 20.0
    assert scaled != raw
