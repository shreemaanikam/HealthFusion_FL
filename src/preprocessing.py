# =====================================================
# HealthFusion_FL
# Module 3 - Data Preprocessing
# =====================================================

import os
import pandas as pd

from sklearn.preprocessing import LabelEncoder
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split

# -----------------------------------------------------
# Create output folder
# -----------------------------------------------------

os.makedirs("data/processed", exist_ok=True)

# -----------------------------------------------------
# Load Dataset
# -----------------------------------------------------

dataset_path = "data/raw/diabetes_prediction_dataset.csv"

df = pd.read_csv(dataset_path)

print("=" * 60)
print("HealthFusion_FL - Data Preprocessing")
print("=" * 60)

print("\nOriginal Dataset Shape:")
print(df.shape)

# -----------------------------------------------------
# Remove Duplicate Records
# -----------------------------------------------------

duplicates = df.duplicated().sum()

print(f"\nDuplicate Records Found: {duplicates}")

df = df.drop_duplicates()

print("Dataset Shape After Removing Duplicates:")
print(df.shape)

# -----------------------------------------------------
# Encode Categorical Features
# -----------------------------------------------------

label_encoder = LabelEncoder()

categorical_columns = ["gender", "smoking_history"]

for column in categorical_columns:
    df[column] = label_encoder.fit_transform(df[column])

print("\nCategorical Features Encoded")

# -----------------------------------------------------
# Split Features and Target
# -----------------------------------------------------

X = df.drop("diabetes", axis=1)

y = df["diabetes"]

print("\nFeatures Shape:", X.shape)
print("Target Shape:", y.shape)

# -----------------------------------------------------
# Scale Numerical Features
# -----------------------------------------------------

numerical_columns = [
    "age",
    "bmi",
    "HbA1c_level",
    "blood_glucose_level"
]

scaler = StandardScaler()

X[numerical_columns] = scaler.fit_transform(X[numerical_columns])

print("\nNumerical Features Standardized")

# -----------------------------------------------------
# Train-Test Split
# -----------------------------------------------------

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42,
    stratify=y
)

print("\nTrain-Test Split Completed")

print(f"Training Samples : {len(X_train)}")
print(f"Testing Samples  : {len(X_test)}")

# -----------------------------------------------------
# Save Processed Data
# -----------------------------------------------------

train_df = X_train.copy()
train_df["diabetes"] = y_train.values

test_df = X_test.copy()
test_df["diabetes"] = y_test.values

processed_df = X.copy()
processed_df["diabetes"] = y.values

train_df.to_csv("data/processed/train.csv", index=False)
test_df.to_csv("data/processed/test.csv", index=False)
processed_df.to_csv("data/processed/processed_dataset.csv", index=False)

print("\nProcessed datasets saved successfully.")

print("\nSaved Files:")
print("data/processed/train.csv")
print("data/processed/test.csv")
print("data/processed/processed_dataset.csv")

print("\nModule 3 Completed Successfully.")