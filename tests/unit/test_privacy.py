"""Unit tests for privacy."""
import pytest
import numpy as np
from src.privacy.differential_privacy import DPMechanism

def test_noise_addition():
    """Verify noise is actually added to gradients."""
    dp = DPMechanism()
    grad = [np.ones((2, 2))]
    noisy = dp.add_noise_to_gradients(grad)
    assert not np.array_equal(grad[0], noisy[0])

def test_gradient_clipping():
    """Verify gradient norms are clipped."""
    dp = DPMechanism(max_grad_norm=1.0)
    grad = [np.ones((2, 2)) * 10]
    norm = np.linalg.norm(grad[0])
    clipped = grad[0] * (1.0 / norm)
    assert np.linalg.norm(clipped) <= 1.0001

def test_privacy_accounting():
    """Verify epsilon tracking."""
    dp = DPMechanism(epsilon=1.0)
    spent = dp.compute_privacy_spent(num_steps=10, batch_size=32, dataset_size=320)
    assert spent['epsilon_spent'] == 1.0
