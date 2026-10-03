"""pytest fixtures."""
import os
import sys
import tempfile
from pathlib import Path

# --- Isolated environment for tests against the REAL backend app -----------
# Must run before any module imports app.config (settings are cached) or
# app.core.database (the engine is created at import time). Assigned directly,
# not setdefault, so a developer's/production DATABASE_URL can never leak in.
_TEST_DB_DIR = tempfile.mkdtemp(prefix="hf_test_")
os.environ["DATABASE_URL"] = f"sqlite+aiosqlite:///{_TEST_DB_DIR}/test.db"
os.environ["JWT_SECRET_KEY"] = "test-only-jwt-secret-not-used-anywhere-else-0123456789"
os.environ["APP_ENV"] = "test"
os.environ["DEBUG"] = "false"
os.environ["OPENROUTER_API_KEY"] = ""
os.environ["CORS_ORIGINS"] = "https://frontend.test"
TEST_DB_PATH = f"{_TEST_DB_DIR}/test.db"

_BACKEND = str(Path(__file__).resolve().parents[1] / "backend")
if _BACKEND not in sys.path:
    sys.path.insert(0, _BACKEND)

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
