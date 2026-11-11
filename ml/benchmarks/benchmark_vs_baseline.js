/**
 * Benchmark 1 Smart Agent vs 3 Baseline Greedy Opponents (Real Game Setting)
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DQNAgent } from "../algorithms/dqn_agent.js";
import { chooseExpertMove } from "../algorithms/expert_heuristic.js";
import { ClimbGameSimulation } from "../engine/game_sim.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function chooseBaselineGreedyMove(sim) {
  const legalActions = sim.getLegalActionsForCurrentPlayer();
  if (legalActions.length === 0) return null;
  const playActions = legalActions.filter((a) => a.actionType !== "pass");
  if (sim.currentPlay === null) {
    return playActions.sort((a, b) => a.maxStrength - b.maxStrength || b.cards.length - a.cards.length)[0] ?? null;
  }
  if (playActions.length > 0) {
    return playActions.sort((a, b) => a.maxStrength - b.maxStrength)[0];
  }
  return legalActions.find((a) => a.actionType === "pass") ?? null;
}

export function testAgentVsBaseline(agentName, chooseAgentMove, numGames = 200) {
  const sim = new ClimbGameSimulation();
  const finishCounts = { 1: 0, 2: 0, 3: 0, 4: 0 };
  let rankSum = 0;
  let totalScore = 0;

  for (let g = 0; g < numGames; g++) {
    sim.reset();
    // Rotate candidate agent's seat across games (seat 0, 1, 2, 3)
    const smartSeat = g % 4;

    while (!sim.isOver) {
      const cur = sim.currentPlayer;
      const move = cur === smartSeat ? chooseAgentMove(sim, cur) : chooseBaselineGreedyMove(sim);
      sim.step(move);
    }

    const pos = sim.players[smartSeat].finishPosition ?? 4;
    finishCounts[pos] += 1;
    rankSum += pos;

    if (pos === 1) totalScore += 3;
    else if (pos === 2) totalScore += 1;
    else if (pos === 3) totalScore -= 1;
    else totalScore -= 3;
  }

  const winRate = ((finishCounts[1] / numGames) * 100).toFixed(1);
  const top2Rate = (((finishCounts[1] + finishCounts[2]) / numGames) * 100).toFixed(1);
  const avgRank = (rankSum / numGames).toFixed(2);

  console.log(`Results for [${agentName}] vs 3 Baseline Opponents (${numGames} Games):`);
  console.log(`  - 1st Place Win Rate : ${winRate}% (Expected random: 25.0%)`);
  console.log(`  - Top-2 Podium Rate  : ${top2Rate}% (Expected random: 50.0%)`);
  console.log(`  - Average Rank       : ${avgRank} (1.0 = best, 4.0 = worst)`);
  console.log(`  - Total Score Pts    : ${totalScore >= 0 ? "+" : ""}${totalScore}`);
  console.log(`  - Finish Distribution: 1st: ${finishCounts[1]}, 2nd: ${finishCounts[2]}, 3rd: ${finishCounts[3]}, 4th: ${finishCounts[4]}\n`);

  return { winRate, top2Rate, avgRank, totalScore, finishCounts };
}

async function run() {
  console.log(`\n================================================================`);
  console.log(` 1 SMART AI VS 3 BASELINE OPPONENTS (Real In-Game Scenario)`);
  console.log(`================================================================\n`);

  const dqnAgent = new DQNAgent({ epsilon: 0.0 });
  const weightsPath = path.join(__dirname, "..", "models", "climb_policy_weights.json");
  if (fs.existsSync(weightsPath)) {
    const data = JSON.parse(fs.readFileSync(weightsPath, "utf-8"));
    dqnAgent.model.loadJSON(data);
  }

  testAgentVsBaseline("Smart ML (DQN)", (sim, idx) => dqnAgent.act(sim, idx, false), 200);
  testAgentVsBaseline("Master Expert Heuristic", (sim, idx) => chooseExpertMove(sim, idx), 200);
}

run().catch(console.error);
