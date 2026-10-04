"""Shared metric / calibration / bootstrap / plotting helpers for model validation.

Everything here is deterministic given its `seed` argument. Nothing in this module
fits a production model.
"""
from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Sequence

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402
import numpy as np  # noqa: E402
from sklearn.metrics import (  # noqa: E402
    accuracy_score, average_precision_score, brier_score_loss, confusion_matrix,
    f1_score, log_loss, matthews_corrcoef, precision_score, precision_recall_curve,
    recall_score, roc_auc_score, roc_curve,
)

SEED = 42


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as fh:
        for chunk in iter(lambda: fh.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def classification_metrics(y_true, score, threshold: float = 0.5) -> Dict[str, float]:
    y_true = np.asarray(y_true).astype(int)
    score = np.asarray(score, dtype=np.float64)
    pred = (score >= threshold).astype(int)
    tn, fp, fn, tp = confusion_matrix(y_true, pred, labels=[0, 1]).ravel()
    spec = tn / (tn + fp) if (tn + fp) else float("nan")
    out = {
        "n": int(len(y_true)),
        "prevalence": float(y_true.mean()),
        "threshold": float(threshold),
        "accuracy": float(accuracy_score(y_true, pred)),
        "precision": float(precision_score(y_true, pred, zero_division=0)),
        "recall": float(recall_score(y_true, pred, zero_division=0)),
        "specificity": float(spec),
        "f1": float(f1_score(y_true, pred, zero_division=0)),
        "mcc": float(matthews_corrcoef(y_true, pred)) if len(set(pred)) > 1 else 0.0,
        "tn": int(tn), "fp": int(fp), "fn": int(fn), "tp": int(tp),
    }
    if len(np.unique(y_true)) == 2:
        out["roc_auc"] = float(roc_auc_score(y_true, score))
        out["pr_auc"] = float(average_precision_score(y_true, score))
    else:
        out["roc_auc"] = float("nan")
        out["pr_auc"] = float("nan")
    return out


def expected_calibration_error(y_true, prob, n_bins: int = 10) -> float:
    """Equal-width-bin ECE: sum_b (n_b/n) * |mean(y)_b - mean(p)_b|."""
    y = np.asarray(y_true, dtype=float)
    p = np.asarray(prob, dtype=float)
    bins = np.linspace(0.0, 1.0, n_bins + 1)
    ids = np.clip(np.digitize(p, bins[1:-1], right=False), 0, n_bins - 1)
    ece = 0.0
    for b in range(n_bins):
        m = ids == b
        if m.any():
            ece += m.mean() * abs(y[m].mean() - p[m].mean())
    return float(ece)


def reliability_table(y_true, prob, n_bins: int = 10) -> List[Dict[str, float]]:
    y = np.asarray(y_true, dtype=float)
    p = np.asarray(prob, dtype=float)
    bins = np.linspace(0.0, 1.0, n_bins + 1)
    ids = np.clip(np.digitize(p, bins[1:-1], right=False), 0, n_bins - 1)
    rows = []
    for b in range(n_bins):
        m = ids == b
        rows.append({
            "bin_low": float(bins[b]), "bin_high": float(bins[b + 1]), "count": int(m.sum()),
            "mean_predicted": float(p[m].mean()) if m.any() else None,
            "observed_rate": float(y[m].mean()) if m.any() else None,
        })
    return rows


def calibration_metrics(y_true, prob) -> Dict[str, float]:
    p = np.clip(np.asarray(prob, dtype=float), 1e-7, 1 - 1e-7)
    return {
        "brier": float(brier_score_loss(y_true, p)),
        "ece_10bin": expected_calibration_error(y_true, p, 10),
        "log_loss": float(log_loss(y_true, p, labels=[0, 1])),
    }


def bootstrap_ci(
    y_true, score, threshold: float = 0.5, n_boot: int = 1000, seed: int = SEED, alpha: float = 0.05,
) -> Dict[str, Dict[str, float]]:
    """Percentile bootstrap (resample test rows with replacement) for key metrics."""
    y = np.asarray(y_true).astype(int)
    s = np.asarray(score, dtype=np.float64)
    rng = np.random.default_rng(seed)
    n = len(y)
    keys = ["accuracy", "precision", "recall", "specificity", "f1", "roc_auc", "pr_auc"]
    draws = {k: [] for k in keys}
    for _ in range(n_boot):
        idx = rng.integers(0, n, n)
        if len(np.unique(y[idx])) < 2:
            continue
        m = classification_metrics(y[idx], s[idx], threshold)
        for k in keys:
            draws[k].append(m[k])
    out = {}
    for k in keys:
        a = np.asarray(draws[k])
        out[k] = {
            "lower": float(np.nanpercentile(a, 100 * alpha / 2)),
            "upper": float(np.nanpercentile(a, 100 * (1 - alpha / 2))),
            "n_boot": int(len(a)), "seed": seed, "method": "percentile bootstrap over test rows",
        }
    return out


# ---------------------------------------------------------------- plotting

def plot_confusion(m: Dict[str, float], path: Path, title: str) -> None:
    cm = np.array([[m["tn"], m["fp"]], [m["fn"], m["tp"]]])
    fig, ax = plt.subplots(figsize=(4.2, 3.8))
    ax.imshow(cm, cmap="Blues")
    for (i, j), v in np.ndenumerate(cm):
        ax.text(j, i, f"{v:,}", ha="center", va="center", color="black" if v < cm.max() / 2 else "white")
    ax.set_xticks([0, 1], ["Pred 0", "Pred 1"])
    ax.set_yticks([0, 1], ["True 0", "True 1"])
    ax.set_title(title, fontsize=9)
    fig.tight_layout()
    fig.savefig(path, dpi=140)
    plt.close(fig)


def plot_roc_pr(y_true, scores: Dict[str, np.ndarray], roc_path: Path, pr_path: Path, title: str) -> None:
    fig, ax = plt.subplots(figsize=(5, 4.2))
    for name, s in scores.items():
        fpr, tpr, _ = roc_curve(y_true, s)
        ax.plot(fpr, tpr, label=f"{name} (AUC {roc_auc_score(y_true, s):.3f})")
    ax.plot([0, 1], [0, 1], "k--", lw=0.8)
    ax.set_xlabel("False positive rate"); ax.set_ylabel("True positive rate")
    ax.set_title(f"ROC — {title}", fontsize=9); ax.legend(fontsize=7)
    fig.tight_layout(); fig.savefig(roc_path, dpi=140); plt.close(fig)

    fig, ax = plt.subplots(figsize=(5, 4.2))
    for name, s in scores.items():
        pr, rc, _ = precision_recall_curve(y_true, s)
        ax.plot(rc, pr, label=f"{name} (AP {average_precision_score(y_true, s):.3f})")
    ax.axhline(float(np.mean(y_true)), color="k", ls="--", lw=0.8, label="prevalence")
    ax.set_xlabel("Recall"); ax.set_ylabel("Precision")
    ax.set_title(f"Precision-Recall — {title}", fontsize=9); ax.legend(fontsize=7)
    fig.tight_layout(); fig.savefig(pr_path, dpi=140); plt.close(fig)


def plot_reliability(y_true, curves: Dict[str, np.ndarray], path: Path, n_bins: int = 10) -> None:
    fig, axes = plt.subplots(1, 2, figsize=(9, 4))
    axes[0].plot([0, 1], [0, 1], "k--", lw=0.8, label="perfect")
    for name, p in curves.items():
        rows = [r for r in reliability_table(y_true, p, n_bins) if r["count"] > 0]
        axes[0].plot([r["mean_predicted"] for r in rows], [r["observed_rate"] for r in rows], "o-", ms=3, label=name)
    axes[0].set_xlabel("Mean predicted"); axes[0].set_ylabel("Observed rate")
    axes[0].set_title("Reliability curve", fontsize=9); axes[0].legend(fontsize=7)
    for name, p in curves.items():
        axes[1].hist(p, bins=20, range=(0, 1), alpha=0.5, label=name)
    axes[1].set_yscale("log"); axes[1].set_xlabel("Score"); axes[1].set_title("Score distribution (log count)", fontsize=9)
    axes[1].legend(fontsize=7)
    fig.tight_layout(); fig.savefig(path, dpi=140); plt.close(fig)


def jsonable(obj):
    """Make numpy scalars / NaN safe for json.dump."""
    if isinstance(obj, dict):
        return {k: jsonable(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)):
        return [jsonable(v) for v in obj]
    if isinstance(obj, (np.floating, float)):
        f = float(obj)
        return None if np.isnan(f) or np.isinf(f) else f
    if isinstance(obj, (np.integer,)):
        return int(obj)
    if isinstance(obj, (np.bool_,)):
        return bool(obj)
    return obj


def write_json(path: Path, obj) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(jsonable(obj), indent=2) + "\n")
