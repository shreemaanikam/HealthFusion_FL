"""
Prediction + explanation service for HealthFusion_FL.

Serves the FROZEN production TensorFlow model. Nothing in this module trains,
fine-tunes or re-fits anything: a new assessment is pure inference
(frozen preprocessing -> frozen model -> score), so the record never has to have
existed in the training data and never changes the model.

Safety properties:
  * the model artifact's SHA-256 must match models/model_config_v1.json, otherwise
    the service reports UNAVAILABLE instead of serving an unverified model;
  * there is NO silent fallback to a different model;
  * preprocessing is the frozen artifact (app.ml.preprocessing) - the previous
    implementation fed raw, unscaled values to a model trained on standardised
    values, which saturated every output at 1.0.
"""
from __future__ import annotations

import hashlib
import json
import logging
import time
from pathlib import Path
from typing import Any, Dict, List, Optional

import numpy as np

from app.ml.preprocessing import (
    FEATURE_ORDER, FEATURE_UNITS, PreprocessingError, ProductionPreprocessor,
)
from app.ml.shap_exact import exact_shapley

logger = logging.getLogger(__name__)

PROJECT_ROOT = Path(__file__).resolve().parents[3]
MODEL_PATH = PROJECT_ROOT / "models" / "tensorflow" / "diabetes_nn.keras"
CONFIG_PATH = PROJECT_ROOT / "models" / "model_config_v1.json"
BACKGROUND_PATH = PROJECT_ROOT / "models" / "preprocessors" / "shap_background_v1.json"

# Kept for modules that import these names.
FEATURE_NAMES = FEATURE_ORDER

FEATURE_LABELS = {
    "gender": "Gender", "age": "Age", "hypertension": "Hypertension", "heart_disease": "Heart disease",
    "smoking_history": "Smoking history", "bmi": "BMI", "HbA1c_level": "HbA1c level",
    "blood_glucose_level": "Blood glucose",
}


class ModelUnavailable(RuntimeError):
    """The production model is not loaded / failed verification."""


