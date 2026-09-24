# =====================================================
# HealthFusion_FL
# Module 5.2 - Train Local Hospital Models
# =====================================================

import os
import joblib
import pandas as pd

from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score

# -----------------------------------------------------
# Create model directory
# -----------------------------------------------------

os.makedirs("models/federated", exist_ok=True)

# -----------------------------------------------------
# Hospital files
# -----------------------------------------------------

hospital_files = {
    "Hospital_A": "data/federated/hospital_A.csv",
    "Hospital_B": "data/federated/hospital_B.csv",
    "Hospital_C": "data/federated/hospital_C.csv"
}

# -----------------------------------------------------
# Train a model for each hospital
# -----------------------------------------------------

print("=" * 60)
print("HealthFusion_FL - Local Hospital Training")
print("=" * 60)

results = []

for hospital_name, file_path in hospital_files.items():

    print(f"\nTraining {hospital_name}...")

    df = pd.read_csv(file_path)

    X = df.drop("diabetes", axis=1)
    y = df["diabetes"]

    model = RandomForestClassifier(
        n_estimators=100,
        random_state=42
    )

    model.fit(X, y)

    predictions = model.predict(X)

    accuracy = accuracy_score(y, predictions)

    print(f"Training Accuracy : {accuracy:.4f}")

    model_path = f"models/federated/{hospital_name}.pkl"

    joblib.dump(model, model_path)

    results.append((hospital_name, len(df), accuracy))

# -----------------------------------------------------
# Summary
# -----------------------------------------------------

print("\n")
print("=" * 60)
print("Local Training Summary")
print("=" * 60)

for hospital, records, acc in results:
    print(f"{hospital:12} Records: {records:6}  Accuracy: {acc:.4f}")

print("\nAll local models trained successfully.")