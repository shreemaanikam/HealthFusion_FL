import json
import os

with open("reports/model_validation/model_validation_summary.json", "r") as f:
    data = json.load(f)

md = f"""# HealthFusion_FL Model Validation Report

## Phase D — Model Validation
**Model:** {data['model']['version']}
**Type:** {data['model']['type']}

### Test Metrics
- **Accuracy:** {data['test_metrics']['accuracy']:.4f}
- **Precision:** {data['test_metrics']['precision']:.4f}
- **Recall:** {data['test_metrics']['recall']:.4f}
- **Specificity:** {data['test_metrics']['specificity']:.4f}
- **F1 Score:** {data['test_metrics']['f1']:.4f}
- **ROC-AUC:** {data['test_metrics']['roc_auc']:.4f}
- **PR-AUC:** {data['test_metrics']['pr_auc']:.4f}

## Phase E — Data Leakage Audit
- **Dedup before split:** {data['leakage']['dedup_before_split']}
- **Train/Test exact overlap:** {data['leakage']['train_test_exact_overlap']}
- **Scaler fit before split:** {data['leakage']['scaler_fit_before_split']}
- **Label encoder fit before split:** {data['leakage']['label_encoder_fit_before_split']}
- **Random seed reproducibility:** {data['leakage']['random_seed']}

## Phase G — Threshold Analysis
- **Best validation threshold (by F1):** {data['threshold']['best_threshold_by_validation_f1']}
- **Operational threshold:** {data['threshold']['operational_threshold']}

## Phase H — Calibration
- **Decision:** {data['calibration']['decision']}
- **Brier Score (Calibrated):** {data['calibration']['test_platt_calibrated']['brier']:.4f}
- **ECE 10-bin (Calibrated):** {data['calibration']['test_platt_calibrated']['ece_10bin']:.4f}

## Phase I — Subgroup Performance
Flagged subgroups: {data.get('subgroups_flagged', [])}

## Phase K — Serialization / Reproducibility
- **Status:** {data['serialization']['status']}
- **Max absolute score difference:** {data['serialization']['max_abs_score_diff']}

## Phase L — External Dataset
- **External Validation Status:** {data['external_validation']['status']}
- **Reason:** {data['external_validation']['reason']}
"""

with open("reports/model_validation/model_validation.md", "w") as f:
    f.write(md)
print("Saved model_validation.md")
