"""
Training pipeline for the centralized TensorFlow model.
"""
import os
import pandas as pd
import numpy as np
from pathlib import Path
from sklearn.utils.class_weight import compute_class_weight
import tensorflow as tf
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint # type: ignore

from src.ml.tensorflow_model import create_model

def main() -> None:
    """Run the training pipeline."""
    base_dir = Path(__file__).resolve().parent.parent.parent
    processed_dir = base_dir / "data" / "processed"
    models_dir = base_dir / "models" / "tensorflow"
    reports_dir = base_dir / "reports"
    
    os.makedirs(models_dir, exist_ok=True)
    os.makedirs(reports_dir, exist_ok=True)
    
    train_path = processed_dir / "train.csv"
    test_path = processed_dir / "test.csv"
    
    if not train_path.exists() or not test_path.exists():
        raise FileNotFoundError("Processed data not found. Run preprocessing first.")
        
    print("Loading data...")
    train_df = pd.read_csv(train_path)
    test_df = pd.read_csv(test_path)
    
    X_train = train_df.drop('diabetes', axis=1).values
    y_train = train_df['diabetes'].values
    X_test = test_df.drop('diabetes', axis=1).values
    y_test = test_df['diabetes'].values
    
    print("Computing class weights...")
    classes = np.unique(y_train)
    weights = compute_class_weight('balanced', classes=classes, y=y_train)
    class_weight_dict = dict(zip(classes, weights))
    
    print("Creating model...")
    model = create_model(input_dim=X_train.shape[1], learning_rate=0.001)
    
    model_path = models_dir / "diabetes_nn.keras"
    
    callbacks = [
        EarlyStopping(monitor='val_auc', patience=10, mode='max', restore_best_weights=True),
        ModelCheckpoint(filepath=str(model_path), monitor='val_auc', mode='max', save_best_only=True)
    ]
    
    print("Training model...")
    history = model.fit(
        X_train, y_train,
        batch_size=64,
        epochs=100,
        validation_split=0.15,
        class_weight=class_weight_dict,
        callbacks=callbacks,
        verbose=1
    )
    
    print(f"Model saved to {model_path}")
    
    # Save history
    hist_df = pd.DataFrame(history.history)
    hist_path = reports_dir / "tensorflow_training_history.csv"
    hist_df.to_csv(hist_path, index=False)
    print(f"Training history saved to {hist_path}")
    
    # Evaluate on test set
    print("Evaluating on test set...")
    best_model = tf.keras.models.load_model(str(model_path))
    results = best_model.evaluate(X_test, y_test, verbose=0)
    
    metrics_names = best_model.metrics_names
    for name, val in zip(metrics_names, results):
        print(f"Test {name}: {val:.4f}")

if __name__ == "__main__":
    main()
