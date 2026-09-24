"""
FL simulation runner.
"""
import os
import json
import pandas as pd
import tensorflow as tf
from pathlib import Path
import flwr as fl

from src.federated.partitioning.config import PartitionConfig
from src.federated.partitioning.iid import partition_iid
from src.federated.partitioning.non_iid import partition_non_iid
from src.federated.client import HealthFusionClient
from src.federated.server import create_strategy
from src.federated.strategy import AdaptiveFedAvg

def create_model(input_dim=8):
    """Create ML model."""
    try:
        from src.ml.tensorflow_model import create_model as ml_create_model
        return ml_create_model(input_dim)
    except ImportError:
        model = tf.keras.Sequential([
            tf.keras.layers.Dense(64, activation='relu', input_shape=(input_dim,)),
            tf.keras.layers.Dropout(0.2),
            tf.keras.layers.Dense(32, activation='relu'),
            tf.keras.layers.Dense(1, activation='sigmoid')
        ])
        model.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy'])
        return model

def run_simulation(num_clients: int = 3, num_rounds: int = 5, mode: str = 'iid', strategy_type: str = 'fedavg') -> dict:
    """Run FL simulation."""
    train_data = pd.read_csv("data/processed/train.csv")
    test_data = pd.read_csv("data/processed/test.csv")
    
    config = PartitionConfig(num_clients=num_clients, mode=mode)
    if mode == 'iid':
        partitions = partition_iid(train_data, config)
    else:
        partitions = partition_non_iid(train_data, config)
        
    client_names = list(partitions.keys())
    
    def client_fn(cid: str) -> fl.client.Client:
        idx = int(cid) % num_clients
        client_name = client_names[idx]
        return HealthFusionClient(
            client_id=client_name,
            train_data=partitions[client_name],
            val_data=test_data,
            model_fn=create_model
        )
        
    if strategy_type == 'fedavg':
        strategy = create_strategy(min_clients=num_clients)
    elif strategy_type == 'adaptive':
        from src.federated.server import get_on_fit_config_fn
        strategy = AdaptiveFedAvg(
            fraction_fit=1.0,
            fraction_evaluate=1.0,
            min_fit_clients=num_clients,
            min_evaluate_clients=num_clients,
            min_available_clients=num_clients,
            on_fit_config_fn=get_on_fit_config_fn(),
        )
    else:
        raise ValueError(f"Unknown strategy type: {strategy_type}")
        
    history = fl.simulation.start_simulation(
        client_fn=client_fn,
        num_clients=num_clients,
        config=fl.server.ServerConfig(num_rounds=num_rounds),
        strategy=strategy,
        client_resources={"num_cpus": 1, "num_gpus": 0},
    )
    
    return {
        "losses_distributed": history.losses_distributed,
        "metrics_distributed": history.metrics_distributed,
    }

def run_fl_experiment(modes: list = ['iid', 'non_iid'], strategies: list = ['fedavg', 'adaptive']):
    """Run comparative experiments."""
    results = {}
    
    for mode in modes:
        for strategy in strategies:
            print(f"Running simulation for mode: {mode}, strategy: {strategy}")
            exp_name = f"{mode}_{strategy}"
            history_dict = run_simulation(num_clients=3, num_rounds=5, mode=mode, strategy_type=strategy)
            results[exp_name] = history_dict
            
    reports_dir = Path("reports")
    reports_dir.mkdir(parents=True, exist_ok=True)
    with open(reports_dir / "fl_experiment_results.json", "w") as f:
        json.dump(results, f, indent=4)
        
if __name__ == '__main__':
    run_fl_experiment()
