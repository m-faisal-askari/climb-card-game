/**
 * Climb Smart ML Inference Adapter
 * Ready to integrate into the main game whenever desired without modifying src/ yet.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DQNAgent } from "./algorithms/dqn_agent.js";
import { chooseExpertMove } from "./algorithms/expert_heuristic.js";
import { chooseISMCTSMove } from "./algorithms/ismcts_agent.js";
import { adaptGameStateToSim } from "./state_adapter.js";

export { adaptGameStateToSim };

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let cachedDQNAgent = null;

/**
 * Loads the trained DQN agent singleton
 */
export function getSmartDQNAgent() {
  if (cachedDQNAgent) return cachedDQNAgent;

  cachedDQNAgent = new DQNAgent({ epsilon: 0.0 });
  const weightsPath = path.join(__dirname, "models", "climb_policy_weights.json");

  if (fs.existsSync(weightsPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(weightsPath, "utf-8"));
      cachedDQNAgent.model.loadJSON(data);
    } catch (e) {
      console.warn("Could not load weights, using default initialized model:", e);
    }
  }

  return cachedDQNAgent;
}

/**
 * Chooses the smartest move for the current player using the ML model or ISMCTS.
 *
 * @param {object} gameState - Standard Climb game state
 * @param {object} options - { mode: 'dqn' | 'ismcts' | 'expert' }
 * @returns {object|null} { cards: Array<Card>, kind: string } or null for pass
 */
export function chooseSmartMove(gameState, options = {}) {
  const mode = options.mode ?? "dqn";
  const { sim, currentIdx } = adaptGameStateToSim(gameState);

  if (sim.isOver || currentIdx < 0) return null;

  let chosenAction = null;

  if (mode === "ismcts") {
    chosenAction = chooseISMCTSMove(sim, currentIdx, options.iterations ?? 150);
  } else if (mode === "expert") {
    chosenAction = chooseExpertMove(sim, currentIdx);
  } else {
    // Default: Trained Deep Q-Network ML Model
    const agent = getSmartDQNAgent();
    chosenAction = agent.act(sim, currentIdx, false);
  }

  if (!chosenAction || chosenAction.actionType === "pass" || chosenAction.cards?.length === 0) {
    return null; // Pass
  }

  return {
    cards: chosenAction.cards,
    kind: chosenAction.kind,
  };
}
