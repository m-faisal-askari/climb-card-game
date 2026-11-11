/**
 * Benchmark Tournament Evaluation for Climb AI Models
 * Pits Trained ML Model vs Expert Heuristic vs Current Baseline Greedy vs Random
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DQNAgent } from "./algorithms/dqn_agent.js";
import { chooseExpertMove } from "./algorithms/expert_heuristic.js";
import { chooseISMCTSMove } from "./algorithms/ismcts_agent.js";
import { ClimbGameSimulation } from "./engine/game_sim.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Baseline Greedy Agent: exactly mimics the current logic in src/game/ai.js
 */
function chooseBaselineGreedyMove(sim, playerIndex) {
  const legalActions = sim.getLegalActionsForCurrentPlayer();
  if (legalActions.length === 0) return null;

  const playActions = legalActions.filter((a) => a.actionType !== "pass");

  if (sim.currentPlay === null) {
    // When leading, baseline sorts by lowest max value, then most cards
    return (
      playActions.sort((a, b) => a.maxStrength - b.maxStrength || b.cards.length - a.cards.length)[0] ?? null
    );
  }

  // When responding, baseline plays lowest beating play, or passes if none
  if (playActions.length > 0) {
    return playActions.sort((a, b) => a.maxStrength - b.maxStrength)[0];
  }

  return legalActions.find((a) => a.actionType === "pass") ?? null;
}

/**
 * Random Legal Agent
 */
function chooseRandomMove(sim) {
  const legal = sim.getLegalActionsForCurrentPlayer();
  if (legal.length === 0) return null;
  return legal[Math.floor(Math.random() * legal.length)];
}

export async function runTournament(numGames = 100) {
  console.log(`\n======================================================`);
  console.log(` CLIMB AI BENCHMARK TOURNAMENT`);
  console.log(` Total Games: ${numGames} | Rotating Seats`);
  console.log(` Competitors:`);
  console.log(`  - Agent A: Smart ML DQN Model (Trained Neural Network)`);
  console.log(`  - Agent B: Strategic Expert Heuristic`);
  console.log(`  - Agent C: Baseline Greedy Agent (Current game AI)`);
  console.log(`  - Agent D: Random Legal Agent`);
  console.log(`======================================================\n`);

  // Load trained ML model if weights file exists
  const weightsPath = path.join(__dirname, "models", "climb_policy_weights.json");
  const dqnAgent = new DQNAgent({ epsilon: 0.0 }); // strictly exploit mode

  if (fs.existsSync(weightsPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(weightsPath, "utf-8"));
      dqnAgent.model.loadJSON(data);
      console.log(`Loaded trained model weights from: ${weightsPath}`);
    } catch (e) {
      console.log(`Notice: Using freshly initialized DQN weights.`);
    }
  }

  const agents = [
    {
      name: "Smart ML (DQN)",
      chooseMove: (sim, idx) => dqnAgent.act(sim, idx, false),
    },
    {
      name: "Expert Heuristic",
      chooseMove: (sim, idx) => chooseExpertMove(sim, idx),
    },
    {
      name: "Baseline Greedy",
      chooseMove: (sim, idx) => chooseBaselineGreedyMove(sim, idx),
    },
    {
      name: "Random Legal",
      chooseMove: (sim, idx) => chooseRandomMove(sim),
    },
  ];

  const stats = agents.map((agent) => ({
    name: agent.name,
    wins: 0,
    seconds: 0,
    thirds: 0,
    fourths: 0,
    totalScore: 0,
    rankSum: 0,
  }));

  const sim = new ClimbGameSimulation();

  for (let g = 0; g < numGames; g++) {
    sim.reset();

    // Rotate agent positions each game to ensure fairness
    const seatAssignment = [
      (0 + g) % 4,
      (1 + g) % 4,
      (2 + g) % 4,
      (3 + g) % 4,
    ];

    while (!sim.isOver) {
      const curIdx = sim.currentPlayer;
      const agentIdx = seatAssignment[curIdx];
      const agent = agents[agentIdx];

      const move = agent.chooseMove(sim, curIdx);
      sim.step(move);
    }

    // Record results
    for (let pIdx = 0; pIdx < 4; pIdx++) {
      const agentIdx = seatAssignment[pIdx];
      const pos = sim.players[pIdx].finishPosition ?? 4;
      stats[agentIdx].rankSum += pos;

      if (pos === 1) {
        stats[agentIdx].wins += 1;
        stats[agentIdx].totalScore += 3;
      } else if (pos === 2) {
        stats[agentIdx].seconds += 1;
        stats[agentIdx].totalScore += 1;
      } else if (pos === 3) {
        stats[agentIdx].thirds += 1;
        stats[agentIdx].totalScore -= 1;
      } else {
        stats[agentIdx].fourths += 1;
        stats[agentIdx].totalScore -= 3;
      }
    }
  }

  // Format results table
  console.log(`\n======================================================`);
  console.log(` TOURNAMENT RESULTS (${numGames} Games)`);
  console.log(`======================================================`);
  console.log(
    `Agent Name           | 1st Place | 2nd Place | 3rd Place | 4th Place | Avg Rank | Total Pts`
  );
  console.log(`----------------------------------------------------------------------------------`);

  stats.sort((a, b) => b.totalScore - a.totalScore);

  for (const s of stats) {
    const winPct = ((s.wins / numGames) * 100).toFixed(1) + "%";
    const secPct = ((s.seconds / numGames) * 100).toFixed(1) + "%";
    const thiPct = ((s.thirds / numGames) * 100).toFixed(1) + "%";
    const fouPct = ((s.fourths / numGames) * 100).toFixed(1) + "%";
    const avgRank = (s.rankSum / numGames).toFixed(2);
    const scoreStr = (s.totalScore >= 0 ? "+" : "") + s.totalScore;

    console.log(
      `${s.name.padEnd(20, " ")} | ${winPct.padStart(9, " ")} | ${secPct.padStart(9, " ")} | ${thiPct.padStart(9, " ")} | ${fouPct.padStart(9, " ")} | ${avgRank.padStart(8, " ")} | ${scoreStr.padStart(9, " ")}`
    );
  }

  console.log(`======================================================\n`);
  return stats;
}

if (process.argv[1] && process.argv[1].endsWith("evaluate.js")) {
  runTournament(100).catch(console.error);
}
