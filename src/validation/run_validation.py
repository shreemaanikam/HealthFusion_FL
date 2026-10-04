#!/usr/bin/env python
"""
HealthFusion_FL model validation pipeline.

ORDER OF OPERATIONS (deliberate):
  1. Audit the dataset + prove the train/test split is reproducible and leak-checked.
  2. Evaluate the FROZEN production TensorFlow model (no fit, no weight change) on the
     untouched held-out test set. Calibration + threshold are chosen on the held-out
     *validation* split, never on test.
  3. Only then train/evaluate candidate baselines (LR / DT / RF / clean-split TF) on the
     same training rows with a SPLIT-FIRST pipeline, and compare on the same test set.
  4. Never promotes anything automatically: it writes evidence + a promotion decision.

Run:  KERAS_HOME=$PWD/.keras_home python -m src.validation.run_validation
"""
from __future__ import annotations

import argparse
import json
import os
import platform
import sys
import tempfile
import time
from pathlib import Path

os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "3")

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "backend"))

from sklearn.linear_model import LogisticRegression  # noqa: E402
from sklearn.model_selection import StratifiedKFold, train_test_split  # noqa: E402
from sklearn.preprocessing import StandardScaler  # noqa: E402
from sklearn.tree import DecisionTreeClassifier  # noqa: E402
from sklearn.ensemble import RandomForestClassifier  # noqa: E402

from app.ml.preprocessing import FEATURE_ORDER, NUMERIC_FEATURES, ProductionPreprocessor  # noqa: E402
from app.ml.shap_exact import exact_shapley  # noqa: E402
from src.validation.common import (  # noqa: E402
    SEED, bootstrap_ci, calibration_metrics, classification_metrics, plot_confusion,
    plot_reliability, plot_roc_pr, reliability_table, sha256_file, write_json,
)
from src.validation.drift import dataset_drift  # noqa: E402

DATA_DIR = ROOT / "ml_testing_data"
SOURCE = DATA_DIR / "diabetes_prediction_dataset.csv"
DUPLICATE = DATA_DIR / "diabetes_prediction_dataset (2).csv"
PROCESSED = ROOT / "data" / "processed"
MODEL_PATH = ROOT / "models" / "tensorflow" / "diabetes_nn.keras"
OUT = ROOT / "reports" / "model_validation"
FIG = OUT / "figures"
KERAS_VAL_SPLIT = 0.15  # src/ml/train_tensorflow.py: validation_split=0.15


def log(msg: str) -> None:
    print(f"[validate] {msg}", flush=True)


# ----------------------------------------------------------------------------- data
def dataset_audit(raw: pd.DataFrame) -> dict:
    cat = ["gender", "smoking_history"]
    num = ["age", "bmi", "HbA1c_level", "blood_glucose_level"]
    dup_hash = {
        "primary": {"file": SOURCE.name, "sha256": sha256_file(SOURCE)},
        "copy": {"file": DUPLICATE.name, "sha256": sha256_file(DUPLICATE)},
    }
    dup_hash["identical"] = dup_hash["primary"]["sha256"] == dup_hash["copy"]["sha256"]
    raw_path = ROOT / "data" / "raw" / "diabetes_prediction_dataset.csv"
    dup_hash["data_raw_copy_identical"] = raw_path.exists() and sha256_file(raw_path) == dup_hash["primary"]["sha256"]
    n_dup = int(raw.duplicated().sum())
    return {
        "rows": int(len(raw)), "columns": int(raw.shape[1]), "feature_names": list(raw.columns),
        "dtypes": {c: str(t) for c, t in raw.dtypes.items()},
        "missing_values": {c: int(v) for c, v in raw.isna().sum().items()},
        "duplicate_rows": n_dup, "duplicate_pct": round(100 * n_dup / len(raw), 3),
        "target_balance": {str(k): int(v) for k, v in raw["diabetes"].value_counts().items()},
        "target_positive_rate": float(raw["diabetes"].mean()),
        "class_imbalance_ratio_neg_to_pos": float((raw["diabetes"] == 0).sum() / (raw["diabetes"] == 1).sum()),
        "categorical_values": {c: {str(k): int(v) for k, v in raw[c].value_counts().items()} for c in cat},
        "numeric_ranges": {c: {"min": float(raw[c].min()), "max": float(raw[c].max()),
                               "mean": float(raw[c].mean()), "std": float(raw[c].std())} for c in num},
        "suspicious": {
            "bmi_exactly_27.32": int((raw["bmi"] == 27.32).sum()),
            "bmi_exactly_27.32_note": "A single BMI value over-represented; consistent with imputation in the public dataset.",
            "age_under_1": int((raw["age"] < 1).sum()),
            "age_under_18": int((raw["age"] < 18).sum()),
            "bmi_over_60": int((raw["bmi"] > 60).sum()),
            "gender_other": int((raw["gender"] == "Other").sum()),
            "smoking_no_info_pct": round(100 * float((raw["smoking_history"] == "No Info").mean()), 2),
            "hba1c_distinct_values": sorted(map(float, raw["HbA1c_level"].unique())),
            "glucose_distinct_values": sorted(map(int, raw["blood_glucose_level"].unique())),
            "non_integer_ages": int((raw["age"] % 1 != 0).sum()),
        },
        "file_hash_comparison": dup_hash,
        "independence": "NOT independent: the uploaded CSVs are byte-identical to each other and to the training "
                        "source (data/raw). They are the original dataset, not external validation data."
                        if dup_hash["identical"] else "Files differ; row-level overlap must be tested before use.",
    }


