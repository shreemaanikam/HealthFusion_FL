"""
Data preprocessing module for HealthFusion_FL.
Handles loading raw data, encoding, scaling, and train/test splitting.
"""
import os
import pandas as pd
import numpy as np
import joblib
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from typing import Tuple, Dict, Any, List

def get_paths() -> Tuple[Path, Path, Path]:
    """Get standard project paths."""
    base_dir = Path(__file__).resolve().parent.parent.parent
    raw_data_path = base_dir / "data" / "raw" / "diabetes_prediction_dataset.csv"
    processed_dir = base_dir / "data" / "processed"
    models_dir = base_dir / "models" / "preprocessors"
    return raw_data_path, processed_dir, models_dir

def preprocess_training_data() -> None:
    """
    Loads raw data, preprocesses it, splits it, and saves processed datasets 
    along with the fitted preprocessors.
    """
    raw_path, processed_dir, models_dir = get_paths()
    
    # Create directories if they don't exist
    os.makedirs(processed_dir, exist_ok=True)
    os.makedirs(models_dir, exist_ok=True)
    
    # Load data
    if not raw_path.exists():
        raise FileNotFoundError(f"Raw data file not found at {raw_path}")
        
    df = pd.read_csv(raw_path)
    
    # Remove duplicates
    df = df.drop_duplicates()
    
    # Separate LabelEncoders to avoid bugs
    le_gender = LabelEncoder()
    le_smoking = LabelEncoder()
    
    df['gender'] = le_gender.fit_transform(df['gender'])
    df['smoking_history'] = le_smoking.fit_transform(df['smoking_history'])
    
    # Features to scale
    numerical_features = ['age', 'bmi', 'HbA1c_level', 'blood_glucose_level']
    scaler = StandardScaler()
    df[numerical_features] = scaler.fit_transform(df[numerical_features])
    
    # Feature ordering
    features = ['gender', 'age', 'hypertension', 'heart_disease', 
                'smoking_history', 'bmi', 'HbA1c_level', 'blood_glucose_level']
    target = 'diabetes'
    
    X = df[features]
    y = df[target]
    
    # Stratified Train/test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    # Save processed data
    train_df = pd.concat([X_train, y_train], axis=1)
    test_df = pd.concat([X_test, y_test], axis=1)
    
    train_df.to_csv(processed_dir / "train.csv", index=False)
    test_df.to_csv(processed_dir / "test.csv", index=False)
    
    # Save preprocessors
    joblib.dump(le_gender, models_dir / "label_encoder_gender.joblib")
    joblib.dump(le_smoking, models_dir / "label_encoder_smoking.joblib")
    joblib.dump(scaler, models_dir / "scaler.joblib")
    print(f"Preprocessing complete. Data saved to {processed_dir}, preprocessors saved to {models_dir}.")

def load_preprocessors() -> Dict[str, Any]:
    """
    Loads saved preprocessors from disk.
    
    Returns:
        Dict[str, Any]: Dictionary containing 'le_gender', 'le_smoking', and 'scaler'.
    """
    _, _, models_dir = get_paths()
    
    le_gender_path = models_dir / "label_encoder_gender.joblib"
    le_smoking_path = models_dir / "label_encoder_smoking.joblib"
    scaler_path = models_dir / "scaler.joblib"
    
    if not all(p.exists() for p in [le_gender_path, le_smoking_path, scaler_path]):
        raise FileNotFoundError(f"One or more preprocessor files missing in {models_dir}")
        
    return {
        'le_gender': joblib.load(le_gender_path),
        'le_smoking': joblib.load(le_smoking_path),
        'scaler': joblib.load(scaler_path)
    }

def preprocess_input(data_dict: Dict[str, Any], preprocessors: Dict[str, Any]) -> np.ndarray:
    """
    Preprocess a single input sample for inference.
    
    Args:
        data_dict (Dict[str, Any]): Dictionary with raw feature values.
        preprocessors (Dict[str, Any]): Dictionary of loaded preprocessors.
        
    Returns:
        np.ndarray: Array shape (1, 8) ready for model input.
    """
    # Create DataFrame to ensure correct order
    features = ['gender', 'age', 'hypertension', 'heart_disease', 
                'smoking_history', 'bmi', 'HbA1c_level', 'blood_glucose_level']
                
    df = pd.DataFrame([data_dict])[features]
    
    # Encode categorical features
    try:
        df['gender'] = preprocessors['le_gender'].transform(df['gender'])
    except ValueError:
        df['gender'] = 0 # Default if unseen
        
    try:
        df['smoking_history'] = preprocessors['le_smoking'].transform(df['smoking_history'])
    except ValueError:
        df['smoking_history'] = 0 # Default if unseen
        
    # Scale numerical features
    numerical_features = ['age', 'bmi', 'HbA1c_level', 'blood_glucose_level']
    df[numerical_features] = preprocessors['scaler'].transform(df[numerical_features])
    
    return df.values

if __name__ == "__main__":
    preprocess_training_data()
