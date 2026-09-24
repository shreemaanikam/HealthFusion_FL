# Dataset Setup

## Diabetes Prediction Dataset

This project uses the **Diabetes Prediction Dataset** from Kaggle.

- **Source**: [Kaggle — Diabetes Prediction Dataset](https://www.kaggle.com/datasets/iammustafatz/diabetes-prediction-dataset)
- **Size**: ~100,000 records, 3.6 MB
- **License**: CC0: Public Domain
- **Format**: CSV with 9 columns

### Features

| Feature | Type | Description |
|---------|------|-------------|
| gender | categorical | Female, Male, Other |
| age | numerical | Patient age (0.08–80) |
| hypertension | binary | 0 = No, 1 = Yes |
| heart_disease | binary | 0 = No, 1 = Yes |
| smoking_history | categorical | never, former, current, ever, not current, No Info |
| bmi | numerical | Body Mass Index (10–96) |
| HbA1c_level | numerical | Hemoglobin A1c (3.5–9.0) |
| blood_glucose_level | numerical | Blood glucose (80–300) |
| **diabetes** | **binary (target)** | **0 = No, 1 = Yes** |

### Download & Setup

```bash
# Option 1: Download from Kaggle (requires kaggle CLI)
kaggle datasets download -d iammustafatz/diabetes-prediction-dataset
unzip diabetes-prediction-dataset.zip -d data/raw/

# Option 2: Manual download
# 1. Visit https://www.kaggle.com/datasets/iammustafatz/diabetes-prediction-dataset
# 2. Click "Download"
# 3. Extract diabetes_prediction_dataset.csv to data/raw/

# Then run preprocessing
python -m src.ml.preprocessing
```

### Sample Data

A small sample (`data/raw/sample_data.csv`) is included in the repository
for testing and development. It contains 100 representative records.

### Why Not Commit the Full Dataset?

1. **Size**: 3.6 MB raw CSV (plus ~16 MB of processed/federated splits)
2. **Licensing clarity**: While CC0, committing data to git makes it harder to track provenance
3. **Reproducibility**: The preprocessing pipeline re-generates all processed data from the raw CSV
4. **Best practice**: Data and code should be versioned separately
