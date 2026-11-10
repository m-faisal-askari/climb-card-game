import { checkGameOver, hasPlayerFinished } from "../src/game/gameRules.js";
import { finishPlayer, getGameResults } from "../src/game/gameActions.js";
import soundManager from "../src/game/sounds.js";

console.log("--- Testing 3-Player Finish Rule ---");

let state = {
  players: [
    { id: "player-1", name: "You", type: "human", hand: [{ id: "c1" }, { id: "c2" }], status: "active", finishPosition: null },
    { id: "player-2", name: "Dave", type: "computer", hand: [], status: "active", finishPosition: null },
    { id: "player-3", name: "Grace", type: "computer", hand: [{ id: "c3" }], status: "active", finishPosition: null },
    { id: "player-4", name: "Lily", type: "computer", hand: [{ id: "c4" }], status: "active", finishPosition: null },
  ],
  results: [],
  status: "playing",
};

// 1. Dave finishes
state = finishPlayer(state, "player-2");
console.log("Dave finishes -> state.status:", state.status, "(expected: playing), results:", state.results.length);

// 2. Grace finishes
state.players[2].hand = [];
state = finishPlayer(state, "player-3");
console.log("Grace finishes -> state.status:", state.status, "(expected: playing), results:", state.results.length);

// 3. Lily finishes (3rd player!)
state.players[3].hand = [];
state = finishPlayer(state, "player-4");
console.log("Lily finishes -> state.status:", state.status, "(expected: finished!), results:", state.results.length);

const finalResults = getGameResults(state);
console.log("Final Standings:");
finalResults.forEach((r) => {
  console.log(`  Position ${r.position}: ${r.name} (${r.status})`);
});

const isGameOver = state.status === "finished";
const allFourRanked = finalResults.length === 4;
const lastPlayerIsFourth = finalResults.find((r) => r.id === "player-1")?.position === 4;

if (isGameOver && allFourRanked && lastPlayerIsFourth) {
  console.log("SUCCESS: 3-player finish rule works exactly as expected!");
} else {
  console.error("FAIL: 3-player finish rule failed expectation.");
  process.exit(1);
}

console.log("\n--- Testing SoundManager Methods ---");
console.log("SoundManager initial muted:", soundManager.isMuted());
soundManager.toggleMute();
console.log("SoundManager after toggle:", soundManager.isMuted());
soundManager.toggleMute();
console.log("SoundManager methods present:", [
  typeof soundManager.playCardSelect,
  typeof soundManager.playCardDeselect,
  typeof soundManager.playCardPlay,
  typeof soundManager.playPass,
  typeof soundManager.playYourTurn,
  typeof soundManager.playError,
  typeof soundManager.playJoker,
  typeof soundManager.playPlayerFinished,
  typeof soundManager.playGameOver,
].every((t) => t === "function"));