def _sha256(path: Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as fh:
        for chunk in iter(lambda: fh.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def _sigmoid(z: np.ndarray) -> np.ndarray:
    return 1.0 / (1.0 + np.exp(-np.clip(z, -60.0, 60.0)))


class PredictionService:
    """Singleton: loads the model once at first use."""

    _instance: Optional["PredictionService"] = None

    def __new__(cls) -> "PredictionService":
        if cls._instance is None:
            inst = super().__new__(cls)
            inst._init_state()
            inst._load()
            cls._instance = inst
        return cls._instance

    # ------------------------------------------------------------------ state
    def _init_state(self) -> None:
        self._model = None
        self._feat = None
        self._W = None
        self._b = None
        self._pp: Optional[ProductionPreprocessor] = None
        self._config: Dict[str, Any] = {}
        self._background: Optional[np.ndarray] = None
        self._error: Optional[str] = None
        self._artifact_verified = False
        self._model_sha256: Optional[str] = None

    def _load(self) -> None:
        try:
            self._config = json.loads(CONFIG_PATH.read_text())
            self._pp = ProductionPreprocessor.load()
            if self._config.get("preprocessing_version") != self._pp.version:
                raise RuntimeError("preprocessing artifact version does not match model config")
            self._model_sha256 = _sha256(MODEL_PATH)
            if self._model_sha256 != self._config["model_sha256"]:
                raise RuntimeError("model artifact SHA-256 does not match models/model_config_v1.json")
            self._artifact_verified = True

            import tensorflow as tf
            self._model = tf.keras.models.load_model(str(MODEL_PATH))
            if self._model.input_shape[-1] != len(FEATURE_ORDER):
                raise RuntimeError("model input width does not match the preprocessing schema")
            self._feat = tf.keras.Model(self._model.inputs, self._model.layers[-2].output)
            self._W, self._b = [np.asarray(w, dtype=np.float64) for w in self._model.layers[-1].get_weights()]
            if BACKGROUND_PATH.exists():
                self._background = np.asarray(json.loads(BACKGROUND_PATH.read_text())["rows"], dtype=np.float32)
            logger.info("Loaded %s (sha256 verified), preprocessing %s, score semantics=%s",
                        self.model_version, self._pp.version, self.score_semantics)
        except Exception as exc:  # noqa: BLE001 - surface as UNAVAILABLE, never fall back silently
            self._model = None
            self._error = f"{type(exc).__name__}: {exc}"
            logger.error("Production model unavailable: %s", self._error)

    # ------------------------------------------------------------- properties
    @property
    def is_loaded(self) -> bool:
        return self._model is not None

    @property
    def model_version(self) -> str:
        return self._config.get("model_version", "unknown")

    @property
    def model_id(self) -> str:
        return self._config.get("model_id", "unknown")

    @property
    def score_semantics(self) -> str:
        return self._config.get("score_semantics", "model_score")

    @property
    def threshold(self) -> float:
        return float(self._config.get("threshold", 0.5))

    @property
    def preprocessing_version(self) -> str:
        return self._pp.version if self._pp else "unknown"

    @property
    def model_info(self) -> Dict[str, Any]:
        return {
            "model_type": "tensorflow" if self.is_loaded else "unavailable",
            "model_id": self.model_id,
            "model_version": self.model_version,
            "preprocessing_version": self.preprocessing_version,
            "score_semantics": self.score_semantics,
            "threshold": self.threshold,
            "loaded": self.is_loaded,
            "artifact_verified": self._artifact_verified,
            "artifact_sha256_prefix": (self._model_sha256 or "")[:12],
            "error": None if self.is_loaded else self._error,
        }

    # ------------------------------------------------------------- inference
    def _require(self) -> None:
        if not self.is_loaded:
            raise ModelUnavailable(self._error or "model not loaded")

    def preprocess_input(self, input_data: Dict[str, Any]) -> np.ndarray:
        """Frozen transform of one raw record -> (1, 8) model tensor (never fits)."""
        assert self._pp is not None
        return self._pp.transform_record(input_data)

    def _logit(self, X: np.ndarray) -> np.ndarray:
        h = self._feat(np.asarray(X, dtype=np.float32), training=False).numpy().astype(np.float64)
        return (h @ self._W + self._b).ravel()

    def raw_score(self, X: np.ndarray) -> np.ndarray:
        return _sigmoid(self._logit(X))

    def reported_score(self, X: np.ndarray) -> np.ndarray:
        """The number shown to users: calibrated probability iff calibration was adopted
        on the evidence in reports/model_validation, else the raw model score."""
        z = self._logit(X)
        cal = self._config.get("calibration")
        if self.score_semantics == "calibrated_probability" and cal:
            return _sigmoid(cal["a"] * z + cal["b"])
        return _sigmoid(z)

    def risk_band(self, score: float) -> str:
        rb = self._config.get("risk_bands", {"low_max": 0.3, "high_min": 0.7})
        return "high" if score >= rb["high_min"] else "moderate" if score >= rb["low_max"] else "low"

    def predict(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        self._require()
        t0 = time.perf_counter()
        X = self.preprocess_input(input_data)
        z = self._logit(X)
        raw = float(_sigmoid(z)[0])
        reported = float(self.reported_score(X)[0])
        calibrated = reported if self.score_semantics == "calibrated_probability" else None
        return {
            "prediction": int(reported >= self.threshold),
            "model_score": round(raw, 6),
            "calibrated_probability": round(calibrated, 6) if calibrated is not None else None,
            "reported_score": round(reported, 6),
            "score_semantics": self.score_semantics,
            "threshold": self.threshold,
            "risk_level": self.risk_band(reported),
            "model_version": self.model_version,
            "preprocessing_version": self.preprocessing_version,
            "ood_warnings": self._pp.out_of_distribution(input_data) if self._pp else [],
            "latency_ms": round((time.perf_counter() - t0) * 1000, 2),
            # legacy field consumed by older callers
            "probability": round(reported, 6),
            "model_type": "tensorflow",
        }

    # ---------------------------------------------------------- explanation
    def explain(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Exact SHAP (Shapley) attribution of the REPORTED score for one assessment."""
        self._require()
        if self._background is None:
            raise ModelUnavailable("SHAP background artifact is missing")
        X = self.preprocess_input(input_data)
        phi, base, fx = exact_shapley(self.reported_score, X[0], self._background)
        feats: List[Dict[str, Any]] = []
        for j, f in enumerate(FEATURE_ORDER):
            c = float(phi[j])
            feats.append({
                "feature": f,
                "label": FEATURE_LABELS[f],
                "impact": "positive" if c >= 0 else "negative",
                "contribution": round(c, 6),
                "value": input_data[f] if not isinstance(input_data[f], (np.floating,)) else float(input_data[f]),
                "unit": FEATURE_UNITS.get(f),
            })
        feats.sort(key=lambda r: abs(r["contribution"]), reverse=True)
        return {
            "features": feats,
            "base_value": round(base, 6),
            "output_value": round(fx, 6),
            "units": "calibrated probability" if self.score_semantics == "calibrated_probability" else "model score",
            "method": "Exact interventional SHAP (Shapley values) over a 50-row training background",
            "n_background": int(self._background.shape[0]),
            "model_version": self.model_version,
        }
