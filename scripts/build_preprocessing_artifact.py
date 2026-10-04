#!/usr/bin/env python
"""Derive models/preprocessors/preprocessing_v1.json reproducibly from the source
dataset and VERIFY it against the processed data the production model was trained on.

This does not retrain anything. It records, as an auditable artifact, the exact
transform that produced data/processed/train.csv (which the frozen TensorFlow model
was trained on) but that was never persisted - the cause of a train/serve skew where
the deployed API fed *raw* values to a model trained on *standardised* values.

Usage:  python scripts/build_preprocessing_artifact.py [--source CSV] [--check-only]
"""
import argparse
import hashlib
import json
import sys
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.preprocessing import LabelEncoder, StandardScaler

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))
from app.ml.preprocessing import DEFAULT_ARTIFACT, FEATURE_ORDER, NUMERIC_FEATURES, ProductionPreprocessor  # noqa: E402


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as fh:
        for chunk in iter(lambda: fh.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--source", default=str(ROOT / "ml_testing_data" / "diabetes_prediction_dataset.csv"))
    ap.add_argument("--processed", default=str(ROOT / "data" / "processed" / "processed_dataset.csv"))
    ap.add_argument("--out", default=str(DEFAULT_ARTIFACT))
    args = ap.parse_args()

    src = Path(args.source)
    raw = pd.read_csv(src)
    df = raw.drop_duplicates().reset_index(drop=True)  # src/preprocessing.py drops duplicates first

    maps = {}
    for col in ("gender", "smoking_history"):
        le = LabelEncoder().fit(df[col])
        maps[col] = {str(k): int(v) for v, k in enumerate(le.classes_)}

    scaler = StandardScaler().fit(df[NUMERIC_FEATURES])
    spec = {
        "version": "pp-v1",
        "description": "Frozen preprocessing for model HF-NN-v1.0 (reproduces src/preprocessing.py).",
        "feature_order": FEATURE_ORDER,
        "categorical_maps": maps,
        "numeric_features": NUMERIC_FEATURES,
        "scaler": {"type": "StandardScaler", "mean": scaler.mean_.tolist(), "scale": scaler.scale_.tolist(),
                   "fit_rows": int(len(df))},
        "training_ranges": {c: {"min": float(df[c].min()), "max": float(df[c].max())} for c in NUMERIC_FEATURES},
        "source": {
            "file": src.name, "sha256": sha256(src),
            "rows_raw": int(len(raw)), "rows_after_dedup": int(len(df)),
            "note": "Scaler was fit on the full de-duplicated dataset BEFORE the train/test split "
                    "(a documented mild leakage of 8 summary statistics; kept so the frozen model "
                    "receives the exact inputs it was trained on).",
        },
    }

    # ---- verification against what the model was actually trained on ----
    pp = ProductionPreprocessor(spec)
    proc_path = Path(args.processed)
    if proc_path.exists():
        proc = pd.read_csv(proc_path)
        feats = proc[FEATURE_ORDER].values.astype(np.float64)
        mine = pp.transform_frame(df).astype(np.float64)
        diff = float(np.abs(feats - mine).max())
        print(f"max |reconstructed - processed_dataset.csv| = {diff:.3e}")
        if diff > 1e-4:  # float32 round-off only
            print("FAIL: artifact does not reproduce the training features", file=sys.stderr)
            return 1
        spec["verification"] = {"against": "data/processed/processed_dataset.csv",
                                "max_abs_diff": diff, "rows": int(len(proc)), "status": "PASS"}
    else:
        print("WARN: processed_dataset.csv not found; artifact unverified", file=sys.stderr)
        spec["verification"] = {"status": "UNVERIFIED"}

    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(spec, indent=2) + "\n")
    print(f"wrote {out.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
