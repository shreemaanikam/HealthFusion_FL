# =====================================================
# HealthFusion_FL
# Module 2 - Dataset Analysis & Visualization
# =====================================================

import os
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

# -----------------------------------------------------
# Create output folders if they don't exist
# -----------------------------------------------------

os.makedirs("screenshots", exist_ok=True)
os.makedirs("docs", exist_ok=True)

# -----------------------------------------------------
# Load Dataset
# -----------------------------------------------------

dataset_path = "data/raw/diabetes_prediction_dataset.csv"

df = pd.read_csv(dataset_path)

print("=" * 60)
print("HealthFusion_FL - Dataset Analysis")
print("=" * 60)

# -----------------------------------------------------
# Basic Statistics
# -----------------------------------------------------

print("\nDataset Shape")
print(df.shape)

print("\nStatistical Summary")
print(df.describe())

# -----------------------------------------------------
# Diabetes Distribution
# -----------------------------------------------------

plt.figure(figsize=(6,5))

sns.countplot(data=df, x="diabetes")

plt.title("Diabetes Distribution")

plt.savefig("screenshots/01_diabetes_distribution.png")

plt.close()

# -----------------------------------------------------
# Gender Distribution
# -----------------------------------------------------

plt.figure(figsize=(6,5))

sns.countplot(data=df, x="gender")

plt.title("Gender Distribution")

plt.savefig("screenshots/02_gender_distribution.png")

plt.close()

# -----------------------------------------------------
# Smoking History
# -----------------------------------------------------

plt.figure(figsize=(8,5))

sns.countplot(data=df, x="smoking_history")

plt.xticks(rotation=20)

plt.title("Smoking History Distribution")

plt.savefig("screenshots/03_smoking_history.png")

plt.close()

# -----------------------------------------------------
# Age Distribution
# -----------------------------------------------------

plt.figure(figsize=(8,5))

plt.hist(df["age"], bins=30)

plt.title("Age Distribution")

plt.xlabel("Age")

plt.ylabel("Count")

plt.savefig("screenshots/04_age_distribution.png")

plt.close()

# -----------------------------------------------------
# BMI Distribution
# -----------------------------------------------------

plt.figure(figsize=(8,5))

plt.hist(df["bmi"], bins=30)

plt.title("BMI Distribution")

plt.xlabel("BMI")

plt.ylabel("Count")

plt.savefig("screenshots/05_bmi_distribution.png")

plt.close()

# -----------------------------------------------------
# Blood Glucose Distribution
# -----------------------------------------------------

plt.figure(figsize=(8,5))

plt.hist(df["blood_glucose_level"], bins=30)

plt.title("Blood Glucose Level Distribution")

plt.xlabel("Blood Glucose")

plt.ylabel("Count")

plt.savefig("screenshots/06_glucose_distribution.png")

plt.close()

# -----------------------------------------------------
# HbA1c Distribution
# -----------------------------------------------------

plt.figure(figsize=(8,5))

plt.hist(df["HbA1c_level"], bins=30)

plt.title("HbA1c Level Distribution")

plt.xlabel("HbA1c")

plt.ylabel("Count")

plt.savefig("screenshots/07_hba1c_distribution.png")

plt.close()

# -----------------------------------------------------
# Correlation Heatmap
# -----------------------------------------------------

plt.figure(figsize=(8,6))

corr = df.select_dtypes(include=["number"]).corr()

sns.heatmap(corr, annot=True, cmap="Blues")

plt.title("Correlation Heatmap")

plt.savefig("screenshots/08_correlation_heatmap.png")

plt.close()

# -----------------------------------------------------
# Save Summary Report
# -----------------------------------------------------

with open("docs/Dataset_Report.md", "w") as f:

    f.write("# HealthFusion_FL Dataset Report\n\n")

    f.write(f"Rows : {df.shape[0]}\n")

    f.write(f"Columns : {df.shape[1]}\n\n")

    f.write("## Features\n")

    for col in df.columns:
        f.write(f"- {col}\n")

print("\nAnalysis Completed Successfully")

print("\nGraphs saved inside screenshots/")

print("Dataset report saved inside docs/")