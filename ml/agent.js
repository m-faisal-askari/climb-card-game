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
import { ALL_CARDS, CARD_INDEX_BY_ID } from "./engine/cards.js";
import { ClimbGameSimulation } from "./engine/game_sim.js";
import { encodeStateAction } from "./features/encoder.js";

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
 * Converts a standard game state object from the Climb React app into a ClimbGameSimulation snapshot
 */
export function adaptGameStateToSim(gameState) {
  const sim = new ClimbGameSimulation();

  sim.players = gameState.players.map((p, idx) => ({
    id: idx,
    originalId: p.id,
    name: p.name,
    hand: (p.hand ?? []).map((card) => {
      const idx = CARD_INDEX_BY_ID.get(card.id);
      return idx !== undefined ? ALL_CARDS[idx] : card;
    }),
    status: p.status,
    finishPosition: p.finishPosition ?? null,
  }));

  const currentIdx = gameState.players.findIndex((p) => p.id === gameState.currentPlayerId);
  sim.currentPlayer = currentIdx >= 0 ? currentIdx : 0;

  if (gameState.currentPlay) {
    const playCards = (gameState.currentPlay.cards ?? []).map((card) => {
      const idx = CARD_INDEX_BY_ID.get(card.id);
      return idx !== undefined ? ALL_CARDS[idx] : card;
    });
    sim.currentPlay = {
      playerId: gameState.currentPlay.playerId,
      cards: playCards,
      kind: gameState.currentPlay.kind,
      maxStrength: Math.max(...playCards.map((c) => c.value ?? 0)),
      playedAtTurn: gameState.turnNumber,
    };
  } else {
    sim.currentPlay = null;
  }

  const lastPlayerIdx = gameState.players.findIndex((p) => p.id === gameState.lastPlayerToPlayId);
  sim.lastPlayerToPlay = lastPlayerIdx >= 0 ? lastPlayerIdx : null;
  sim.consecutivePasses = gameState.consecutivePasses ?? 0;
  sim.turnNumber = gameState.turnNumber ?? 1;
  sim.isOver = gameState.status === "finished";

  return { sim, currentIdx };
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
