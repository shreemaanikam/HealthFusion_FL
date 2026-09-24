# =====================================================
# HealthFusion_FL
# Module 5.3 - Federated Aggregation (Majority Voting)
# =====================================================

import os
import joblib
import pandas as pd

from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    ConfusionMatrixDisplay
)

import matplotlib.pyplot as plt

# -----------------------------------------------------
# Create folders
# -----------------------------------------------------

os.makedirs("reports", exist_ok=True)
os.makedirs("screenshots", exist_ok=True)

# -----------------------------------------------------
# Load models
# -----------------------------------------------------

model_A = joblib.load("models/federated/Hospital_A.pkl")
model_B = joblib.load("models/federated/Hospital_B.pkl")
model_C = joblib.load("models/federated/Hospital_C.pkl")

# -----------------------------------------------------
# Load test dataset
# -----------------------------------------------------

test = pd.read_csv("data/processed/test.csv")

X_test = test.drop("diabetes", axis=1)
y_test = test["diabetes"]

# -----------------------------------------------------
# Local predictions
# -----------------------------------------------------

pred_A = model_A.predict(X_test)
pred_B = model_B.predict(X_test)
pred_C = model_C.predict(X_test)

# -----------------------------------------------------
# Majority Voting
# -----------------------------------------------------

votes = pred_A + pred_B + pred_C

global_predictions = (votes >= 2).astype(int)

# -----------------------------------------------------
# Metrics
# -----------------------------------------------------

accuracy = accuracy_score(y_test, global_predictions)
precision = precision_score(y_test, global_predictions)
recall = recall_score(y_test, global_predictions)
f1 = f1_score(y_test, global_predictions)

print("=" * 60)
print("HealthFusion_FL - Federated Global Evaluation")
print("=" * 60)

print(f"\nAccuracy : {accuracy:.4f}")
print(f"Precision: {precision:.4f}")
print(f"Recall   : {recall:.4f}")
print(f"F1 Score : {f1:.4f}")

# -----------------------------------------------------
# Save Report
# -----------------------------------------------------

report = pd.DataFrame({
    "Metric": ["Accuracy", "Precision", "Recall", "F1 Score"],
    "Value": [accuracy, precision, recall, f1]
})

report.to_csv(
    "reports/federated_results.csv",
    index=False
)

# -----------------------------------------------------
# Confusion Matrix
# -----------------------------------------------------

disp = ConfusionMatrixDisplay.from_predictions(
    y_test,
    global_predictions
)

disp.figure_.savefig(
    "screenshots/federated_confusion_matrix.png"
)

plt.close(disp.figure_)

print("\nFederated evaluation completed.")
print("Results saved to reports/")
print("Confusion matrix saved to screenshots/")
