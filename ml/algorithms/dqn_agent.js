/**
 * Deep Q-Learning Agent for Climb Card Game
 */

import { encodeStateAction } from "../features/encoder.js";
import { DeepQNetwork } from "../models/neural_network.js";

export class DQNAgent {
  constructor(options = {}) {
    this.lr = options.lr ?? 0.001;
    this.gamma = options.gamma ?? 0.95; // discount factor
    this.epsilon = options.epsilon ?? 0.2; // exploration rate
    this.epsilonMin = options.epsilonMin ?? 0.05;
    this.epsilonDecay = options.epsilonDecay ?? 0.995;
    this.memoryCapacity = options.memoryCapacity ?? 5000;

    this.model = new DeepQNetwork([216, 128, 64, 32, 1], this.lr);
    this.memory = [];
  }

  /**
   * Selects an action using epsilon-greedy policy over candidate Q-values.
   */
  act(sim, playerIndex, explore = true) {
    const legalActions = sim.getLegalActionsForCurrentPlayer();
    if (legalActions.length === 0) return null;
    if (legalActions.length === 1) return legalActions[0];

    // Exploration: pick a random legal action
    if (explore && Math.random() < this.epsilon) {
      const randIdx = Math.floor(Math.random() * legalActions.length);
      return legalActions[randIdx];
    }

    // Exploitation: evaluate Q(s, a) for all legal actions
    let bestAction = legalActions[0];
    let maxQ = -Infinity;

    for (const action of legalActions) {
      const featVec = encodeStateAction(sim, playerIndex, action);
      const qVal = this.model.predict(featVec);
      if (qVal > maxQ) {
        maxQ = qVal;
        bestAction = action;
      }
    }

    return bestAction;
  }

  /**
   * Scores all legal actions and returns them sorted by Q-value
   */
  rankActions(sim, playerIndex) {
    const legalActions = sim.getLegalActionsForCurrentPlayer();
    return legalActions.map((action) => {
      const featVec = encodeStateAction(sim, playerIndex, action);
      const qVal = this.model.predict(featVec);
      return { action, qVal };
    }).sort((a, b) => b.qVal - a.qVal);
  }

  /**
   * Store transition in replay memory
   */
  remember(stateVec, action, reward, nextSim, nextPlayerIdx, isDone) {
    if (this.memory.length >= this.memoryCapacity) {
      this.memory.shift();
    }
    this.memory.push({ stateVec, action, reward, nextSim, nextPlayerIdx, isDone });
  }

  /**
   * Train on a batch from replay memory
   */
  replay(batchSize = 32) {
    if (this.memory.length < batchSize) return 0;

    const batch = [];
    for (let i = 0; i < batchSize; i++) {
      const randIdx = Math.floor(Math.random() * this.memory.length);
      const exp = this.memory[randIdx];

      let targetQ = exp.reward;
      if (!exp.isDone && exp.nextSim) {
        // Bellman optimality: r + gamma * max_a' Q(s', a')
        const nextActions = exp.nextSim.getLegalActionsForCurrentPlayer();
        if (nextActions.length > 0) {
          let nextMaxQ = -Infinity;
          for (const a of nextActions) {
            const nextVec = encodeStateAction(exp.nextSim, exp.nextPlayerIdx, a);
            const q = this.model.predict(nextVec);
            if (q > nextMaxQ) nextMaxQ = q;
          }
          targetQ += this.gamma * nextMaxQ;
        }
      }

      batch.push({ x: exp.stateVec, target: targetQ });
    }

    const loss = this.model.trainBatch(batch);

    // Decay exploration
    if (this.epsilon > this.epsilonMin) {
      this.epsilon *= this.epsilonDecay;
    }

    return loss;
  }
}
