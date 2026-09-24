"""
Differential privacy mechanisms.
"""
import numpy as np

class DPMechanism:
    """Mechanism for adding differential privacy noise."""
    
    def __init__(self, epsilon: float = 1.0, delta: float = 1e-5, noise_multiplier: float = 1.1, max_grad_norm: float = 1.0):
        """Initialize DP mechanism."""
        self.epsilon = epsilon
        self.delta = delta
        self.noise_multiplier = noise_multiplier
        self.max_grad_norm = max_grad_norm
        
    def add_noise_to_gradients(self, gradients: list[np.ndarray]) -> list[np.ndarray]:
        """Clip gradients and add noise."""
        noisy_gradients = []
        for grad in gradients:
            # Clip
            norm = np.linalg.norm(grad)
            if norm > self.max_grad_norm:
                grad = grad * (self.max_grad_norm / norm)
            
            # Add noise: sigma = noise_multiplier * max_grad_norm
            sigma = self.noise_multiplier * self.max_grad_norm
            noise = np.random.normal(0, sigma, grad.shape)
            noisy_gradients.append(grad + noise)
            
        return noisy_gradients
        
    def add_noise_to_weights(self, weights: list[np.ndarray]) -> list[np.ndarray]:
        """Add noise to weights."""
        noisy_weights = []
        for weight in weights:
            sigma = self.noise_multiplier * self.max_grad_norm
            noise = np.random.normal(0, sigma, weight.shape)
            noisy_weights.append(weight + noise)
        return noisy_weights
        
    def compute_privacy_spent(self, num_steps: int, batch_size: int, dataset_size: int) -> dict:
        """Compute privacy budget spent."""
        epsilon_spent = self.epsilon * (num_steps * batch_size / max(dataset_size, 1))
        return {
            'epsilon_spent': epsilon_spent,
            'delta': self.delta
        }
        
    def get_status(self) -> dict:
        """Get mechanism details."""
        return {
            'mechanism': 'Gaussian',
            'epsilon': self.epsilon,
            'delta': self.delta,
            'noise_type': 'Gaussian',
            'max_grad_norm': self.max_grad_norm
        }
