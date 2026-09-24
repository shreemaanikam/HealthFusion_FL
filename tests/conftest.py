"""pytest fixtures."""
import pytest
import numpy as np
from fastapi.testclient import TestClient
from fastapi import FastAPI

@pytest.fixture
def sample_input():
    return {
        'gender': 1, 'age': 45, 'hypertension': 0, 'heart_disease': 0,
        'smoking_history': 2, 'bmi': 25.5, 'HbA1c_level': 5.5, 'blood_glucose_level': 100
    }

@pytest.fixture
def sample_train_data():
    return np.random.rand(10, 8)

@pytest.fixture
def test_client():
    app = FastAPI()
    return TestClient(app)
