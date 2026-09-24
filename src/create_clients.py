# =====================================================
# HealthFusion_FL
# Module 5.1 - Create Federated Clients
# =====================================================

import os
import pandas as pd
from sklearn.model_selection import train_test_split

# -----------------------------------------------------
# Create output folder
# -----------------------------------------------------

os.makedirs("data/federated", exist_ok=True)

# -----------------------------------------------------
# Load processed training dataset
# -----------------------------------------------------

train_df = pd.read_csv("data/processed/train.csv")

print("=" * 60)
print("HealthFusion_FL - Federated Client Creation")
print("=" * 60)

print(f"\nTraining Records : {len(train_df)}")

# -----------------------------------------------------
# Split into three hospitals
# -----------------------------------------------------

hospital_A, remaining = train_test_split(
    train_df,
    test_size=2/3,
    random_state=42,
    stratify=train_df["diabetes"]
)

hospital_B, hospital_C = train_test_split(
    remaining,
    test_size=0.5,
    random_state=42,
    stratify=remaining["diabetes"]
)

# -----------------------------------------------------
# Save datasets
# -----------------------------------------------------

hospital_A.to_csv(
    "data/federated/hospital_A.csv",
    index=False
)

hospital_B.to_csv(
    "data/federated/hospital_B.csv",
    index=False
)

hospital_C.to_csv(
    "data/federated/hospital_C.csv",
    index=False
)

# -----------------------------------------------------
# Summary
# -----------------------------------------------------

print("\nHospital Summary")
print("-" * 40)

for name, data in [
    ("Hospital A", hospital_A),
    ("Hospital B", hospital_B),
    ("Hospital C", hospital_C),
]:
    diabetic = data["diabetes"].sum()
    total = len(data)

    print(
        f"{name:<12} "
        f"Records: {total:<6} "
        f"Diabetic: {diabetic}"
    )

print("\nFederated datasets created successfully.")