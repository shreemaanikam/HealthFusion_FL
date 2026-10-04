"""Distribution-shift statistics between a reference dataset and a comparison dataset.

Numeric features: Kolmogorov–Smirnov statistic + Population Stability Index (PSI,
reference-quantile bins). Categorical/binary: PSI over category proportions and a
chi-square test. Conventional PSI reading (rule of thumb, not a statistical test):
<0.10 little shift, 0.10–0.25 moderate, >0.25 large.
"""
from __future__ import annotations

from typing import Dict

import numpy as np
import pandas as pd
from scipy import stats

NUMERIC = ["age", "bmi", "HbA1c_level", "blood_glucose_level"]
CATEGORICAL = ["gender", "smoking_history", "hypertension", "heart_disease"]
EPS = 1e-4


def _psi(ref_p: np.ndarray, cmp_p: np.ndarray) -> float:
    ref_p = np.clip(ref_p, EPS, None)
    cmp_p = np.clip(cmp_p, EPS, None)
    return float(np.sum((cmp_p - ref_p) * np.log(cmp_p / ref_p)))


def numeric_drift(ref: pd.Series, cmp_: pd.Series, n_bins: int = 10) -> Dict[str, float]:
    edges = np.unique(np.quantile(ref, np.linspace(0, 1, n_bins + 1)))
    edges[0], edges[-1] = -np.inf, np.inf
    ref_p = np.histogram(ref, bins=edges)[0] / len(ref)
    cmp_p = np.histogram(cmp_, bins=edges)[0] / len(cmp_)
    ks = stats.ks_2samp(ref, cmp_)
    return {
        "psi": _psi(ref_p, cmp_p), "ks_statistic": float(ks.statistic), "ks_pvalue": float(ks.pvalue),
        "ref_mean": float(ref.mean()), "cmp_mean": float(cmp_.mean()),
        "ref_std": float(ref.std()), "cmp_std": float(cmp_.std()),
        "ref_min": float(ref.min()), "cmp_min": float(cmp_.min()),
        "ref_max": float(ref.max()), "cmp_max": float(cmp_.max()),
    }


def categorical_drift(ref: pd.Series, cmp_: pd.Series) -> Dict[str, object]:
    cats = sorted(set(ref.astype(str)) | set(cmp_.astype(str)))
    ref_c = ref.astype(str).value_counts().reindex(cats, fill_value=0)
    cmp_c = cmp_.astype(str).value_counts().reindex(cats, fill_value=0)
    ref_p = (ref_c / ref_c.sum()).values
    cmp_p = (cmp_c / cmp_c.sum()).values
    p = None
    if len(cats) > 1:
        table = np.vstack([ref_c.values, cmp_c.values])
        table = table[:, table.sum(axis=0) > 0]
        p = float(stats.chi2_contingency(table)[1]) if table.shape[1] > 1 else None
    return {
        "psi": _psi(ref_p, cmp_p), "chi2_pvalue": p,
        "ref_proportions": dict(zip(cats, map(float, ref_p))),
        "cmp_proportions": dict(zip(cats, map(float, cmp_p))),
    }


def psi_reading(psi: float) -> str:
    return "little shift" if psi < 0.10 else "moderate shift" if psi < 0.25 else "large shift"


def dataset_drift(ref: pd.DataFrame, cmp_: pd.DataFrame) -> Dict[str, object]:
    out: Dict[str, object] = {"numeric": {}, "categorical": {}, "target": {}}
    for c in NUMERIC:
        d = numeric_drift(ref[c], cmp_[c])
        d["reading"] = psi_reading(d["psi"])
        out["numeric"][c] = d
    for c in CATEGORICAL:
        d = categorical_drift(ref[c], cmp_[c])
        d["reading"] = psi_reading(d["psi"])
        out["categorical"][c] = d
    if "diabetes" in ref and "diabetes" in cmp_:
        out["target"] = {"ref_prevalence": float(ref["diabetes"].mean()), "cmp_prevalence": float(cmp_["diabetes"].mean())}
    worst = max([v["psi"] for v in out["numeric"].values()] + [v["psi"] for v in out["categorical"].values()])
    out["max_psi"] = float(worst)
    out["overall_reading"] = psi_reading(worst)
    return out
