# HealthFusion_FL Model Validation Report

## Phase D — Model Validation
**Model:** HF-NN-v1.0
**Type:** Neural network (TensorFlow/Keras)

### Test Metrics
- **Accuracy:** 0.9713
- **Precision:** 0.9807
- **Recall:** 0.6881
- **Specificity:** 0.9987
- **F1 Score:** 0.8087
- **ROC-AUC:** 0.9753
- **PR-AUC:** 0.8772

## Phase E — Data Leakage Audit
- **Dedup before split:** PASS
- **Train/Test exact overlap:** FAIL
- **Scaler fit before split:** FAIL (mild, documented)
- **Label encoder fit before split:** PASS (benign)
- **Random seed reproducibility:** PASS (partial)

## Phase G — Threshold Analysis
- **Best validation threshold (by F1):** 0.45
- **Operational threshold:** 0.5

## Phase H — Calibration
- **Decision:** ADOPT_CALIBRATED_PROBABILITY
- **Brier Score (Calibrated):** 0.0241
- **ECE 10-bin (Calibrated):** 0.0055

## Phase I — Subgroup Performance
Flagged subgroups: [{'group': 'gender', 'level': 'Other', 'n': 4, 'flag': 'insufficient sample/positives for stable metrics'}]

## Phase K — Serialization / Reproducibility
- **Status:** PASS
- **Max absolute score difference:** 0.0

## Phase L — External Dataset
- **External Validation Status:** PENDING
- **Reason:** No independent dataset with compatible semantics is available; the supplied CSVs are byte-identical to the training source.
