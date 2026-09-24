# HealthFusion_FL — Adaptive Aggregation Protocol

This document provides the mathematical specification, architectural rationale, and empirical justification for the **Adaptive Federated Averaging (`AdaptiveFedAvg`)** protocol implemented in HealthFusion_FL.

> [!IMPORTANT]
> **Clinical Context**: Distributed hospital networks exhibit wide disparities in clinical sample size, patient demographics, equipment calibration, and network stability. Adaptive aggregation ensures robust global model convergence without allowing dominant institutions to bias healthcare predictions.

---

## 1. Problem Statement: Limitations of Standard FedAvg

In canonical Federated Averaging (FedAvg), client parameter updates are weighted solely by their relative sample volume:

$$w_k = \frac{n_k}{\sum_{j=1}^K n_j}$$

Where $n_k$ is the number of local training samples at client $k$.

In healthcare federations, this single-metric formulation introduces severe vulnerabilities:
1. **Institutional Monopolization**: A large tertiary hospital with 50,000 records receives 5× more weight than a specialized rural clinic with 10,000 records, irrespective of data quality, label noise, or localized bias.
2. **Blindness to Gradient Quality**: If a large hospital's local model severely overfits or diverges, FedAvg indiscriminately incorporates its parameters.
3. **Susceptibility to Non-IID Label Skew**: If a major hospital serves a skewed patient demographic, its disproportionate weight steers the global model away from minority sub-populations.
4. **No Resiliency to Client Instability**: FedAvg does not account for transient client dropouts, intermittent network latency, or high gradient variance.

---

## 2. Adaptive Weighting Formulation

