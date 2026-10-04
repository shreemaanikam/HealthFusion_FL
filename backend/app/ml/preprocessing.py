"""
Production preprocessing for the HealthFusion_FL diabetes model.

This is the ONE implementation of "raw clinical record -> model tensor" used by
the API, the validation pipeline and the tests. It applies a *frozen* artifact
(models/preprocessors/preprocessing_v1.json); it never fits anything, so a new
patient record can never change the encoders or the scaler.

The artifact reproduces the exact transform that produced
data/processed/{train,test}.csv (alphabetical LabelEncoder codes for the two
categoricals, StandardScaler statistics for the four numerics). It is stored as
JSON rather than a pickle so it is human-auditable, diff-able and committable.
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, Iterable, List, Mapping, Optional

import numpy as np

PROJECT_ROOT = Path(__file__).resolve().parents[3]
DEFAULT_ARTIFACT = PROJECT_ROOT / "models" / "preprocessors" / "preprocessing_v1.json"

# Order the TensorFlow model was trained on (columns of data/processed/train.csv
# without the target). Changing this order silently breaks the model.
FEATURE_ORDER: List[str] = [
    "gender", "age", "hypertension", "heart_disease",
    "smoking_history", "bmi", "HbA1c_level", "blood_glucose_level",
]
NUMERIC_FEATURES: List[str] = ["age", "bmi", "HbA1c_level", "blood_glucose_level"]
BINARY_FEATURES: List[str] = ["hypertension", "heart_disease"]

# Plausibility limits: anything outside is rejected as a data-entry error (HTTP 422),
# never silently clipped or coerced.
HARD_LIMITS: Dict[str, tuple] = {
    "age": (0.0, 120.0),
    "bmi": (10.0, 100.0),
    "HbA1c_level": (3.0, 20.0),
    "blood_glucose_level": (20.0, 800.0),
}

FEATURE_UNITS: Dict[str, str] = {
    "age": "years", "bmi": "kg/m²", "HbA1c_level": "%", "blood_glucose_level": "mg/dL",
}


class PreprocessingError(ValueError):
    """Raised when a record cannot be mapped onto the model schema."""


class ProductionPreprocessor:
    def __init__(self, spec: Mapping[str, Any]):
        self.spec = dict(spec)
        if list(spec["feature_order"]) != FEATURE_ORDER:
            raise PreprocessingError("Artifact feature order does not match the code feature order.")
        self.version: str = spec["version"]
        self.gender_map: Dict[str, int] = dict(spec["categorical_maps"]["gender"])
        self.smoking_map: Dict[str, int] = dict(spec["categorical_maps"]["smoking_history"])
        self.mean = np.asarray(spec["scaler"]["mean"], dtype=np.float64)
        self.scale = np.asarray(spec["scaler"]["scale"], dtype=np.float64)
        self.training_ranges: Dict[str, Dict[str, float]] = spec["training_ranges"]

    # ------------------------------------------------------------------ io
    @classmethod
    def load(cls, path: Optional[Path] = None) -> "ProductionPreprocessor":
        p = Path(path) if path else DEFAULT_ARTIFACT
        with open(p, "r", encoding="utf-8") as fh:
            return cls(json.load(fh))

    # ----------------------------------------------------------- transform
    def _encode(self, mapping: Dict[str, int], value: Any, name: str) -> int:
        if value not in mapping:
            raise PreprocessingError(
                f"Unknown {name} category {value!r}. Allowed: {sorted(mapping)}."
            )
        return mapping[value]

    def transform_record(self, record: Mapping[str, Any]) -> np.ndarray:
        """One raw record (dict) -> float32 array of shape (1, 8). No defaults are
        invented: a missing field is an error, not a silent 0 / 'Female'."""
        missing = [f for f in FEATURE_ORDER if f not in record or record[f] is None]
        if missing:
            raise PreprocessingError(f"Missing required feature(s): {missing}.")
        row = [
            self._encode(self.gender_map, record["gender"], "gender"),
            float(record["age"]),
            int(record["hypertension"]),
            int(record["heart_disease"]),
            self._encode(self.smoking_map, record["smoking_history"], "smoking_history"),
            float(record["bmi"]),
            float(record["HbA1c_level"]),
            float(record["blood_glucose_level"]),
        ]
        return self._scale(np.asarray([row], dtype=np.float64)).astype(np.float32)

    def transform_frame(self, df) -> np.ndarray:
        """Vectorised version for validation datasets (DataFrame with raw columns)."""
        missing = [f for f in FEATURE_ORDER if f not in df.columns]
        if missing:
            raise PreprocessingError(f"Missing column(s): {missing}.")
        out = np.empty((len(df), len(FEATURE_ORDER)), dtype=np.float64)
        gender = df["gender"].map(self.gender_map)
        smoking = df["smoking_history"].map(self.smoking_map)
        if gender.isna().any() or smoking.isna().any():
            raise PreprocessingError("Unknown categorical value(s) in dataset.")
        out[:, 0] = gender.values
        out[:, 1] = df["age"].values
        out[:, 2] = df["hypertension"].values
        out[:, 3] = df["heart_disease"].values
        out[:, 4] = smoking.values
        out[:, 5] = df["bmi"].values
        out[:, 6] = df["HbA1c_level"].values
        out[:, 7] = df["blood_glucose_level"].values
        return self._scale(out).astype(np.float32)

    def _scale(self, x: np.ndarray) -> np.ndarray:
        idx = [FEATURE_ORDER.index(c) for c in NUMERIC_FEATURES]
        x = x.copy()
        x[:, idx] = (x[:, idx] - self.mean) / self.scale
        return x

    # -------------------------------------------------------------- checks
    def out_of_distribution(self, record: Mapping[str, Any]) -> List[Dict[str, Any]]:
        """Values that are valid but outside the range the model was trained on.
        The model can still score them, but its output is an extrapolation."""
        warnings: List[Dict[str, Any]] = []
        for f in NUMERIC_FEATURES:
            lo, hi = self.training_ranges[f]["min"], self.training_ranges[f]["max"]
            v = float(record[f])
            if v < lo or v > hi:
                warnings.append({
                    "feature": f, "value": v, "training_min": lo, "training_max": hi,
                    "message": f"{f} = {v} is outside the training range [{lo}, {hi}]; "
                               "the score is an extrapolation.",
                })
        return warnings

    def describe(self) -> Dict[str, Any]:
        return {
            "version": self.version,
            "feature_order": FEATURE_ORDER,
            "numeric_features": NUMERIC_FEATURES,
            "categorical_maps": self.spec["categorical_maps"],
            "training_ranges": self.training_ranges,
        }
