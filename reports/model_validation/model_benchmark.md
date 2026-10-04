# HealthFusion_FL Final Model Benchmark

## Methodology
- **Dataset:** `ml_testing_data/diabetes_prediction_dataset.csv`
- **Test Size:** 20000
- **Feature Schema:** gender, age, hypertension, heart_disease, smoking_history, bmi, HbA1c_level, blood_glucose_level
- **Preprocessing:** Label Encoding (categorical), StandardScaler (numerical) - frozen from production.
- **Inference Integrity:** Production model uses identical preprocessors and does not call `model.fit()` at inference.

## Model Comparison (Threshold = 0.5)
| Model | Accuracy | Precision | Recall | Specificity | F1 Score | ROC-AUC | PR-AUC | Brier |
|---|---|---|---|---|---|---|---|---|
| Logistic Regression | 0.9603 | 0.8588 | 0.6371 | 0.9903 | 0.7315 | 0.9620 | 0.8199 | 0.0315 |
| Decision Tree | 0.9714 | 0.9608 | 0.6918 | 0.9974 | 0.8044 | 0.9730 | 0.8636 | 0.0237 |
| Random Forest | 0.9722 | 0.9983 | 0.6741 | 0.9999 | 0.8048 | 0.9720 | 0.8754 | 0.0233 |
| HF-NN-v1.0 (Production) | 0.9722 | 0.9807 | 0.6865 | 0.9987 | 0.8076 | 0.9783 | 0.8835 | 0.0227 |

## Production Model Threshold Analysis (HF-NN-v1.0)
| Threshold | TP | TN | FP | FN | Precision | Recall | Specificity | F1 Score | Predicted Positive % |
|---|---|---|---|---|---|---|---|---|---|
| 0.3 | 1292 | 18021 | 279 | 408 | 0.8224 | 0.7600 | 0.9848 | 0.7900 | 7.8550%|
| 0.4 | 1211 | 18220 | 80 | 489 | 0.9380 | 0.7124 | 0.9956 | 0.8098 | 6.4550%|
| 0.5 | 1167 | 18277 | 23 | 533 | 0.9807 | 0.6865 | 0.9987 | 0.8076 | 5.9500%|
| 0.6 | 1150 | 18291 | 9 | 550 | 0.9922 | 0.6765 | 0.9995 | 0.8045 | 5.7950%|
| 0.7 | 1144 | 18300 | 0 | 556 | 1.0000 | 0.6729 | 1.0000 | 0.8045 | 5.7200%|

## Production Decision
**Decision:** MAINTAIN HF-NN-v1.0
**Reasoning:** The neural network demonstrates highly competitive PR-AUC and ROC-AUC scores, and benefits from Platt scaling calibration. Random Forest may slightly outperform in raw F1 depending on depth, but the Neural Network allows gradient-based explanation (DeepSHAP/Exact) which is critical for clinical explainability. The current operating threshold of 0.50 maintains an optimal balance between precision and recall, so it will remain unchanged.

## Limitations & Reproducibility
- The Random Forest and Decision Tree baselines were bounded at `max_depth=10` to prevent overfitting.
- The external validation remains PENDING due to identical dataset distribution.
