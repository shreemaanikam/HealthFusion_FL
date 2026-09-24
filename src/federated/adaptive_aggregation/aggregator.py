"""
Adaptive aggregation implementation.
"""
import numpy as np
from typing import List, Tuple

def adaptive_aggregate(results: List[Tuple[List[np.ndarray], int]], client_weights: List[float]) -> List[np.ndarray]:
    """
    Performs weighted average of model parameters.
    """
    if not results:
        raise ValueError("Empty results provided for aggregation.")
        
    if len(results) != len(client_weights):
        client_weights = [1.0 / len(results)] * len(results)
        
    weight_sum = sum(client_weights)
    if weight_sum > 0:
        client_weights = [w / weight_sum for w in client_weights]
        
    aggregated_parameters = [
        np.zeros_like(param) for param in results[0][0]
    ]
    
    for (client_params, _), weight in zip(results, client_weights):
        for i, param in enumerate(client_params):
            aggregated_parameters[i] += param * weight
            
    return aggregated_parameters
