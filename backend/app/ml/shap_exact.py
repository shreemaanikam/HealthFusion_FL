"""
Exact interventional SHAP (Shapley values) for an 8-feature model.

With d = 8 features there are only 2^8 = 256 feature coalitions, so Shapley values
can be computed EXACTLY rather than sampled. This is the exact limit of
shap.KernelExplainer with a marginal (interventional) background, i.e. identical
values to `shap.KernelExplainer(f, background).shap_values(x, nsamples >= 254)`
(verified against the `shap` library in tests/unit/test_shap_exact.py).

Properties (checked in tests):
  * efficiency:  base_value + sum(phi) == f(x)
  * deterministic: no sampling noise, no random seed
  * values are in units of the explained model's output (the model score)

Interpretation: phi_i is how much feature i moved THIS prediction away from the
average prediction over the background (training) rows. It describes the model's
behaviour; it is not evidence that the feature causes the outcome.
"""
from __future__ import annotations

from math import factorial
from typing import Callable, Tuple

import numpy as np


def _coalition_table(d: int):
    n_masks = 1 << d
    masks = ((np.arange(n_masks)[:, None] >> np.arange(d)[None, :]) & 1).astype(bool)  # (2^d, d)
    return masks


def exact_shapley(
    predict_fn: Callable[[np.ndarray], np.ndarray],
    x: np.ndarray,
    background: np.ndarray,
) -> Tuple[np.ndarray, float, float]:
    """
    Args:
        predict_fn: maps an (n, d) float array to an (n,) score array.
        x: (d,) instance, in the model's input space.
        background: (B, d) reference rows (the expectation is taken over these).

    Returns:
        phi (d,), base_value (mean score over background), fx (score of x).
    """
    x = np.asarray(x, dtype=np.float32).reshape(-1)
    bg = np.asarray(background, dtype=np.float32)
    d = x.shape[0]
    B = bg.shape[0]
    masks = _coalition_table(d)  # (M, d)
    M = masks.shape[0]

    # Hybrid rows: where mask is True take x, else the background row.
    hybrid = np.where(masks[:, None, :], x[None, None, :], bg[None, :, :])  # (M, B, d)
    scores = np.asarray(predict_fn(hybrid.reshape(M * B, d))).reshape(M, B)
    v = scores.mean(axis=1)  # value of each coalition, shape (M,)

    sizes = masks.sum(axis=1)
    fact = [factorial(k) for k in range(d + 1)]
    phi = np.zeros(d, dtype=np.float64)
    bit = 1 << np.arange(d)
    idx = np.arange(M)
    for i in range(d):
        without = idx[(idx & bit[i]) == 0]
        with_i = without | bit[i]
        s = sizes[without]
        w = np.array([fact[k] * fact[d - k - 1] / fact[d] for k in s], dtype=np.float64)
        phi[i] = float(np.sum(w * (v[with_i] - v[without])))

    base_value = float(v[0])        # empty coalition: mean over background
    fx = float(v[M - 1])            # full coalition: f(x)
    return phi, base_value, fx
