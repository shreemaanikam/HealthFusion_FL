"""
TensorFlow/Keras model definitions for HealthFusion_FL.
"""
import tensorflow as tf
from tensorflow.keras.layers import Input, Dense, BatchNormalization, Dropout # type: ignore
from tensorflow.keras.models import Model # type: ignore
import random
import numpy as np

def set_seed(seed: int = 42) -> None:
    """Set random seeds for reproducibility."""
    random.seed(seed)
    np.random.seed(seed)
    tf.random.set_seed(seed)

def create_model(input_dim: int = 8, learning_rate: float = 0.001) -> tf.keras.Model:
    """
    Creates and compiles the standard neural network model.
    
    Args:
        input_dim (int): Number of input features.
        learning_rate (float): Learning rate for Adam optimizer.
        
    Returns:
        tf.keras.Model: Compiled Keras model.
    """
    set_seed(42)
    
    inputs = Input(shape=(input_dim,))
    
    x = Dense(64, activation='relu', kernel_initializer='he_normal')(inputs)
    x = BatchNormalization()(x)
    x = Dropout(0.3)(x)
    
    x = Dense(32, activation='relu', kernel_initializer='he_normal')(x)
    x = BatchNormalization()(x)
    x = Dropout(0.2)(x)
    
    x = Dense(16, activation='relu', kernel_initializer='he_normal')(x)
    
    outputs = Dense(1, activation='sigmoid')(x)
    
    model = Model(inputs=inputs, outputs=outputs)
    
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=learning_rate),
        loss='binary_crossentropy',
        metrics=[
            'accuracy',
            tf.keras.metrics.AUC(name='auc'),
            tf.keras.metrics.Precision(name='precision'),
            tf.keras.metrics.Recall(name='recall')
        ]
    )
    
    return model

def get_model_summary(model: tf.keras.Model) -> str:
    """
    Returns the string representation of the model summary.
    
    Args:
        model (tf.keras.Model): The Keras model.
        
    Returns:
        str: Multiline string model summary.
    """
    stringlist = []
    model.summary(print_fn=lambda x: stringlist.append(x))
    return "\n".join(stringlist)
