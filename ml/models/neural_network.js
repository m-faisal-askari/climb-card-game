/**
 * Deep Neural Network for Climb Q-Value / Policy-Value Estimation
 * Fully self-contained pure JS implementation with Adam optimizer.
 * Zero external dependencies. Fast forward/backward pass.
 */

export class DeepQNetwork {
  constructor(layerSizes = [216, 128, 64, 32, 1], lr = 0.001) {
    this.layerSizes = layerSizes;
    this.lr = lr;
    this.numLayers = layerSizes.length - 1;

    // Adam optimizer hyperparams
    this.beta1 = 0.9;
    this.beta2 = 0.999;
    this.eps = 1e-8;
    this.t = 0;

    this.weights = [];
    this.biases = [];

    // Adam moment estimates
    this.m_w = [];
    this.v_w = [];
    this.m_b = [];
    this.v_b = [];

    this._initializeWeights();
  }

  _initializeWeights() {
    this.weights = [];
    this.biases = [];
    this.m_w = [];
    this.v_w = [];
    this.m_b = [];
    this.v_b = [];

    for (let l = 0; l < this.numLayers; l++) {
      const inDim = this.layerSizes[l];
      const outDim = this.layerSizes[l + 1];

      // He / Xavier initialization
      const stddev = Math.sqrt(2.0 / inDim);
      const W = new Float64Array(inDim * outDim);
      for (let i = 0; i < W.length; i++) {
        W[i] = (Math.random() * 2 - 1) * stddev;
      }
      const B = new Float64Array(outDim); // zero bias

      this.weights.push(W);
      this.biases.push(B);

      this.m_w.push(new Float64Array(inDim * outDim));
      this.v_w.push(new Float64Array(inDim * outDim));
      this.m_b.push(new Float64Array(outDim));
      this.v_b.push(new Float64Array(outDim));
    }
  }

  /**
   * Leaky ReLU activation
   */
  _relu(x) {
    return x > 0 ? x : 0.05 * x;
  }

  _relu_deriv(x) {
    return x > 0 ? 1.0 : 0.05;
  }

  /**
   * Forward pass: computes output Q-value for input feature vector.
   * @param {Float64Array} x
   * @returns {number} scalar Q-value
   */
  predict(x) {
    let current = x;

    for (let l = 0; l < this.numLayers; l++) {
      const inDim = this.layerSizes[l];
      const outDim = this.layerSizes[l + 1];
      const W = this.weights[l];
      const B = this.biases[l];
      const next = new Float64Array(outDim);

      for (let j = 0; j < outDim; j++) {
        let sum = B[j];
        for (let i = 0; i < inDim; i++) {
          sum += current[i] * W[i * outDim + j];
        }
        // Apply activation on hidden layers, linear on output
        next[j] = l === this.numLayers - 1 ? sum : this._relu(sum);
      }
      current = next;
    }

    return current[0];
  }

  /**
   * Forward pass caching activations for backpropagation.
   */
  _forwardWithCache(x) {
    const activations = [x];
    const preActivations = [];

    let current = x;
    for (let l = 0; l < this.numLayers; l++) {
      const inDim = this.layerSizes[l];
      const outDim = this.layerSizes[l + 1];
      const W = this.weights[l];
      const B = this.biases[l];

      const z = new Float64Array(outDim);
      const a = new Float64Array(outDim);

      for (let j = 0; j < outDim; j++) {
        let sum = B[j];
        for (let i = 0; i < inDim; i++) {
          sum += current[i] * W[i * outDim + j];
        }
        z[j] = sum;
        a[j] = l === this.numLayers - 1 ? sum : this._relu(sum);
      }

      preActivations.push(z);
      activations.push(a);
      current = a;
    }

    return { activations, preActivations };
  }

