"""
Comprehensive evaluation script for the trained TensorFlow model.
"""
import os
import json
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from pathlib import Path
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, average_precision_score, confusion_matrix,
    roc_curve, auc
)
import tensorflow as tf

def main() -> None:
    """Run comprehensive evaluation on test set."""
    base_dir = Path(__file__).resolve().parent.parent.parent
    processed_dir = base_dir / "data" / "processed"
    models_dir = base_dir / "models" / "tensorflow"
    reports_dir = base_dir / "reports"
    screenshots_dir = base_dir / "screenshots"
    
    os.makedirs(reports_dir, exist_ok=True)
    os.makedirs(screenshots_dir, exist_ok=True)
    
    model_path = models_dir / "diabetes_nn.keras"
    test_path = processed_dir / "test.csv"
    
    if not model_path.exists() or not test_path.exists():
        raise FileNotFoundError("Model or test data not found.")
        
    print("Loading model and data...")
    model = tf.keras.models.load_model(str(model_path))
    test_df = pd.read_csv(test_path)
    
    X_test = test_df.drop('diabetes', axis=1).values
    y_test = test_df['diabetes'].values
    
    print("Generating predictions...")
    y_pred_prob = model.predict(X_test).ravel()
    y_pred_default = (y_pred_prob >= 0.5).astype(int)
    
    # Calculate metrics
    cm = confusion_matrix(y_test, y_pred_default)
    tn, fp, fn, tp = cm.ravel()
    sensitivity = tp / (tp + fn) if (tp + fn) > 0 else 0
    specificity = tn / (tn + fp) if (tn + fp) > 0 else 0
    
    results = {
        "metrics": {
            "accuracy": float(accuracy_score(y_test, y_pred_default)),
            "precision": float(precision_score(y_test, y_pred_default, zero_division=0)),
            "recall": float(recall_score(y_test, y_pred_default, zero_division=0)),
            "f1": float(f1_score(y_test, y_pred_default, zero_division=0)),
            "roc_auc": float(roc_auc_score(y_test, y_pred_prob)),
            "pr_auc": float(average_precision_score(y_test, y_pred_prob)),
            "sensitivity": float(sensitivity),
            "specificity": float(specificity)
        },
        "confusion_matrix": {
            "tn": int(tn), "fp": int(fp), "fn": int(fn), "tp": int(tp)
        },
        "threshold_analysis": {},
        "fairness_analysis": {},
        "calibration": {}
    }
    
    # Threshold analysis
    for thresh in [0.3, 0.4, 0.5, 0.6, 0.7]:
        y_p = (y_pred_prob >= thresh).astype(int)
        results["threshold_analysis"][str(thresh)] = {
            "f1": float(f1_score(y_test, y_p, zero_division=0)),
            "precision": float(precision_score(y_test, y_p, zero_division=0)),
            "recall": float(recall_score(y_test, y_p, zero_division=0))
        }
        
    # Fairness analysis by gender (column index 0 is gender in processed data)
    gender_col = X_test[:, 0]
    unique_genders = np.unique(gender_col)
    for g in unique_genders:
        mask = (gender_col == g)
        if np.sum(mask) > 0:
            y_t_g = y_test[mask]
            y_p_g = y_pred_default[mask]
            
            try:
                roc_auc_g = float(roc_auc_score(y_t_g, y_pred_prob[mask])) if len(np.unique(y_t_g)) > 1 else None
            except Exception:
                roc_auc_g = None
                
            results["fairness_analysis"][f"gender_{int(g)}"] = {
                "count": int(np.sum(mask)),
                "accuracy": float(accuracy_score(y_t_g, y_p_g)),
                "f1": float(f1_score(y_t_g, y_p_g, zero_division=0)),
                "roc_auc": roc_auc_g
            }
            
    # Calibration data
    bins = np.linspace(0, 1, 11)
    bin_indices = np.digitize(y_pred_prob, bins) - 1
    for i in range(10):
        mask = (bin_indices == i)
        if np.sum(mask) > 0:
            mean_pred = float(np.mean(y_pred_prob[mask]))
            mean_actual = float(np.mean(y_test[mask]))
            results["calibration"][f"bin_{i}"] = {
                "mean_predicted": mean_pred,
                "mean_actual": mean_actual,
                "count": int(np.sum(mask))
            }
            
    # Save results
    report_path = reports_dir / "tensorflow_evaluation.json"
    with open(report_path, "w") as f:
        json.dump(results, f, indent=4)
    print(f"Evaluation report saved to {report_path}")
    
    # Plot Confusion Matrix
    plt.figure(figsize=(6, 5))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues')
    plt.title('Confusion Matrix')
    plt.ylabel('Actual')
    plt.xlabel('Predicted')
    plt.savefig(screenshots_dir / "tensorflow_confusion_matrix.png")
    plt.close()
    
    # Plot ROC Curve
    fpr, tpr, _ = roc_curve(y_test, y_pred_prob)
    roc_auc = auc(fpr, tpr)
    plt.figure(figsize=(6, 5))
    plt.plot(fpr, tpr, color='darkorange', lw=2, label=f'ROC curve (area = {roc_auc:.2f})')
    plt.plot([0, 1], [0, 1], color='navy', lw=2, linestyle='--')
    plt.xlim([0.0, 1.0])
    plt.ylim([0.0, 1.05])
    plt.xlabel('False Positive Rate')
    plt.ylabel('True Positive Rate')
    plt.title('Receiver Operating Characteristic')
    plt.legend(loc="lower right")
    plt.savefig(screenshots_dir / "tensorflow_roc_curve.png")
    plt.close()
    
    print(f"Plots saved to {screenshots_dir}")

if __name__ == "__main__":
    main()
