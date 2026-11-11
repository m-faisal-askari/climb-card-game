/**
 * Advanced Supervised + Reinforcement Learning Training for Climb DQN
 * Combines Expert Demonstrations with Self-Play Q-Learning
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DQNAgent } from "./algorithms/dqn_agent.js";
import { chooseExpertMove } from "./algorithms/expert_heuristic.js";
import { ClimbGameSimulation } from "./engine/game_sim.js";
import { encodeStateAction } from "./features/encoder.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function trainAdvancedDQN(pretrainGames = 500, rlGames = 1500) {
  console.log(`\n======================================================`);
  console.log(` ADVANCED CLIMB ML TRAINING PIPELINE`);
  console.log(` Phase 1: Expert Demonstration Pre-training (${pretrainGames} games)`);
  console.log(` Phase 2: Self-Play Reinforcement Learning (${rlGames} games)`);
  console.log(`======================================================\n`);

  const agent = new DQNAgent({
    lr: 0.001,
    gamma: 0.95,
    epsilon: 0.25,
    epsilonMin: 0.02,
    epsilonDecay: 0.997,
    memoryCapacity: 15000,
  });

  const sim = new ClimbGameSimulation();

  // ----------------------------------------------------
  // PHASE 1: Expert Demonstration Pre-training
  // ----------------------------------------------------
  console.log(`[Phase 1] Collecting expert game trajectories...`);
  const expertDataset = [];

  for (let g = 0; g < pretrainGames; g++) {
    sim.reset();
    const gameTransitions = [];

    while (!sim.isOver) {
      const cur = sim.currentPlayer;
      const legalActions = sim.getLegalActionsForCurrentPlayer();
      if (legalActions.length === 0) break;

      const expertAction = chooseExpertMove(sim, cur);
      const actionVec = encodeStateAction(sim, cur, expertAction);

      gameTransitions.push({
        player: cur,
        vec: actionVec,
      });

      sim.step(expertAction);
    }

    const rewards = sim.getRewards();
    for (const item of gameTransitions) {
      const pReward = rewards[item.player] ?? 0;
      expertDataset.push({ x: item.vec, target: pReward });
    }
  }

  console.log(`Collected ${expertDataset.length} expert state-action samples.`);
  console.log(`Training neural network on expert dataset (5 epochs)...`);

  for (let epoch = 1; epoch <= 5; epoch++) {
    // Shuffle dataset
    for (let i = expertDataset.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [expertDataset[i], expertDataset[j]] = [expertDataset[j], expertDataset[i]];
    }

    let epochLoss = 0;
    const batchSize = 64;
    const numBatches = Math.floor(expertDataset.length / batchSize);

    for (let b = 0; b < numBatches; b++) {
      const batch = expertDataset.slice(b * batchSize, (b + 1) * batchSize);
      epochLoss += agent.model.trainBatch(batch);
    }

    const avgLoss = (epochLoss / numBatches).toFixed(4);
    console.log(`  Epoch ${epoch}/5 - MSE Loss: ${avgLoss}`);
  }

  // ----------------------------------------------------
  // PHASE 2: Self-Play Reinforcement Learning
  // ----------------------------------------------------
  console.log(`\n[Phase 2] Starting Self-Play RL Fine-Tuning (${rlGames} games)...`);
  const rlHistory = [];
  const finishDist = { 1: 0, 2: 0, 3: 0, 4: 0 };
  let totalRLLoss = 0;
  let rlLossCount = 0;

  for (let ep = 1; ep <= rlGames; ep++) {
    sim.reset();
    const epMoves = [];

    while (!sim.isOver) {
      const cur = sim.currentPlayer;
      const legal = sim.getLegalActionsForCurrentPlayer();
      if (legal.length === 0) break;

      let move;
      if (cur === 0) {
        // Player 0: Learning Agent
        move = agent.act(sim, cur, true);
        const vec = encodeStateAction(sim, cur, move);
        epMoves.push({ player: cur, vec, move });
      } else if (cur === 1) {
        // Player 1: Master Expert
        move = chooseExpertMove(sim, cur);
      } else {
        // Players 2, 3: Mix of Expert and Greedy
        move = Math.random() < 0.6 ? chooseExpertMove(sim, cur) : legal[0];
      }

      sim.step(move);
    }

    const rewards = sim.getRewards();
    const p0Rank = sim.players[0].finishPosition ?? 4;
    finishDist[p0Rank] += 1;

    for (const item of epMoves) {
      const p0Reward = rewards[0];
      agent.remember(item.vec, item.move, p0Reward, null, 0, true);
    }

    if (ep % 2 === 0) {
      const loss = agent.replay(48);
      if (loss > 0) {
        totalRLLoss += loss;
        rlLossCount += 1;
      }
    }

    if (ep % 250 === 0 || ep === rlGames) {
      const avgLoss = rlLossCount > 0 ? (totalRLLoss / rlLossCount).toFixed(4) : "0.0000";
      const winPct = ((finishDist[1] / ep) * 100).toFixed(1);
      const top2Pct = (((finishDist[1] + finishDist[2]) / ep) * 100).toFixed(1);

      console.log(
        `[RL Episode ${ep.toString().padStart(4, " ")}/${rlGames}] ` +
          `Avg Loss: ${avgLoss} | Win: ${winPct}% | Top-2: ${top2Pct}% | Epsilon: ${agent.epsilon.toFixed(3)}`
      );

      totalRLLoss = 0;
      rlLossCount = 0;
    }
  }

  // Save the refined weights
  const weightsPath = path.join(__dirname, "models", "climb_policy_weights.json");
  const modelData = agent.model.exportJSON();
  fs.writeFileSync(weightsPath, JSON.stringify(modelData, null, 2));

  console.log(`\nRefined model weights saved successfully to: ${weightsPath}`);
  console.log(`Final Distribution: 1st: ${finishDist[1]}, 2nd: ${finishDist[2]}, 3rd: ${finishDist[3]}, 4th: ${finishDist[4]}`);
}

if (process.argv[1] && process.argv[1].endsWith("train_dqn_expert.js")) {
  trainAdvancedDQN(500, 1500).catch(console.error);
}
