# =====================================================
# HealthFusion_FL
# Module 2 - Dataset Information
# =====================================================

import pandas as pd
import os

print("=" * 60)
print("HealthFusion_FL - Dataset Information")
print("=" * 60)

# Dataset path
dataset_path = os.path.join(
    "data",
    "raw",
    "diabetes_prediction_dataset.csv"
)

# Load dataset
df = pd.read_csv(dataset_path)

# Dataset Shape
print("\n1. Dataset Shape")
print("-" * 40)
print(f"Rows    : {df.shape[0]}")
print(f"Columns : {df.shape[1]}")

# Column Names
print("\n2. Column Names")
print("-" * 40)
print("Prediction Column :", df.columns[-1])
for column in df.columns:
    print(column)

# Data Types
print("\n3. Data Types")
print("-" * 40)
print(df.dtypes)

print("\nFeature Categories")
print("-" * 40)

categorical = df.select_dtypes(include=["object", "string"]).columns.tolist()
numerical = df.select_dtypes(exclude=["object"]).columns.tolist()

print("Categorical Features:")
print(categorical)

print("\nNumerical Features:")
print(numerical)

# Missing Values
print("\n4. Missing Values")
print("-" * 40)
print(df.isnull().sum())

# Duplicate Rows
print("\n5. Duplicate Records")
print("-" * 40)
print(df.duplicated().sum())

# Dataset Memory Usage
print("\n6. Memory Usage")
print("-" * 40)
memory = df.memory_usage(deep=True).sum() / (1024 ** 2)
print(f"{memory:.2f} MB")

# First Five Rows
print("\n7. Sample Data")
print("-" * 40)
print(df.head())

print("\nDataset inspection completed successfully.")