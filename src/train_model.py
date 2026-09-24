# =====================================================
# HealthFusion_FL
# Module 4 - Machine Learning Model Training
# =====================================================

import os
import joblib
import pandas as pd
import matplotlib.pyplot as plt

from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier

from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    ConfusionMatrixDisplay,
)

# -----------------------------------------------------
# Create folders
# -----------------------------------------------------

os.makedirs("models", exist_ok=True)
os.makedirs("reports", exist_ok=True)
os.makedirs("screenshots", exist_ok=True)

# -----------------------------------------------------
# Load datasets
# -----------------------------------------------------

train = pd.read_csv("data/processed/train.csv")
test = pd.read_csv("data/processed/test.csv")

X_train = train.drop("diabetes", axis=1)
y_train = train["diabetes"]

X_test = test.drop("diabetes", axis=1)
y_test = test["diabetes"]

# -----------------------------------------------------
# Models
# -----------------------------------------------------

models = {
    "Logistic Regression": LogisticRegression(max_iter=1000, random_state=42),
    "Decision Tree": DecisionTreeClassifier(random_state=42),
    "Random Forest": RandomForestClassifier(
        n_estimators=100,
        random_state=42
    )
}

results = []

# -----------------------------------------------------
# Train & Evaluate
# -----------------------------------------------------

for name, model in models.items():

    print(f"\nTraining {name}...")

    model.fit(X_train, y_train)

    predictions = model.predict(X_test)

    accuracy = accuracy_score(y_test, predictions)
    precision = precision_score(y_test, predictions)
    recall = recall_score(y_test, predictions)
    f1 = f1_score(y_test, predictions)

    results.append([
        name,
        accuracy,
        precision,
        recall,
        f1
    ])

    filename = name.lower().replace(" ", "_") + ".pkl"

    joblib.dump(model, f"models/{filename}")

    disp = ConfusionMatrixDisplay.from_predictions(
        y_test,
        predictions
    )

    disp.figure_.savefig(
        f"screenshots/{filename}_confusion_matrix.png"
    )

    plt.close(disp.figure_)

# -----------------------------------------------------
# Save Results
# -----------------------------------------------------

results_df = pd.DataFrame(
    results,
    columns=[
        "Model",
        "Accuracy",
        "Precision",
        "Recall",
        "F1 Score"
    ]
)

results_df.to_csv(
    "reports/model_comparison.csv",
    index=False
)

print("\n==============================")
print("Model Comparison")
print("==============================")

print(results_df)

print("\nModels saved inside models/")
print("Comparison saved inside reports/")
print("Confusion matrices saved inside screenshots/")