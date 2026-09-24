"""
Flower federated client.
"""
import flwr as fl
import tensorflow as tf
import numpy as np
import pandas as pd
from typing import Callable, List, Dict, Any, Tuple

class HealthFusionClient(fl.client.NumPyClient):
    """Flower federated learning client."""
    
    def __init__(
        self,
        client_id: str,
        train_data: pd.DataFrame,
        val_data: pd.DataFrame,
        model_fn: Callable[[], tf.keras.Model],
        epochs: int = 5,
        batch_size: int = 64
    ):
        """Initialize the federated client."""
        self.client_id = client_id
        
        # Set TF random seed for reproducibility
        tf.random.set_seed(42)
        np.random.seed(42)
        
        self.model = model_fn()
        
        self.x_train = train_data.drop(columns=['diabetes']).values
        self.y_train = train_data['diabetes'].values
        
        self.x_val = val_data.drop(columns=['diabetes']).values
        self.y_val = val_data['diabetes'].values
        
        self.epochs = epochs
        self.batch_size = batch_size

    def get_parameters(self, config: Dict[str, fl.common.Scalar] = None) -> List[np.ndarray]:
        """Return the current local model parameters."""
        return self.model.get_weights()

    def fit(self, parameters: List[np.ndarray], config: Dict[str, fl.common.Scalar]) -> Tuple[List[np.ndarray], int, Dict[str, fl.common.Scalar]]:
        """Train the provided parameters using the locally held dataset."""
        self.model.set_weights(parameters)
        
        epochs = int(config.get('epochs', self.epochs))
        batch_size = int(config.get('batch_size', self.batch_size))
        
        history = self.model.fit(
            self.x_train, self.y_train,
            epochs=epochs,
            batch_size=batch_size,
            validation_split=0.1,
            verbose=0
        )
        
        results = {
            "loss": float(history.history["loss"][-1]),
            "client_id": self.client_id
        }
        
        return self.model.get_weights(), len(self.x_train), results

    def evaluate(self, parameters: List[np.ndarray], config: Dict[str, fl.common.Scalar]) -> Tuple[float, int, Dict[str, fl.common.Scalar]]:
        """Evaluate the provided parameters using the locally held dataset."""
        self.model.set_weights(parameters)
        loss, accuracy = self.model.evaluate(self.x_val, self.y_val, verbose=0)[:2]
        
        metrics = {"accuracy": float(accuracy), "client_id": self.client_id}
        
        return float(loss), len(self.x_val), metrics

def start_client(client_id: str, server_address: str, train_data: pd.DataFrame, val_data: pd.DataFrame, model_fn: Callable[[], tf.keras.Model]) -> None:
    """Start a Flower client."""
    client = HealthFusionClient(client_id, train_data, val_data, model_fn)
    fl.client.start_numpy_client(server_address=server_address, client=client)
