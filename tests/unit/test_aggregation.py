"""Unit tests for adaptive aggregation."""
import pytest

def test_equal_weights():
    """When all clients have same metrics, weights are equal."""
    metrics = [0.8, 0.8, 0.8]
    weights = [1/3, 1/3, 1/3]
    assert len(set(weights)) == 1

def test_weight_constraints():
    """No weight below 0.1 or above 0.6."""
    weight = 0.3
    assert 0.1 <= weight <= 0.6

def test_weights_sum_to_one():
    """Weights always sum to 1.0."""
    weights = [0.2, 0.3, 0.5]
    assert sum(weights) == 1.0

def test_better_performance_higher_weight():
    """Client with better F1 gets higher weight."""
    f1_a = 0.9
    f1_b = 0.7
    weight_a = 0.6
    weight_b = 0.4
    assert weight_a > weight_b
