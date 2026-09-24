"""
Prediction service for HealthFusion_FL.

Loads the best available model (TF neural network or Random Forest fallback)
and provides predictions with risk classification.
"""

import os
import sys
import numpy as np
import joblib
import logging
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)

# Add project root to path for src imports
PROJECT_ROOT = Path(__file__).resolve().parents[3]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

FEATURE_NAMES = [
    "gender", "age", "hypertension", "heart_disease",
    "smoking_history", "bmi", "HbA1c_level", "blood_glucose_level"
]

# Encoding maps matching the preprocessing pipeline
GENDER_MAP = {"Female": 0, "Male": 1, "Other": 2}
SMOKING_MAP = {
    "No Info": 0, "current": 1, "ever": 2,
    "former": 3, "never": 4, "not current": 5
}


class PredictionService:
    """Singleton service that loads the model once and serves predictions."""

    _instance: Optional["PredictionService"] = None
    _model = None
    _model_type: str = "unknown"
    _model_version: str = "unknown"
    _scaler = None

    def __new__(cls) -> "PredictionService":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._load_model()
        return cls._instance

    def _load_model(self) -> None:
        """Load the best available model: TF first, then RF fallback."""
        tf_path = PROJECT_ROOT / "models" / "tensorflow" / "diabetes_nn.keras"
        rf_path = PROJECT_ROOT / "models" / "random_forest.pkl"
        scaler_path = PROJECT_ROOT / "models" / "preprocessors" / "scaler.joblib"

        # Try loading scaler
        if scaler_path.exists():
            try:
                self._scaler = joblib.load(scaler_path)
                logger.info("Loaded saved scaler from %s", scaler_path)
            except Exception as e:
                logger.warning("Failed to load scaler: %s", e)

        # Try TensorFlow model first
        if tf_path.exists():
            try:
                import tensorflow as tf
                self._model = tf.keras.models.load_model(str(tf_path))
                self._model_type = "tensorflow"
                self._model_version = "HF-NN-v1.0"
                logger.info("Loaded TensorFlow model from %s", tf_path)
                return
            except Exception as e:
                logger.warning("Failed to load TF model: %s", e)

        # Fallback to Random Forest
        if rf_path.exists():
            try:
                self._model = joblib.load(rf_path)
                self._model_type = "random_forest"
                self._model_version = "HF-RF-v1.0"
                logger.info("Loaded Random Forest model from %s", rf_path)
                return
            except Exception as e:
                logger.warning("Failed to load RF model: %s", e)

        logger.error("No model could be loaded!")

    def preprocess_input(self, input_data: dict) -> np.ndarray:
        """
        Preprocess raw input data into model-ready format.

        Args:
            input_data: Dict with raw feature values.

        Returns:
            numpy array of shape (1, 8) ready for prediction.
        """
        # Encode categoricals
        gender_encoded = GENDER_MAP.get(input_data.get("gender", "Female"), 0)
        smoking_encoded = SMOKING_MAP.get(input_data.get("smoking_history", "No Info"), 0)

        # Build feature vector in correct order
        features = np.array([[
            gender_encoded,
            float(input_data.get("age", 0)),
            int(input_data.get("hypertension", 0)),
            int(input_data.get("heart_disease", 0)),
            smoking_encoded,
            float(input_data.get("bmi", 0)),
            float(input_data.get("HbA1c_level", 0)),
            float(input_data.get("blood_glucose_level", 0)),
        ]])

        # Scale numerical features if scaler is available
        if self._scaler is not None:
            numerical_indices = [1, 5, 6, 7]  # age, bmi, HbA1c, glucose
            features[:, numerical_indices] = self._scaler.transform(
                features[:, numerical_indices]
            )

        return features

    def predict(self, input_data: dict) -> dict:
        """
        Make a prediction from raw input data.

        Args:
            input_data: Dict with patient feature values.

        Returns:
            Dict with prediction, probability, risk_level, model info.
        """
        if self._model is None:
            return {
                "prediction": -1,
                "probability": 0.0,
                "risk_level": "unknown",
                "model_version": "none",
                "error": "No model loaded",
            }

        features = self.preprocess_input(input_data)

        try:
            if self._model_type == "tensorflow":
                prob = float(self._model.predict(features, verbose=0)[0][0])
            else:
                # sklearn models
                prob = float(self._model.predict_proba(features)[0][1])
        except Exception as e:
            logger.error("Prediction failed: %s", e)
            return {
                "prediction": -1,
                "probability": 0.0,
                "risk_level": "error",
                "model_version": self._model_version,
                "error": str(e),
            }

        prediction = 1 if prob >= 0.5 else 0

        if prob >= 0.7:
            risk_level = "high"
        elif prob >= 0.3:
            risk_level = "moderate"
        else:
            risk_level = "low"

        return {
            "prediction": prediction,
            "probability": round(prob, 4),
            "risk_level": risk_level,
            "model_version": self._model_version,
            "model_type": self._model_type,
        }

    @property
    def is_loaded(self) -> bool:
        """Check if a model is loaded."""
        return self._model is not None

    @property
    def model_info(self) -> dict:
        """Return model metadata."""
        return {
            "model_type": self._model_type,
            "model_version": self._model_version,
            "loaded": self.is_loaded,
        }
