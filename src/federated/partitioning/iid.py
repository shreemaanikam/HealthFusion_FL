"""
IID partitioning strategy.
"""
import os
import pandas as pd
from pathlib import Path
from sklearn.model_selection import StratifiedKFold
from src.federated.partitioning.config import PartitionConfig

def partition_iid(data: pd.DataFrame, config: PartitionConfig) -> dict[str, pd.DataFrame]:
    """
    Partitions the dataset in an IID fashion using stratified splits.
    
    Args:
        data: The input dataframe to partition.
        config: The partitioning configuration.
        
    Returns:
        A dictionary mapping client names to their respective partitioned dataframes.
    """
    if 'diabetes' not in data.columns:
        raise ValueError("Target column 'diabetes' not found in data.")
        
    skf = StratifiedKFold(n_splits=config.num_clients, shuffle=True, random_state=config.seed)
    
    partitions = {}
    for i, (_, test_idx) in enumerate(skf.split(data, data['diabetes'])):
        client_name = config.client_names[i]
        client_data = data.iloc[test_idx].copy()
        partitions[client_name] = client_data
        
    # Save to disk
    save_dir = Path("data/federated") / config.mode
    save_dir.mkdir(parents=True, exist_ok=True)
    
    for client_name, client_data in partitions.items():
        client_data.to_csv(save_dir / f"{client_name}.csv", index=False)
        
    return partitions
