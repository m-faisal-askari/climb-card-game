/**
 * Self-Play Reinforcement Learning Trainer for Climb ML Model
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DQNAgent } from "./algorithms/dqn_agent.js";
import { chooseExpertMove } from "./algorithms/expert_heuristic.js";
import { ClimbGameSimulation } from "./engine/game_sim.js";
import { encodeStateAction } from "./features/encoder.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function trainModel(numEpisodes = 300, logInterval = 50) {
  console.log(`\n======================================================`);
  console.log(` Starting Self-Play Training Pipeline for Climb AI`);
  console.log(` Episodes: ${numEpisodes} | Features: 216 | Architecture: [216, 128, 64, 32, 1]`);
  console.log(`======================================================\n`);

  const agent = new DQNAgent({
    lr: 0.0015,
    gamma: 0.95,
    epsilon: 0.35,
    epsilonMin: 0.05,
    epsilonDecay: 0.992,
    memoryCapacity: 8000,
  });

  const sim = new ClimbGameSimulation();
  let totalLoss = 0;
  let lossCount = 0;
  const finishCounts = { 1: 0, 2: 0, 3: 0, 4: 0 };
  const history = [];

  const startTime = Date.now();

  for (let ep = 1; ep <= numEpisodes; ep++) {
    sim.reset();

    // Track state-action transitions during the game
    const episodeHistory = [];

    while (!sim.isOver) {
      const curPlayer = sim.currentPlayer;
      const legalActions = sim.getLegalActionsForCurrentPlayer();
      if (legalActions.length === 0) break;

      let chosenAction;

      // Player 0 is the learning agent; Players 1, 2, 3 use expert heuristic or self-play
      if (curPlayer === 0) {
        const stateVec = encodeStateAction(sim, curPlayer, legalActions[0]); // placeholder to capture pre-state
        chosenAction = agent.act(sim, curPlayer, true);
        const actionVec = encodeStateAction(sim, curPlayer, chosenAction);
        episodeHistory.push({
          player: curPlayer,
          stateVec: actionVec,
          action: chosenAction,
        });
      } else {
        // Opponents use expert heuristic with 20% exploration for diverse game scenarios
        if (Math.random() < 0.2) {
          chosenAction = legalActions[Math.floor(Math.random() * legalActions.length)];
        } else {
          chosenAction = chooseExpertMove(sim, curPlayer);
        }
      }

      sim.step(chosenAction);
    }

    // Game completed! Assign final rewards
    const rewards = sim.getRewards();
    const p0Position = sim.players[0].finishPosition ?? 4;
    finishCounts[p0Position] += 1;

    // Train agent on the completed game trajectory
    const p0Reward = rewards[0];
    for (let i = 0; i < episodeHistory.length; i++) {
      const item = episodeHistory[i];
      // Temporal difference reward attribution
      const isTerminal = i === episodeHistory.length - 1;
      const discount = Math.pow(agent.gamma, episodeHistory.length - 1 - i);
      const targetReward = p0Reward * discount;

      agent.remember(item.stateVec, item.action, targetReward, null, 0, isTerminal);
    }

    // Mini-batch gradient update
    if (ep % 2 === 0) {
      const loss = agent.replay(32);
      if (loss > 0) {
        totalLoss += loss;
        lossCount += 1;
      }
    }

    // Logging & Checkpoint
    if (ep % logInterval === 0 || ep === numEpisodes) {
      const avgLoss = lossCount > 0 ? (totalLoss / lossCount).toFixed(4) : "0.0000";
      const winRate = ((finishCounts[1] / ep) * 100).toFixed(1);
      const top2Rate = (((finishCounts[1] + finishCounts[2]) / ep) * 100).toFixed(1);
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

      console.log(
        `[Episode ${ep.toString().padStart(4, " ")}/${numEpisodes}] ` +
          `Avg Loss: ${avgLoss} | Win(1st): ${winRate}% | Top-2: ${top2Rate}% | ` +
          `Epsilon: ${agent.epsilon.toFixed(3)} | Time: ${elapsed}s`
      );

      history.push({
        episode: ep,
        avgLoss: Number(avgLoss),
        winRate: Number(winRate),
        top2Rate: Number(top2Rate),
        epsilon: Number(agent.epsilon.toFixed(3)),
      });

      totalLoss = 0;
      lossCount = 0;
    }
  }

  // Save trained weights to JSON
  const weightsPath = path.join(__dirname, "models", "climb_policy_weights.json");
  const modelData = agent.model.exportJSON();
  fs.writeFileSync(weightsPath, JSON.stringify(modelData, null, 2));

  console.log(`\nModel weights saved successfully to: ${weightsPath}`);
  console.log(`Final Distribution: 1st: ${finishCounts[1]}, 2nd: ${finishCounts[2]}, 3rd: ${finishCounts[3]}, 4th: ${finishCounts[4]}`);

  return { agent, history, finishCounts };
}

// Run directly if invoked from CLI
if (process.argv[1] && process.argv[1].endsWith("train.js")) {
  trainModel(300, 50).catch(console.error);
}