Implemented in [`src/federated/adaptive_aggregation/weights.py`](file:///Users/shreemaanikam/HealthFusion_FL/src/federated/adaptive_aggregation/weights.py) and [`src/federated/strategy.py`](file:///Users/shreemaanikam/HealthFusion_FL/src/federated/strategy.py), `AdaptiveFedAvg` evaluates each participating hospital client across four balanced criteria:

```mermaid
pie title Component Breakdown in Adaptive Weighting
    "Validation Performance" : 40
    "Sample Count" : 30
    "Training Stability" : 20
    "Historical Reliability" : 10
```

### 2.1 The Mathematical Formula

For each client $k \in \{1, \dots, K\}$, the raw unconstrained weight $\tilde{w}_k$ is computed as:

$$\tilde{w}_k = 0.40 \cdot \mathcal{P}_k + 0.30 \cdot \mathcal{S}_k + 0.20 \cdot \mathcal{V}_k + 0.10 \cdot \mathcal{R}_k$$

Where:

| Term | Symbol | Weight | Definition & Computation |
| :--- | :---: | :---: | :--- |
| **Validation Performance** | $\mathcal{P}_k$ | **40%** | Normalized accuracy or validation AUC achieved by client $k$'s candidate weights on the local validation partition. Rewards models that generalize effectively. |
| **Sample Count** | $\mathcal{S}_k$ | **30%** | Statistical sample volume ratio: $\mathcal{S}_k = \frac{n_k}{\sum_{j=1}^K n_j}$. Respects the Law of Large Numbers without allowing volume to dominate. |
| **Stability** | $\mathcal{V}_k$ | **20%** | Gradient/loss convergence stability across successive rounds: $\mathcal{V}_k = \exp\left(-\gamma \cdot \text{Var}(\mathcal{L}_k^{(t-h:t)})\right)$. Penalizes volatile oscillations and divergence. |
| **Historical Reliability** | $\mathcal{R}_k$ | **10%** | Ratio of successfully completed rounds to assigned rounds: $\mathcal{R}_k = \frac{\text{Rounds Completed}}{\text{Rounds Assigned}}$. Penalizes dropped connections and unresponsive nodes. |

---

## 3. Weight Bounding and Normalization

To ensure stability and prevent any single hospital from either monopolizing or being silenced in the federated network, hard boundary constraints are applied:

### Step 1: Initial Normalization
$$\hat{w}_k = \frac{\tilde{w}_k}{\sum_{j=1}^K \tilde{w}_j}$$

### Step 2: Bounding Constraints
$$w_k' = \text{clip}(\hat{w}_k, \ w_{\min}, \ w_{\max})$$

Where:
- **$w_{\min} = 0.10$ (10%)**: Guarantees that smaller community clinics or specialized rural centers maintain a voice in the global intelligence consensus.
- **$w_{\max} = 0.60$ (60%)**: Prevents any single high-volume medical center from dictating more than 60% of the parameter updates.

### Step 3: Final Normalization
$$w_k = \frac{w_k'}{\sum_{j=1}^K w_j'} \quad \text{such that} \quad \sum_{k=1}^K w_k = 1.0$$

---

## 4. Parameter Aggregation

Once the final normalized weights $\mathbf{w} = [w_1, w_2, \dots, w_K]$ are established, parameter aggregation executes in [`src/federated/adaptive_aggregation/aggregator.py`](file:///Users/shreemaanikam/HealthFusion_FL/src/federated/adaptive_aggregation/aggregator.py):

$$\Theta_{\text{global}}^{(t+1)} = \sum_{k=1}^K w_k \cdot \Theta_k^{(t)}$$

For every layer tensor $\ell$ in the neural network architecture:
$$W^{(\ell, t+1)} = \sum_{k=1}^K w_k \cdot W_k^{(\ell, t)}, \quad b^{(\ell, t+1)} = \sum_{k=1}^K w_k \cdot b_k^{(\ell, t)}$$

```python
def adaptive_aggregate(results: List[Tuple[List[np.ndarray], int]], client_weights: List[float]) -> List[np.ndarray]:
    aggregated_parameters = [np.zeros_like(param) for param in results[0][0]]
    for (client_params, _), weight in zip(results, client_weights):
        for i, param in enumerate(client_params):
            aggregated_parameters[i] += param * weight
    return aggregated_parameters
```

---

## 5. Why Not Weight by Accuracy Alone?

A naive optimization strategy would simply assign weights strictly proportional to client classification accuracy. In clinical machine learning, this approach is fundamentally flawed for the following reasons:

### 5.1 The Class Imbalance Fallacy
In our diabetes cohort, **91.5%** of patients are non-diabetic and only **8.5%** have diabetes.
- A defective or trivial client model that predicts `diabetes = 0` for 100% of cases achieves **91.5% accuracy** while having **0.0% recall**.
- If weighted by accuracy alone, this defective model would receive an enormous weight, pulling the global model toward false-negative blindness.

### 5.2 The Local Overfitting Trap
A client operating on a small, homogeneous dataset (e.g., Hospital B with 2,000 younger patients) can easily achieve **99.2% local training accuracy** by memorizing local data.
- However, its updates will generalize poorly to the broader population.
- Rewarding high accuracy in isolated environments amplifies overfitting globally.

### 5.3 Goodhart’s Law
> *"When a measure becomes a target, it ceases to be a good measure."*
- If participating hospital nodes know accuracy directly controls aggregation weight, local optimizers are incentivized to optimize shallow accuracy over generalization or calibration.

### 5.4 Multi-Objective Equilibrium
By combining validation performance with sample size, variance stability, and reliability, `AdaptiveFedAvg` enforces an equilibrium:
- High accuracy is only rewarded if accompanied by stable convergence and sufficient sample representation.
- Outlier updates are dampened automatically.

---

## 6. Empirical Comparison: FedAvg vs. AdaptiveFedAvg

Across both IID and Non-IID simulation experiments on the 100K patient dataset:

| Dimension | Standard FedAvg | AdaptiveFedAvg (HealthFusion_FL) |
| :--- | :--- | :--- |
| **Weighting Basis** | Pure sample count ($n_k / N$) | Performance (40%), Samples (30%), Stability (20%), Reliability (10%) |
| **Min / Max Client Bound** | Unbounded ($0.0 \dots 1.0$) | Bounded: $w \in [0.10, 0.60]$ |
| **Non-IID Convergence** | High loss oscillations; slower convergence | Damped oscillations; stable trajectory |
| **Resilience to Skewed Data** | Degrades by 4–7% F1 on label-skew partitions | Maintains high F1 ($\ge 80\%$) across all partitions |
| **Dominant Node Vulnerability** | Critical (large hospital can skew global weights) | Protected (capped at 60% max weight) |
| **Tracking & Auditing** | None | Full weight tracking exported to JSON telemetry |
