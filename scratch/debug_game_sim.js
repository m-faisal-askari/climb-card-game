import { chooseExpertMove } from "../ml/algorithms/expert_heuristic.js";
import { ClimbGameSimulation } from "../ml/engine/game_sim.js";

const sim = new ClimbGameSimulation();
sim.reset();

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

console.log("=== Initial Hands ===");
sim.players.forEach((p) => {
  console.log(`Player ${p.id} (${p.hand.length} cards):`, p.hand.map((c) => c.rank).join(" "));
});

let turns = 0;
while (!sim.isOver && turns < 100) {
  turns++;
  const cur = sim.currentPlayer;
  // Player 0: Expert Heuristic, Players 1, 2, 3: Baseline Greedy
  const move = cur === 0 ? chooseExpertMove(sim, cur) : chooseBaselineGreedyMove(sim);
  const moveDesc = !move || move.actionType === "pass" ? "PASS" : `${move.kind} [${move.cards.map((c) => c.rank).join(",")}]`;
  console.log(`Turn ${turns} | Player ${cur} | Action: ${moveDesc} | Table: ${sim.currentPlay ? `${sim.currentPlay.kind} [${sim.currentPlay.cards.map((c) => c.rank).join(",")}]` : "EMPTY"}`);
  sim.step(move);
}

console.log("=== Final Results ===");
sim.players.forEach((p) => {
  console.log(`Player ${p.id}: Position ${p.finishPosition}, Cards left: ${p.hand.length}`);
});
