# Model Card: HealthFusion_FL Diabetes Prediction Model

## Model Details
- **Model Version:** HF-NN-v1.0
- **Architecture:** Feed-forward Neural Network (TensorFlow/Keras)
- **Model Purpose:** To predict the risk of diabetes based on patient demographic and clinical data, aiding clinical decision support.
- **Target:** Binary classification (1 = High Risk of Diabetes, 0 = Low Risk).

> **Disclaimer:** This system provides model-predicted risk and is not a medical diagnosis. It must not replace professional clinical judgment.

## Features
The model expects 8 features:
1. Gender (Categorical)
2. Age (Numeric)
3. Hypertension (Binary)
4. Heart Disease (Binary)
5. Smoking History (Categorical)
6. BMI (Numeric)
7. HbA1c Level (Numeric)
8. Blood Glucose Level (Numeric)

## Dataset
- **Training Dataset:** `ml_testing_data/diabetes_prediction_dataset.csv` (100k rows)
- **Source:** Electronic health records (simulated/anonymized dataset).

## Preprocessing
- Categorical features (Gender, Smoking History) are encoded using Label Encoding.
- Numerical features are scaled using StandardScaler.
- Preprocessing artifacts are frozen and used exactly identically during training and inference.

## Training
- **Training Mode:** Centralized (Simulation of Federated Learning exists, but the artifact used in LIVE is centralized).
- **Optimization:** Adam optimizer with Binary Crossentropy loss.

## Evaluation Results
### Internal Test Results
- **Accuracy:** 0.9713
- **Precision:** 0.9807
- **Recall:** 0.6881
- **Specificity:** 0.9987
- **F1 Score:** 0.8087
- **ROC-AUC:** 0.9753
- **PR-AUC:** 0.8772

### Cross-Validation
- Stratified K-Fold validation evaluated baselines (Logistic Regression, Decision Trees) and neural network. 
- Neural Network maintained stable performance across folds.

### Threshold Analysis
- Evaluated threshold ranges (0.1 to 0.9). 
- **Operational Threshold:** 0.5 (Highest F1 balance, though threshold 0.45 offered marginal improvements).

### Calibration
- **Calibration Decision:** ADOPT_CALIBRATED_PROBABILITY
- **Platt Scaling:** Applied to the raw model output.
- **Brier Score (Calibrated):** 0.0241
- **ECE 10-bin (Calibrated):** 0.0055

### Subgroup Performance
- Analyzed across gender and age bands. 
- Flagged: 'Other' gender category due to insufficient sample size for stable metrics (n=4). 

### External Validation
- **Status:** PENDING
- **Reason:** The provided secondary dataset is byte-identical to the training source. True external validation awaits an independent data source.

## Limitations & Intended Use
- **Intended Use:** As a supplementary clinical decision support tool for healthcare providers to triage and manage patients at risk of diabetes.
- **Non-intended Use:** Not to be used as a standalone diagnostic tool. Not to be used on populations heavily divergent from the training dataset demographics.
