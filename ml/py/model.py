"""
Vectorized NumPy Deep Q-Network for Climb Card Game
Fully compatible with the JavaScript weights format.
"""

import json
from typing import List
import numpy as np


class ClimbPyDQN:

  def __init__(
      self,
      layer_sizes: List[int] = [216, 128, 64, 32, 1],
      learning_rate: float = 0.001,
  ):
    self.layer_sizes = layer_sizes
    self.lr = learning_rate
    self.num_layers = len(layer_sizes) - 1

    self.weights = []
    self.biases = []

    # Adam moments
    self.beta1 = 0.9
    self.beta2 = 0.999
    self.eps = 1e-8
    self.t = 0
    self.m_w = []
    self.v_w = []
    self.m_b = []
    self.v_b = []

    self._init_weights()

  def _init_weights(self):
    for l in range(self.num_layers):
      in_dim = self.layer_sizes[l]
      out_dim = self.layer_sizes[l + 1]
      std = np.sqrt(2.0 / in_dim)
      W = np.random.uniform(-std, std, (in_dim, out_dim))
      b = np.zeros(out_dim)
      self.weights.append(W)
      self.biases.append(b)

      self.m_w.append(np.zeros_like(W))
      self.v_w.append(np.zeros_like(W))
      self.m_b.append(np.zeros_like(b))
      self.v_b.append(np.zeros_like(b))

  def _relu(self, x):
    return np.where(x > 0, x, 0.05 * x)

  def _relu_deriv(self, x):
    return np.where(x > 0, 1.0, 0.05)

  def predict(self, x: np.ndarray) -> float:
    current = x.reshape(1, -1)
    for l in range(self.num_layers):
      z = current @ self.weights[l] + self.biases[l]
      current = z if l == self.num_layers - 1 else self._relu(z)
    return float(current[0, 0])

  def train_batch(self, X: np.ndarray, y: np.ndarray) -> float:
    batch_size = X.shape[0]
    self.t += 1

    activations = [X]
    zs = []

    current = X
    for l in range(self.num_layers):
      z = current @ self.weights[l] + self.biases[l]
      zs.append(z)
      current = z if l == self.num_layers - 1 else self._relu(z)
      activations.append(current)

    output = activations[-1]
    diff = output - y.reshape(-1, 1)
    loss = float(np.mean(diff**2))

    delta = diff
    for l in range(self.num_layers - 1, -1, -1):
      a_prev = activations[l]
      gW = (a_prev.T @ delta) / batch_size
      gb = np.mean(delta, axis=0)

      # Adam updates
      self.m_w[l] = self.beta1 * self.m_w[l] + (1 - self.beta1) * gW
      self.v_w[l] = self.beta2 * self.v_w[l] + (1 - self.beta2) * (gW**2)
      self.m_b[l] = self.beta1 * self.m_b[l] + (1 - self.beta1) * gb
      self.v_b[l] = self.beta2 * self.v_b[l] + (1 - self.beta2) * (gb**2)

      m_hat_w = self.m_w[l] / (1 - self.beta1**self.t)
      v_hat_w = self.v_w[l] / (1 - self.beta2**self.t)
      m_hat_b = self.m_b[l] / (1 - self.beta1**self.t)
      v_hat_b = self.v_b[l] / (1 - self.beta2**self.t)

      self.weights[l] -= (self.lr * m_hat_w) / (np.sqrt(v_hat_w) + self.eps)
      self.biases[l] -= (self.lr * m_hat_b) / (np.sqrt(v_hat_b) + self.eps)

      if l > 0:
        delta = (delta @ self.weights[l].T) * self._relu_deriv(zs[l - 1])

    return loss

  def save_json(self, path: str):
    data = {
        "layerSizes": self.layer_sizes,
        "weights": [W.flatten().tolist() for W in self.weights],
        "biases": [b.tolist() for b in self.biases],
    }
    with open(path, "w") as f:
      json.dump(data, f, indent=2)

  def load_json(self, path: str):
    with open(path, "r") as f:
      data = json.load(f)
    self.layer_sizes = data["layerSizes"]
    self.num_layers = len(self.layer_sizes) - 1
    self.weights = []
    self.biases = []
    for l in range(self.num_layers):
      in_dim = self.layer_sizes[l]
      out_dim = self.layer_sizes[l + 1]
      self.weights.append(np.array(data["weights"][l]).reshape(in_dim, out_dim))
      self.biases.append(np.array(data["biases"][l]))