  /**
   * Performs gradient descent step on a batch of (input, targetQ) pairs using Adam.
   * @param {Array<{ x: Float64Array, target: number }>} batch
   * @returns {number} Mean Squared Error loss
   */
  trainBatch(batch) {
    if (!batch || batch.length === 0) return 0;
    this.t += 1;

    // Accumulate gradients
    const gradW = this.weights.map((w) => new Float64Array(w.length));
    const gradB = this.biases.map((b) => new Float64Array(b.length));
    let totalLoss = 0;

    for (const sample of batch) {
      const { activations, preActivations } = this._forwardWithCache(sample.x);
      const output = activations[this.numLayers][0];
      const err = output - sample.target;
      totalLoss += err * err;

      // Backpropagation
      let delta = new Float64Array([err]); // dLoss/dOutput = (output - target)

      for (let l = this.numLayers - 1; l >= 0; l--) {
        const inDim = this.layerSizes[l];
        const outDim = this.layerSizes[l + 1];
        const a_prev = activations[l];
        const z = preActivations[l];
        const W = this.weights[l];

        // Gradient w.r.t weights and biases for layer l
        for (let j = 0; j < outDim; j++) {
          const d = delta[j];
          gradB[l][j] += d;
          for (let i = 0; i < inDim; i++) {
            gradW[l][i * outDim + j] += a_prev[i] * d;
          }
        }

        // Backprop delta to previous layer
        if (l > 0) {
          const prevDim = inDim;
          const prevDelta = new Float64Array(prevDim);
          for (let i = 0; i < prevDim; i++) {
            let sum = 0;
            for (let j = 0; j < outDim; j++) {
              sum += delta[j] * W[i * outDim + j];
            }
            prevDelta[i] = sum * this._relu_deriv(preActivations[l - 1][i]);
          }
          delta = prevDelta;
        }
      }
    }

    const batchSize = batch.length;
    const lr = this.lr;
    const beta1 = this.beta1;
    const beta2 = this.beta2;
    const eps = this.eps;
    const t = this.t;

    // Apply Adam updates
    for (let l = 0; l < this.numLayers; l++) {
      const W = this.weights[l];
      const B = this.biases[l];
      const gW = gradW[l];
      const gB = gradB[l];
      const mW = this.m_w[l];
      const vW = this.v_w[l];
      const mB = this.m_b[l];
      const vB = this.v_b[l];

      for (let i = 0; i < W.length; i++) {
        const g = gW[i] / batchSize;
        mW[i] = beta1 * mW[i] + (1 - beta1) * g;
        vW[i] = beta2 * vW[i] + (1 - beta2) * g * g;

        const mHat = mW[i] / (1 - Math.pow(beta1, t));
        const vHat = vW[i] / (1 - Math.pow(beta2, t));

        W[i] -= (lr * mHat) / (Math.sqrt(vHat) + eps);
      }

      for (let j = 0; j < B.length; j++) {
        const g = gB[j] / batchSize;
        mB[j] = beta1 * mB[j] + (1 - beta1) * g;
        vB[j] = beta2 * vB[j] + (1 - beta2) * g * g;

        const mHat = mB[j] / (1 - Math.pow(beta1, t));
        const vHat = vB[j] / (1 - Math.pow(beta2, t));

        B[j] -= (lr * mHat) / (Math.sqrt(vHat) + eps);
      }
    }

    return totalLoss / batchSize;
  }

  /**
   * Export weights to JSON object
   */
  exportJSON() {
    return {
      layerSizes: this.layerSizes,
      weights: this.weights.map((w) => Array.from(w)),
      biases: this.biases.map((b) => Array.from(b)),
    };
  }

  /**
   * Load weights from JSON object
   */
  loadJSON(data) {
    this.layerSizes = data.layerSizes;
    this.numLayers = data.layerSizes.length - 1;
    this.weights = data.weights.map((arr) => Float64Array.from(arr));
    this.biases = data.biases.map((arr) => Float64Array.from(arr));
    this._initializeAdamMoments();
  }

  _initializeAdamMoments() {
    this.m_w = [];
    this.v_w = [];
    this.m_b = [];
    this.v_b = [];
    for (let l = 0; l < this.numLayers; l++) {
      const inDim = this.layerSizes[l];
      const outDim = this.layerSizes[l + 1];
      this.m_w.push(new Float64Array(inDim * outDim));
      this.v_w.push(new Float64Array(inDim * outDim));
      this.m_b.push(new Float64Array(outDim));
      this.v_b.push(new Float64Array(outDim));
    }
  }
}
