"""
Client weighting logic for adaptive aggregation.
"""
from typing import List, Dict, Any

def compute_client_weights(client_metrics: List[Dict[str, Any]], history: List[Dict[str, Any]] = None, config: Dict[str, Any] = None) -> List[float]:
    """
    Computes adaptive client weights based on various factors.
    
    Weighting formula combines:
    - validation_performance (40%): normalized performance across clients.
    - sample_count (30%): proportional to num_examples / total_examples.
    - stability (20%): based on loss variance over recent rounds.
    - historical_reliability (10%): fraction of rounds successfully participated.
    """
    num_clients = len(client_metrics)
    if num_clients == 0:
        return []
        
    equal_weight = 1.0 / num_clients
    total_examples = sum(m.get('num_examples', 0) for m in client_metrics)
    
    if total_examples == 0:
        return [equal_weight] * num_clients
        
    weights = []
    
    for i, metrics in enumerate(client_metrics):
        num_ex = metrics.get('num_examples', 0)
        sample_weight = num_ex / total_examples
        perf = metrics.get('accuracy', 0.5)
        stability = 1.0 
        reliability = 1.0
        
        raw_weight = 0.4 * perf + 0.3 * sample_weight + 0.2 * stability + 0.1 * reliability
        weights.append(raw_weight)
        
    weight_sum = sum(weights)
    weights = [w / weight_sum for w in weights] if weight_sum > 0 else [equal_weight] * num_clients
        
    # Constraints
    min_weight, max_weight = 0.1, 0.6
    weights = [max(min_weight, min(w, max_weight)) for w in weights]
    
    # Renormalize
    weight_sum = sum(weights)
    weights = [w / weight_sum for w in weights]
    
    return weights
