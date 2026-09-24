"""
Non-IID partitioning strategies.
"""
import os
import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.model_selection import train_test_split
from src.federated.partitioning.config import PartitionConfig

def partition_label_skew(data: pd.DataFrame, config: PartitionConfig) -> dict[str, pd.DataFrame]:
    """Uses Dirichlet distribution to create label-skewed partitions or custom skewed splits."""
    np.random.seed(config.seed)
    partitions = {}
    
    pos_data = data[data['diabetes'] == 1]
    neg_data = data[data['diabetes'] == 0]
    
    # We partition positive and negative cases to match these ratios approximately
    pos_A = pos_data.iloc[:int(len(pos_data)*0.5)] # 50% of pos cases
    pos_C = pos_data.iloc[int(len(pos_data)*0.5):int(len(pos_data)*0.85)] # 35%
    pos_B = pos_data.iloc[int(len(pos_data)*0.85):] # 15%
    
    neg_A = neg_data.iloc[:int(len(neg_data)*0.2)]
    neg_C = neg_data.iloc[int(len(neg_data)*0.2):int(len(neg_data)*0.5)]
    neg_B = neg_data.iloc[int(len(neg_data)*0.5):]
    
    partitions[config.client_names[0]] = pd.concat([pos_A, neg_A]).sample(frac=1, random_state=config.seed)
    partitions[config.client_names[1]] = pd.concat([pos_B, neg_B]).sample(frac=1, random_state=config.seed)
    partitions[config.client_names[2]] = pd.concat([pos_C, neg_C]).sample(frac=1, random_state=config.seed)
    
    return partitions

def partition_quantity_skew(data: pd.DataFrame, config: PartitionConfig) -> dict[str, pd.DataFrame]:
    """Unequal sizes: Hospital A gets 50%, B gets 30%, C gets 20%."""
    data_shuffled = data.sample(frac=1, random_state=config.seed)
    n = len(data_shuffled)
    
    idx1 = int(n * 0.5)
    idx2 = int(n * 0.8)
    
    partitions = {
        config.client_names[0]: data_shuffled.iloc[:idx1].copy(),
        config.client_names[1]: data_shuffled.iloc[idx1:idx2].copy(),
        config.client_names[2]: data_shuffled.iloc[idx2:].copy()
    }
    return partitions

def partition_feature_skew(data: pd.DataFrame, config: PartitionConfig) -> dict[str, pd.DataFrame]:
    """Different age distributions."""
    median_age = data['age'].median()
    
    older_data = data[data['age'] > median_age]
    younger_data = data[data['age'] <= median_age]
    
    partitions = {}
    
    # Hospital A gets older patients
    partitions[config.client_names[0]] = older_data.sample(frac=0.8, random_state=config.seed)
    rem_older = older_data.drop(partitions[config.client_names[0]].index)
    
    # Hospital B gets younger patients
    partitions[config.client_names[1]] = younger_data.sample(frac=0.8, random_state=config.seed)
    rem_younger = younger_data.drop(partitions[config.client_names[1]].index)
    
    # Hospital C gets mixed (the rest)
    partitions[config.client_names[2]] = pd.concat([rem_older, rem_younger]).sample(frac=1, random_state=config.seed)
    
    return partitions

def partition_non_iid(data: pd.DataFrame, config: PartitionConfig) -> dict[str, pd.DataFrame]:
    """Dispatcher for non-IID partitioning strategies."""
    if config.non_iid_strategy == 'label_skew':
        partitions = partition_label_skew(data, config)
    elif config.non_iid_strategy == 'quantity_skew':
        partitions = partition_quantity_skew(data, config)
    elif config.non_iid_strategy == 'feature_skew':
        partitions = partition_feature_skew(data, config)
    else:
        raise ValueError(f"Unknown non-IID strategy: {config.non_iid_strategy}")
        
    save_dir = Path("data/federated") / f"non_iid_{config.non_iid_strategy}"
    save_dir.mkdir(parents=True, exist_ok=True)
    
    for client_name, client_data in partitions.items():
        client_data.to_csv(save_dir / f"{client_name}.csv", index=False)
        
    return partitions