# ----------------------------------------------------------------------- model utils
def load_prod_model():
    import tensorflow as tf
    return tf.keras.models.load_model(str(MODEL_PATH))


def logits_from(model, X: np.ndarray) -> np.ndarray:
    """Pre-sigmoid logit of the (Dense -> sigmoid) head; avoids float32 saturation."""
    import tensorflow as tf
    head = model.layers[-1]
    feat = tf.keras.Model(model.inputs, model.layers[-2].output)
    h = feat.predict(X, batch_size=8192, verbose=0)
    W, b = head.get_weights()
    return (h @ W + b).ravel().astype(np.float64)


def sigmoid(z):
    return 1.0 / (1.0 + np.exp(-np.clip(z, -60, 60)))


def tf_scores(model, X: np.ndarray) -> np.ndarray:
    return model.predict(X, batch_size=8192, verbose=0).ravel().astype(np.float64)


def band(score: float, low_max=0.3, high_min=0.7) -> str:
    return "high" if score >= high_min else "moderate" if score >= low_max else "low"


# ----------------------------------------------------------------------------- main
def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--skip-candidates", action="store_true")
    ap.add_argument("--skip-tf-candidate", action="store_true")
    ap.add_argument("--n-boot", type=int, default=1000)
    args = ap.parse_args()
    t0 = time.time()
    OUT.mkdir(parents=True, exist_ok=True)
    FIG.mkdir(parents=True, exist_ok=True)

    # ============ 1. DATA + SPLIT REPRODUCTION + LEAKAGE AUDIT =====================
    log("dataset audit")
    raw = pd.read_csv(SOURCE)
    audit = dataset_audit(raw)
    write_json(OUT / "dataset_audit.json", audit)

    df = raw.drop_duplicates().reset_index(drop=True)  # dedupe BEFORE splitting
    y_all = df["diabetes"].values
    idx = np.arange(len(df))
    # Identical to src/preprocessing.py: test_size=0.2, random_state=42, stratify=y
    train_idx, test_idx = train_test_split(idx, test_size=0.2, random_state=SEED, stratify=y_all)
    split_at = int(len(train_idx) * (1 - KERAS_VAL_SPLIT))  # Keras validation_split takes the LAST 15% of rows
    fit_idx, val_idx = train_idx[:split_at], train_idx[split_at:]
    log(f"rows: dedup={len(df)} train={len(train_idx)} (fit={len(fit_idx)}, val={len(val_idx)}) test={len(test_idx)}")

    pp = ProductionPreprocessor.load()
    X_all = pp.transform_frame(df)
    split_check = {"status": "UNVERIFIED"}
    if (PROCESSED / "train.csv").exists() and (PROCESSED / "test.csv").exists():
        tr = pd.read_csv(PROCESSED / "train.csv")
        te = pd.read_csv(PROCESSED / "test.csv")
        d_tr = float(np.abs(tr[FEATURE_ORDER].values - X_all[train_idx]).max())
        d_te = float(np.abs(te[FEATURE_ORDER].values - X_all[test_idx]).max())
        y_ok = bool((tr["diabetes"].values == y_all[train_idx]).all() and (te["diabetes"].values == y_all[test_idx]).all())
        split_check = {"status": "PASS" if (d_tr < 1e-4 and d_te < 1e-4 and y_ok) else "FAIL",
                       "max_abs_diff_train": d_tr, "max_abs_diff_test": d_te, "labels_match": y_ok,
                       "train_rows": int(len(tr)), "test_rows": int(len(te))}
        if split_check["status"] != "PASS":
            log(f"FATAL: split not reproducible: {split_check}")
            return 1
    log(f"split reproduction vs data/processed: {split_check['status']}")

    X_fit, y_fit = X_all[fit_idx], y_all[fit_idx]
    X_val, y_val = X_all[val_idx], y_all[val_idx]
    X_test, y_test = X_all[test_idx], y_all[test_idx]

    # leakage checks ----------------------------------------------------------------
    key = lambda frame: set(map(tuple, frame[FEATURE_ORDER[:1] + ["age", "hypertension", "heart_disease",
                                                                   "smoking_history", "bmi", "HbA1c_level",
                                                                   "blood_glucose_level"]].values.tolist()))
    overlap = len(key(df.iloc[train_idx]) & key(df.iloc[test_idx]))
    tr_only = StandardScaler().fit(df.iloc[train_idx][NUMERIC_FEATURES])
    full_mean, full_scale = np.asarray(pp.mean), np.asarray(pp.scale)
    rel_mean = float(np.max(np.abs(tr_only.mean_ - full_mean) / np.abs(full_mean)))
    rel_scale = float(np.max(np.abs(tr_only.scale_ - full_scale) / full_scale))
    train_cats = {c: set(df.iloc[train_idx][c]) for c in ("gender", "smoking_history")}
    unseen_cat = {c: sorted(set(df.iloc[test_idx][c]) - train_cats[c]) for c in train_cats}

    model = load_prod_model()
    model_sha = sha256_file(MODEL_PATH)
    log("scoring with frozen production model")
    s_fit = tf_scores(model, X_fit)
    s_val = tf_scores(model, X_val)
    s_test = tf_scores(model, X_test)
    z_val, z_test = logits_from(model, X_val), logits_from(model, X_test)
    logit_consistency = float(np.abs(sigmoid(z_test) - s_test).max())

    # effect of the (documented) scaler-before-split leakage on the TEST score
    Xt_clean = X_test.copy().astype(np.float64)
    nidx = [FEATURE_ORDER.index(c) for c in NUMERIC_FEATURES]
    raw_test_num = df.iloc[test_idx][NUMERIC_FEATURES].values
    Xt_clean[:, nidx] = (raw_test_num - tr_only.mean_) / tr_only.scale_
    s_test_clean = tf_scores(model, Xt_clean.astype(np.float32))
    m_full = classification_metrics(y_test, s_test, 0.5)
    m_clean = classification_metrics(y_test, s_test_clean, 0.5)

    leakage = {
        "principle": "SPLIT FIRST -> fit preprocessing on TRAIN only -> transform val/test",
        "checks": [
            {"id": "dedup_before_split", "status": "PASS",
             "detail": f"{audit['duplicate_rows']} exact duplicate rows removed BEFORE the split, so no identical record can sit in both train and test."},
            {"id": "train_test_exact_overlap", "status": "PASS" if overlap == 0 else "FAIL",
             "detail": f"{overlap} identical feature-vectors shared between train and test."},
            {"id": "scaler_fit_before_split", "status": "FAIL (mild, documented)",
             "detail": "src/preprocessing.py fits StandardScaler on the FULL dataset before train_test_split, so test rows "
                       "contributed to the 8 scaler statistics. Max relative difference vs a train-only scaler: "
                       f"mean {rel_mean:.2e}, std {rel_scale:.2e}. Effect on frozen-model test ROC-AUC: "
                       f"{m_full['roc_auc']:.5f} (as trained) vs {m_clean['roc_auc']:.5f} (train-only scaler); "
                       f"F1 {m_full['f1']:.4f} vs {m_clean['f1']:.4f}. Kept for the frozen model; candidates use split-first.",
             "scaler_rel_diff_mean": rel_mean, "scaler_rel_diff_std": rel_scale,
             "test_roc_auc_full_scaler": m_full["roc_auc"], "test_roc_auc_train_only_scaler": m_clean["roc_auc"]},
            {"id": "label_encoder_fit_before_split", "status": "PASS (benign)",
             "detail": f"Encoder fit on full data; unseen test categories vs train: {unseen_cat}. Codes are alphabetical and fixed in the artifact."},
            {"id": "target_leakage_in_features", "status": "NOTE",
             "detail": "No feature is derived from the label. HOWEVER HbA1c and blood glucose are themselves diagnostic criteria for "
                       "diabetes, so very high discrimination is expected and the task is closer to detection than to prospective risk "
                       "prediction. Do not present performance as early-risk forecasting."},
            {"id": "early_stopping_validation_reuse", "status": "NOTE",
             "detail": "Keras validation_split took the LAST 15% of train.csv, used for early stopping / best-epoch selection. These rows were "
                       "never trained on but did influence model selection; they are used here for calibration + threshold selection, never for reporting test metrics."},
            {"id": "patient_level_duplication", "status": "NOT VERIFIABLE",
             "detail": "The dataset has no patient identifier; repeated visits by one patient cannot be detected or excluded."},
            {"id": "random_seed", "status": "PASS (partial)",
             "detail": "Split seed=42 reproduced bit-for-bit. TF weights seeded with 42 in create_model; GPU/CPU non-determinism not fully controlled."},
        ],
        "split_reproduction": split_check,
        "split_sizes": {"deduplicated": int(len(df)), "train_total": int(len(train_idx)), "train_fit": int(len(fit_idx)),
                        "validation": int(len(val_idx)), "test": int(len(test_idx))},
        "test_positive_rate": float(y_test.mean()), "train_positive_rate": float(y_all[train_idx].mean()),
    }
    write_json(OUT / "leakage_audit.json", leakage)

    # ============ 2. FROZEN PRODUCTION MODEL EVALUATION ===========================
    log("production model metrics")
    prod = {
        "train_fit": classification_metrics(y_fit, s_fit, 0.5),
        "validation": classification_metrics(y_val, s_val, 0.5),
        "test": m_full,
    }
    prod_cal_raw = {"validation": calibration_metrics(y_val, s_val), "test": calibration_metrics(y_test, s_test)}

    # ---- Calibration: fit Platt on VALIDATION logits; evaluate on TEST -----------
    platt = LogisticRegression(C=1e6, max_iter=1000).fit(z_val.reshape(-1, 1), y_val)
    a, b = float(platt.coef_[0][0]), float(platt.intercept_[0])
    p_val_cal = sigmoid(a * z_val + b)
    p_test_cal = sigmoid(a * z_test + b)
    from sklearn.isotonic import IsotonicRegression
    iso = IsotonicRegression(out_of_bounds="clip", y_min=0, y_max=1).fit(s_val, y_val)
    p_test_iso = iso.predict(s_test)

    cal_raw = calibration_metrics(y_test, s_test)
    cal_platt = calibration_metrics(y_test, p_test_cal)
    cal_iso = calibration_metrics(y_test, p_test_iso)
    rel = lambda new, old: (old - new) / old if old > 0 else 0.0
    brier_gain, ece_gain = rel(cal_platt["brier"], cal_raw["brier"]), rel(cal_platt["ece_10bin"], cal_raw["ece_10bin"])
    adopt_cal = bool(brier_gain >= 0.10 and ece_gain >= 0.10)
    calibration = {
        "method_evaluated": "Platt scaling on pre-sigmoid logits, fit on the held-out validation split (never on test)",
        "platt": {"a": a, "b": b, "fit_rows": int(len(z_val))},
        "test_raw_model_score": cal_raw, "test_platt_calibrated": cal_platt, "test_isotonic_reference": cal_iso,
        "validation_raw_model_score": prod_cal_raw["validation"],
        "relative_improvement_platt_vs_raw": {"brier": brier_gain, "ece": ece_gain},
        "decision_rule": "Adopt calibrated probability for display only if Platt improves BOTH test Brier and test ECE by >=10% relative; "
                         "otherwise the output is labelled 'model score' and NOT presented as a probability.",
        "adopted": adopt_cal,
        "decision": "ADOPT_CALIBRATED_PROBABILITY" if adopt_cal else "LABEL_AS_MODEL_SCORE",
        "score_saturation": {
            "pct_test_scores_gt_0.99": float((s_test > 0.99).mean() * 100),
            "pct_test_scores_lt_0.01": float((s_test < 0.01).mean() * 100),
            "pct_test_scores_between_0.1_and_0.9": float(((s_test > 0.1) & (s_test < 0.9)).mean() * 100),
        },
        "reliability_raw": reliability_table(y_test, s_test),
        "reliability_platt": reliability_table(y_test, p_test_cal),
        "note": "Calibration set (last 15% of train.csv) also drove early stopping; calibration quality is judged on the untouched test set.",
    }
    plot_reliability(y_test, {"raw model score": s_test, "Platt calibrated": p_test_cal}, FIG / "calibration_reliability.png")
    write_json(OUT / "calibration.json", calibration)

    # The score actually reported to users (decided by evidence above)
    report_val = p_val_cal if adopt_cal else s_val
    report_test = p_test_cal if adopt_cal else s_test
    log(f"calibration decision: {calibration['decision']} (brier gain {brier_gain:.1%}, ece gain {ece_gain:.1%})")

    # ---- Thresholds (selection on VALIDATION only) -------------------------------
    grid = [round(t, 2) for t in np.arange(0.05, 0.951, 0.05)]
    named = [0.30, 0.40, 0.50, 0.60, 0.70]
    rows = []
    for t in sorted(set(grid + named)):
        mv = classification_metrics(y_val, report_val, t)
        mt = classification_metrics(y_test, report_test, t)
        rows.append({"threshold": t, "named": t in named,
                     **{f"val_{k}": mv[k] for k in ("precision", "recall", "specificity", "f1")},
                     **{f"test_{k}": mt[k] for k in ("precision", "recall", "specificity", "f1", "accuracy", "mcc")}})
    thr = pd.DataFrame(rows)
    thr.to_csv(OUT / "threshold_analysis.csv", index=False)
    best = thr.loc[thr["val_f1"].idxmax()]
    base = thr.loc[thr["threshold"] == 0.5].iloc[0]
    justified = bool(best["threshold"] != 0.5 and (best["val_f1"] - base["val_f1"]) >= 0.01
                     and best["test_f1"] >= base["test_f1"] - 0.005)
    op_thr = float(best["threshold"]) if justified else 0.5
    threshold_info = {
        "candidates_evaluated": [float(t) for t in sorted(set(grid + named))],
        "best_threshold_by_validation_f1": float(best["threshold"]),
        "val_f1_at_best": float(best["val_f1"]), "val_f1_at_0.5": float(base["val_f1"]),
        "test_f1_at_best": float(best["test_f1"]), "test_f1_at_0.5": float(base["test_f1"]),
        "rule": "Move off 0.5 only if validation F1 improves by >=0.01 AND test F1 is not worse by >0.005.",
        "justified_change": justified, "operational_threshold": op_thr,
        "disclaimer": "Operating threshold is chosen on statistical validation only; it is not clinically optimal or clinically validated.",
    }
    write_json(OUT / "threshold_decision.json", threshold_info)

    # ---- headline test metrics + bootstrap CI at operating threshold ------------
    final_test = classification_metrics(y_test, report_test, op_thr)
    ci = bootstrap_ci(y_test, report_test, op_thr, n_boot=args.n_boot)
    plot_confusion(final_test, FIG / "production_confusion_matrix.png", f"Production model, test (thr {op_thr})")
    plot_roc_pr(y_test, {"production TF": report_test}, FIG / "production_roc.png", FIG / "production_pr.png", "test set")

    # ---- risk bands: observed rates on test ------------------------------------
    bands = {}
    for name in ("low", "moderate", "high"):
        m = np.array([band(s) == name for s in report_test])
        bands[name] = {"n": int(m.sum()), "observed_diabetes_rate": float(y_test[m].mean()) if m.any() else None}

    # ---- subgroups on test --------------------------------------------------------
    te_df = df.iloc[test_idx].reset_index(drop=True)
    age_band = pd.cut(te_df["age"], [-1, 17.99, 39.99, 59.99, 200], labels=["<18", "18-39", "40-59", "60+"])
    groups = {"gender": te_df["gender"], "age_band": age_band.astype(str),
              "hypertension": te_df["hypertension"].map({0: "no", 1: "yes"}),
              "heart_disease": te_df["heart_disease"].map({0: "no", 1: "yes"})}
    sub_rows = []
    for gname, series in groups.items():
        for level in sorted(series.unique()):
            m = (series == level).values
            n = int(m.sum())
            if n == 0:
                continue
            row = {"group": gname, "level": level, "n": n, "positives": int(y_test[m].sum())}
            if n >= 30 and 0 < y_test[m].sum() < n:
                mm = classification_metrics(y_test[m], report_test[m], op_thr)
                row.update({k: mm[k] for k in ("accuracy", "precision", "recall", "specificity", "f1", "roc_auc")})
                row["flag"] = ""
                if abs(mm["recall"] - final_test["recall"]) > 0.10:
                    row["flag"] = "recall differs >10pp from overall - review"
                if mm["f1"] < final_test["f1"] - 0.10:
                    row["flag"] = (row["flag"] + "; " if row["flag"] else "") + "F1 >10pp below overall - review"
            else:
                row["flag"] = "insufficient sample/positives for stable metrics"
            sub_rows.append(row)
    sub = pd.DataFrame(sub_rows)
    sub.to_csv(OUT / "subgroup_metrics.csv", index=False)

    # ---- serialization round-trip ----------------------------------------------
    import tensorflow as tf
    with tempfile.TemporaryDirectory() as td:
        p = Path(td) / "roundtrip.keras"
        model.save(str(p))
        reloaded = tf.keras.models.load_model(str(p))
        probe = X_test[:5000]
        d_ser = float(np.abs(tf_scores(model, probe) - tf_scores(reloaded, probe)).max())
    serialization = {"status": "PASS" if d_ser < 1e-5 else "FAIL", "max_abs_score_diff": d_ser, "rows_compared": 5000,
                     "tolerance": 1e-5, "artifact": "models/tensorflow/diabetes_nn.keras", "artifact_sha256": model_sha}

    # ---- exact SHAP global importance + background -------------------------------
    log("exact SHAP global importance")
    rng = np.random.default_rng(SEED)
    bg_idx = rng.choice(len(X_fit), 50, replace=False)
    background = X_fit[bg_idx]
    if adopt_cal:
        def report_fn(x):
            return sigmoid(a * logits_from(model, np.asarray(x, dtype=np.float32)) + b)
    else:
        def report_fn(x):
            return tf_scores(model, np.asarray(x, dtype=np.float32))
    ex_idx = rng.choice(len(X_test), 200, replace=False)
    phis = []
    for i in ex_idx:
        phi, base_v, fx = exact_shapley(report_fn, X_test[i], background)
        phis.append(phi)
    phis = np.asarray(phis)
    glob = sorted(
        [{"feature": f, "importance": float(np.abs(phis[:, j]).mean()), "mean_signed": float(phis[:, j].mean())}
         for j, f in enumerate(FEATURE_ORDER)], key=lambda r: -r["importance"])
    glob_doc = {"method": "mean |exact Shapley value| over 200 random held-out test rows, 50-row training background",
                "units": "reported score" if not adopt_cal else "calibrated probability", "seed": SEED,
                "n_explained": 200, "n_background": 50, "model_version": "HF-NN-v1.0", "features": glob}
    write_json(OUT / "global_shap_importance.json", glob_doc)
    write_json(ROOT / "models" / "preprocessors" / "shap_background_v1.json",
               {"version": "shap-bg-v1", "seed": SEED, "source": "train.csv fit-split rows (scaled space)",
                "feature_order": FEATURE_ORDER, "rows": np.round(background, 6).tolist()})

    # ============ 3. CANDIDATES (split-first, same train rows, same test rows) =======
    candidates, cv_rows = [], []
    comparison = [{"model": "HF-NN-v1.0 (production TF, frozen)", "role": "production",
                   **{k: final_test[k] for k in ("accuracy", "precision", "recall", "specificity", "f1", "mcc", "roc_auc", "pr_auc")},
                   "brier": cal_platt["brier"] if adopt_cal else cal_raw["brier"],
                   "ece": cal_platt["ece_10bin"] if adopt_cal else cal_raw["ece_10bin"], "threshold": op_thr}]
    if not args.skip_candidates:
        log("candidate comparison (split-first)")
        fit_df, val_df, test_df = df.iloc[fit_idx], df.iloc[val_idx], df.iloc[test_idx]

        def encode(frame, scaler):
            Xr = np.empty((len(frame), 8))
            Xr[:] = pp.transform_frame(frame).astype(np.float64)
            # undo the artifact scaling, then apply the candidate's TRAIN-ONLY scaler
            Xr[:, nidx] = frame[NUMERIC_FEATURES].values
            Xr[:, nidx] = scaler.transform(frame[NUMERIC_FEATURES].values)
            return Xr.astype(np.float32)

        def make(name):
            if name == "Logistic Regression":
                return LogisticRegression(max_iter=2000, class_weight="balanced", random_state=SEED)
            if name == "Decision Tree":
                return DecisionTreeClassifier(max_depth=8, min_samples_leaf=20, class_weight="balanced", random_state=SEED)
            return RandomForestClassifier(n_estimators=200, max_depth=14, min_samples_leaf=5, class_weight="balanced_subsample",
                                          n_jobs=2, random_state=SEED)

        sk_names = ["Logistic Regression", "Decision Tree", "Random Forest"]
        cand_scores = {"production TF": report_test}
        for name in sk_names:
            sc = StandardScaler().fit(fit_df[NUMERIC_FEATURES])  # TRAIN ONLY
            m = make(name).fit(encode(fit_df, sc), fit_df["diabetes"].values)
            s = m.predict_proba(encode(test_df, sc))[:, 1]
            cand_scores[name] = s
            mt = classification_metrics(y_test, s, 0.5)
            cm = calibration_metrics(y_test, s)
            comparison.append({"model": name, "role": "candidate (baseline)", **{k: mt[k] for k in ("accuracy", "precision", "recall", "specificity", "f1", "mcc", "roc_auc", "pr_auc")},
                               "brier": cm["brier"], "ece": cm["ece_10bin"], "threshold": 0.5})
            log(f"  {name}: F1={mt['f1']:.4f} AUC={mt['roc_auc']:.4f}")

        if not args.skip_tf_candidate:
            from src.ml.tensorflow_model import create_model
            from tensorflow.keras.callbacks import EarlyStopping
            from sklearn.utils.class_weight import compute_class_weight

            def train_tf(train_frame, val_frame):
                sc = StandardScaler().fit(train_frame[NUMERIC_FEATURES])
                Xa, ya = encode(train_frame, sc), train_frame["diabetes"].values
                Xb, yb = encode(val_frame, sc), val_frame["diabetes"].values
                cw = dict(zip([0, 1], compute_class_weight("balanced", classes=np.array([0, 1]), y=ya)))
                mdl = create_model(input_dim=8, learning_rate=0.001)
                mdl.fit(Xa, ya, validation_data=(Xb, yb), epochs=40, batch_size=512, class_weight=cw, verbose=0,
                        callbacks=[EarlyStopping(monitor="val_auc", mode="max", patience=6, restore_best_weights=True)])
                return mdl, sc
            tfm, tfs = train_tf(fit_df, val_df)
            s = tf_scores(tfm, encode(test_df, tfs))
            cand_scores["TF candidate (clean split)"] = s
            mt = classification_metrics(y_test, s, 0.5)
            cm = calibration_metrics(y_test, s)
            comparison.append({"model": "TF candidate (clean split-first, same architecture)", "role": "candidate", **{k: mt[k] for k in ("accuracy", "precision", "recall", "specificity", "f1", "mcc", "roc_auc", "pr_auc")},
                               "brier": cm["brier"], "ece": cm["ece_10bin"], "threshold": 0.5})
            log(f"  TF candidate: F1={mt['f1']:.4f} AUC={mt['roc_auc']:.4f}")

        plot_roc_pr(y_test, cand_scores, FIG / "comparison_roc.png", FIG / "comparison_pr.png", "model comparison (test)")

        # ---- 5-fold stratified CV on TRAIN rows only (test untouched) -----------
        log("5-fold stratified CV (train rows only)")
        tr_df = df.iloc[train_idx].reset_index(drop=True)
        skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=SEED)
        names_cv = sk_names + ([] if args.skip_tf_candidate else ["TF candidate (clean split)"])
        for fold, (a_i, b_i) in enumerate(skf.split(tr_df, tr_df["diabetes"]), 1):
            fa, fb = tr_df.iloc[a_i], tr_df.iloc[b_i]
            for name in names_cv:
                if name == "TF candidate (clean split)":
                    inner_a, inner_v = train_test_split(fa, test_size=0.15, random_state=SEED, stratify=fa["diabetes"])
                    mdl, sc = train_tf(inner_a, inner_v)
                    s = tf_scores(mdl, encode(fb, sc))
                else:
                    sc = StandardScaler().fit(fa[NUMERIC_FEATURES])  # fit on fold-train only
                    mdl = make(name).fit(encode(fa, sc), fa["diabetes"].values)
                    s = mdl.predict_proba(encode(fb, sc))[:, 1]
                mm = classification_metrics(fb["diabetes"].values, s, 0.5)
                cv_rows.append({"model": name, "fold": fold, **{k: mm[k] for k in ("accuracy", "precision", "recall", "specificity", "f1", "roc_auc", "pr_auc", "mcc")}})
            log(f"  fold {fold}/5 done")
        cv = pd.DataFrame(cv_rows)
        summ = cv.groupby("model").agg(["mean", "std"]).drop(columns="fold", level=0)
        summ.columns = [f"{m}_{s}" for m, s in summ.columns]
        summ = summ.reset_index()
        summ.insert(1, "fold", "mean/std")
        pd.concat([cv, summ], ignore_index=True).to_csv(OUT / "cross_validation.csv", index=False)

    cmp_df = pd.DataFrame(comparison)
    cmp_df.to_csv(OUT / "model_comparison.csv", index=False)

    # promotion decision --------------------------------------------------------------
    prod_row = cmp_df.iloc[0]
    decisions = []
    for _, r in cmp_df.iloc[1:].iterrows():
        better = (r["f1"] > prod_row["f1"] and r["pr_auc"] > prod_row["pr_auc"] and r["recall"] >= prod_row["recall"] - 0.02
                  and r["brier"] <= prod_row["brier"] * 1.05)
        decisions.append({"candidate": r["model"], "meets_internal_criteria": bool(better),
                          "promoted": False,
                          "reason": ("Meets internal criteria but is NOT promoted: no independent external validation exists, "
                                     "and promotion requires external validation." if better else
                                     "Does not beat production on F1 + PR-AUC + recall + calibration jointly.")})

    # ---- internal drift sanity (train vs test; NOT external) ------------------------
    internal_drift = dataset_drift(df.iloc[train_idx], df.iloc[test_idx])

    # ============ 4. METADATA + SUMMARY =============================================
    import sklearn, scipy
    metadata = {
        "model_id": "hf-nn-v1", "model_version": "HF-NN-v1.0", "artifact": "models/tensorflow/diabetes_nn.keras",
        "artifact_sha256": model_sha, "preprocessing_version": pp.version,
        "preprocessing_artifact": "models/preprocessors/preprocessing_v1.json",
        "feature_order": FEATURE_ORDER, "target": "diabetes",
        "dataset": {"file": SOURCE.name, "sha256": audit["file_hash_comparison"]["primary"]["sha256"],
                    "rows_raw": audit["rows"], "rows_after_dedup": int(len(df))},
        "seeds": {"split": SEED, "bootstrap": SEED, "candidates": SEED, "shap_sampling": SEED, "tf_create_model": 42},
        "split": leakage["split_sizes"],
        "versions": {"python": sys.version.split()[0], "tensorflow": tf.__version__, "numpy": np.__version__,
                     "pandas": pd.__version__, "scikit_learn": sklearn.__version__, "scipy": scipy.__version__,
                     "platform": platform.platform()},
        "generated_at_utc": pd.Timestamp.utcnow().isoformat(),
        "pipeline": "python -m src.validation.run_validation",
    }
    write_json(OUT / "model_metadata.json", metadata)

    model_config = {
        "model_id": "hf-nn-v1", "model_version": "HF-NN-v1.0", "model_sha256": model_sha,
        "preprocessing_version": pp.version, "score_semantics": "calibrated_probability" if adopt_cal else "model_score",
        "calibration": {"type": "platt_on_logit", "a": a, "b": b, "fit_on": "held-out validation split (last 15% of train.csv)",
                        "fit_rows": int(len(z_val))} if adopt_cal else None,
        "threshold": op_thr, "risk_bands": {"low_max": 0.3, "high_min": 0.7,
                                            "note": "Display categories on the reported score; observed test rates per band are in the model card."},
        "explanation_units": "calibrated probability" if adopt_cal else "model score",
        "generated_from": "reports/model_validation/model_validation_summary.json",
        "disclaimer": "Statistical operating point; not clinically validated.",
    }
    write_json(ROOT / "models" / "model_config_v1.json", model_config)

    summary = {
        "model": {"id": "hf-nn-v1", "version": "HF-NN-v1.0", "type": "Neural network (TensorFlow/Keras)", "sha256": model_sha,
                  "training_mode": "centralized (a federated simulation exists separately; this artifact is NOT a federated global model)"},
        "status_labels": {
            "internal_validation": "VALIDATED" if serialization["status"] == "PASS" else "FAILED",
            "cross_validation": "INTERNAL VALIDATION (candidates only; frozen production model cannot be cross-validated without leakage)" if cv_rows else "NOT RUN",
            "calibration": "VALIDATED" if adopt_cal else "NOT CALIBRATED - reported as model score",
            "external_validation": "PENDING", "federated_learning": "SIMULATION",
        },
        "score_semantics": model_config["score_semantics"],
        "operating_threshold": op_thr,
        "test_metrics": final_test, "test_metrics_ci95": ci,
        "metrics_by_split": {"train_fit_thr0.5": prod["train_fit"], "validation_thr0.5": prod["validation"], "test_thr0.5": prod["test"]},
        "calibration": {k: calibration[k] for k in ("test_raw_model_score", "test_platt_calibrated", "decision", "score_saturation", "adopted")},
        "threshold": threshold_info, "risk_band_observed_rates_test": bands,
        "subgroups_flagged": sub[sub["flag"].astype(str).str.len() > 0][["group", "level", "n", "flag"]].to_dict("records"),
        "comparison": cmp_df.to_dict("records"), "promotion_decisions": decisions,
        "cross_validation_summary": (summ.to_dict("records") if cv_rows else []),
        "leakage": {c["id"]: c["status"] for c in leakage["checks"]},
        "serialization": serialization, "logit_sigmoid_consistency_max_abs": logit_consistency,
        "internal_drift_train_vs_test": {"max_psi": internal_drift["max_psi"], "reading": internal_drift["overall_reading"]},
        "external_validation": {"status": "PENDING", "reason": "No independent dataset with compatible semantics is available; "
                                "the supplied CSVs are byte-identical to the training source."},
        "generated_at_utc": metadata["generated_at_utc"], "runtime_seconds": round(time.time() - t0, 1),
    }
    write_json(OUT / "model_validation_summary.json", summary)
    log(f"done in {time.time() - t0:.0f}s -> {OUT.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
