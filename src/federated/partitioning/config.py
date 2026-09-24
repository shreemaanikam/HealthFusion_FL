"""
Configuration for data partitioning.
"""
from dataclasses import dataclass, field
from typing import List

@dataclass
class PartitionConfig:
    """Configuration settings for partitioning data across clients."""
    num_clients: int = 3
    mode: str = 'iid'  # 'iid' or 'non_iid'
    non_iid_strategy: str = 'label_skew'  # 'label_skew', 'quantity_skew', 'feature_skew'
    alpha: float = 0.5  # Dirichlet concentration parameter
    seed: int = 42
    client_names: List[str] = field(default_factory=lambda: ['Hospital_A', 'Hospital_B', 'Hospital_C'])
