"""
Custom aggregation strategies.
"""
import flwr as fl
from typing import Callable, Dict, List, Optional, Tuple, Union
from flwr.common import FitRes, Parameters, Scalar, ndarrays_to_parameters, parameters_to_ndarrays
from flwr.server.client_proxy import ClientProxy

from src.federated.adaptive_aggregation.weights import compute_client_weights
from src.federated.adaptive_aggregation.aggregator import adaptive_aggregate
from src.federated.adaptive_aggregation.metrics import AggregationMetrics

class AdaptiveFedAvg(fl.server.strategy.FedAvg):
    """Custom strategy applying adaptive weighting."""
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.metrics_tracker = AggregationMetrics()
        self.history = []

    def aggregate_fit(
        self,
        server_round: int,
        results: List[Tuple[ClientProxy, FitRes]],
        failures: List[Union[Tuple[ClientProxy, FitRes], BaseException]],
    ) -> Tuple[Optional[Parameters], Dict[str, Scalar]]:
        """Aggregate fit results using adaptive weighting."""
        if not results:
            return None, {}
            
        # Extract parameters and metrics
        client_metrics = []
        parsed_results = []
        for client, fit_res in results:
            metrics = fit_res.metrics.copy() if fit_res.metrics else {}
            metrics['num_examples'] = fit_res.num_examples
            metrics['client_id'] = client.cid
            client_metrics.append(metrics)
            
            # Convert parameters to ndarray
            ndarrays = parameters_to_ndarrays(fit_res.parameters)
            parsed_results.append((ndarrays, fit_res.num_examples))
            
        # Compute adaptive weights
        weights = compute_client_weights(client_metrics, self.history)
        
        # Track metrics
        self.metrics_tracker.track(
            round_number=server_round,
            client_weights=weights,
            client_metrics=client_metrics,
            aggregation_type='adaptive'
        )
        self.history.append({'round': server_round, 'client_metrics': client_metrics, 'weights': weights})
        
        # Aggregate parameters
        aggregated_ndarrays = adaptive_aggregate(parsed_results, weights)
        aggregated_parameters = ndarrays_to_parameters(aggregated_ndarrays)
        
        # Save metrics
        self.metrics_tracker.save("reports/adaptive_aggregation_metrics.json")
        
        return aggregated_parameters, {}
