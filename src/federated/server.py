"""
Flower federated server.
"""
import json
import flwr as fl
from pathlib import Path
from typing import Dict, Optional, Tuple, List

def get_on_fit_config_fn() -> callable:
    """Return a function to configure training on clients."""
    def fit_config(server_round: int) -> Dict[str, fl.common.Scalar]:
        """Return training configuration dict for each round."""
        config = {
            "epochs": 5,
            "batch_size": 64,
            "server_round": server_round
        }
        return config
    return fit_config

def create_strategy(min_clients: int = 3, fraction_fit: float = 1.0, fraction_evaluate: float = 1.0) -> fl.server.strategy.FedAvg:
    """Create a standard FedAvg strategy."""
    return fl.server.strategy.FedAvg(
        fraction_fit=fraction_fit,
        fraction_evaluate=fraction_evaluate,
        min_fit_clients=min_clients,
        min_evaluate_clients=min_clients,
        min_available_clients=min_clients,
        on_fit_config_fn=get_on_fit_config_fn(),
    )

def save_metrics_callback(history: fl.server.history.History) -> None:
    """Save metrics to reports/federated_rounds.json after each round."""
    reports_dir = Path("reports")
    reports_dir.mkdir(parents=True, exist_ok=True)
    metrics_file = reports_dir / "federated_rounds.json"
    
    data = {
        "losses_distributed": history.losses_distributed,
        "metrics_distributed": history.metrics_distributed,
    }
    
    with open(metrics_file, "w") as f:
        json.dump(data, f, indent=4)

def start_server(server_address: str = '0.0.0.0:8080', num_rounds: int = 5, min_clients: int = 3) -> fl.server.history.History:
    """Start a Flower server."""
    strategy = create_strategy(min_clients=min_clients)
    
    history = fl.server.start_server(
        server_address=server_address,
        config=fl.server.ServerConfig(num_rounds=num_rounds),
        strategy=strategy,
    )
    
    save_metrics_callback(history)
    return history
