import { getCombinationType, canBeatPreviousPlay, validatePlay, getSequenceFirstValue } from "../src/game/gameRules.js";
import { getPlayableCombinations, choosePlay } from "../src/game/ai.js";
import cards from "../src/game/cards.js";

const getCard = (id) => {
  const card = cards.find((c) => c.id === id);
  if (!card) throw new Error(`Card ${id} not found`);
  return card;
};

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${message}`);
  } else {
    failed++;
    console.error(`  ✗ FAIL: ${message}`);
  }
}

console.log("=== 1. Sequence Length & Combination Validation ===");

const seq3to7 = [getCard("spades-3"), getCard("hearts-4"), getCard("diamonds-5"), getCard("clubs-6"), getCard("spades-7")];
assert(getCombinationType(seq3to7) === "sequence", "3-4-5-6-7 is valid sequence");

const seq4to8 = [getCard("diamonds-4"), getCard("hearts-5"), getCard("clubs-6"), getCard("spades-7"), getCard("diamonds-8")];
assert(getCombinationType(seq4to8) === "sequence", "4-5-6-7-8 is valid sequence");

const seq10toA = [getCard("spades-10"), getCard("hearts-J"), getCard("diamonds-Q"), getCard("clubs-K"), getCard("spades-A")];
assert(getCombinationType(seq10toA) === "sequence", "10-J-Q-K-A is valid sequence");

const seqJto2 = [getCard("spades-J"), getCard("hearts-Q"), getCard("diamonds-K"), getCard("clubs-A"), getCard("spades-2")];
assert(getCombinationType(seqJto2) === "sequence", "J-Q-K-A-2 is valid sequence");

// Must be exactly 5 cards:
const seq4cards = [getCard("spades-3"), getCard("hearts-4"), getCard("diamonds-5"), getCard("clubs-6")];
assert(getCombinationType(seq4cards) === null, "4-card sequence is rejected (must be exactly 5)");

const seq6cards = [getCard("spades-3"), getCard("hearts-4"), getCard("diamonds-5"), getCard("clubs-6"), getCard("spades-7"), getCard("diamonds-8")];
assert(getCombinationType(seq6cards) === null, "6-card sequence is rejected (must be exactly 5)");

// Non-consecutive:
const nonConsec = [getCard("spades-3"), getCard("hearts-4"), getCard("diamonds-6"), getCard("clubs-7"), getCard("spades-8")];
assert(getCombinationType(nonConsec) === null, "Non-consecutive cards rejected");

// Wrapping 2-3:
const wrapping = [getCard("spades-Q"), getCard("hearts-K"), getCard("diamonds-A"), getCard("clubs-2"), getCard("spades-3")];
assert(getCombinationType(wrapping) === null, "Wrapping Q-K-A-2-3 rejected");

// Joker in sequence:
const withJoker = [getCard("spades-3"), getCard("hearts-4"), getCard("diamonds-5"), getCard("clubs-6"), getCard("BMJ")];
assert(getCombinationType(withJoker) === null, "Sequence with Joker rejected");

console.log("\n=== 2. First Number in Sequence Extraction ===");
assert(getSequenceFirstValue(seq3to7) === 1, "First value of 3-4-5-6-7 is 1 (rank 3)");
assert(getSequenceFirstValue(seq4to8) === 2, "First value of 4-5-6-7-8 is 2 (rank 4)");
assert(getSequenceFirstValue(seq10toA) === 8, "First value of 10-J-Q-K-A is 8 (rank 10)");

console.log("\n=== 3. Playing Sequence When in Lead ===");
const leadPlaySeq = { playerId: "player-1", cards: seq4to8, kind: "sequence" };
assert(validatePlay(leadPlaySeq, null, false) === true, "Can lead with 5-card sequence when table is clear");

const openingSeqWith3 = { playerId: "player-1", cards: seq3to7, kind: "sequence" };
assert(validatePlay(openingSeqWith3, null, true) === true, "Can lead opening play with sequence containing 3♠");

const openingSeqWithout3 = { playerId: "player-1", cards: seq4to8, kind: "sequence" };
assert(validatePlay(openingSeqWithout3, null, true) === false, "Opening play without 3♠ rejected");

console.log("\n=== 4. Sequence Beating Sequence on Table ===");
const tableSeqPlay = { playerId: "player-1", cards: seq3to7, kind: "sequence" }; // first number = 1 (rank 3)
const higherSeqPlay = { playerId: "player-2", cards: seq4to8, kind: "sequence" }; // first number = 2 (rank 4)
const sameSeqPlay = { playerId: "player-2", cards: seq3to7, kind: "sequence" };

assert(canBeatPreviousPlay(tableSeqPlay, higherSeqPlay) === true, "4-5-6-7-8 beats 3-4-5-6-7 on table (2 > 1)");
assert(canBeatPreviousPlay(tableSeqPlay, sameSeqPlay) === false, "Equal sequence cannot beat sequence on table");
assert(canBeatPreviousPlay(higherSeqPlay, tableSeqPlay) === false, "Lower sequence cannot beat higher sequence on table");

console.log("\n=== 5. Sequence Beating Single Card on Table ===");
const tableSingle3 = { playerId: "player-1", cards: [getCard("hearts-3")], kind: "single" }; // val = 1
const tableSingle5 = { playerId: "player-1", cards: [getCard("hearts-5")], kind: "single" }; // val = 3

// seq4to8 has first number 2 (rank 4) -> 2 > 1 (beats 3)
assert(canBeatPreviousPlay(tableSingle3, higherSeqPlay) === true, "Sequence (first number 4) beats single 3 on table");
// seq4to8 has first number 2 (rank 4) -> 2 is NOT > 3 (cannot beat 5)
assert(canBeatPreviousPlay(tableSingle5, higherSeqPlay) === false, "Sequence (first number 4) cannot beat single 5 on table");

// seq3to7 has first number 1 (rank 3) -> 1 is NOT > 1 (equal)
assert(canBeatPreviousPlay(tableSingle3, tableSeqPlay) === false, "Sequence (first number 3) cannot beat single 3 (must be bigger)");

console.log("\n=== 6. Sequence Beating Pair on Table ===");
const tablePair3 = { playerId: "player-1", cards: [getCard("hearts-3"), getCard("diamonds-3")], kind: "double" }; // val = 1
const tablePair4 = { playerId: "player-1", cards: [getCard("hearts-4"), getCard("diamonds-4")], kind: "double" }; // val = 2

// seq4to8 has first number 2 (rank 4) -> 2 > 1 (beats pair of 3s)
assert(canBeatPreviousPlay(tablePair3, higherSeqPlay) === true, "Sequence (first number 4) beats pair of 3s on table");
// seq4to8 has first number 2 (rank 4) -> 2 is NOT > 2 (cannot beat pair of 4s)
assert(canBeatPreviousPlay(tablePair4, higherSeqPlay) === false, "Sequence (first number 4) cannot beat pair of 4s on table");

console.log("\n=== 7. Non-Sequence Plays Cannot Beat Sequence on Table ===");
const singleCard = { playerId: "player-2", cards: [getCard("spades-A")], kind: "single" };
const pairCards = { playerId: "player-2", cards: [getCard("spades-A"), getCard("hearts-A")], kind: "double" };
assert(canBeatPreviousPlay(tableSeqPlay, singleCard) === false, "Single card cannot beat a sequence on table");
assert(canBeatPreviousPlay(tableSeqPlay, pairCards) === false, "Pair cannot beat a sequence on table");

console.log("\n=== 8. Joker Rules Remain Preserved ===");
const jokerPlay = { playerId: "player-1", cards: [getCard("BMJ")], kind: "single" };
assert(canBeatPreviousPlay(jokerPlay, higherSeqPlay) === false, "Sequence cannot beat a Joker on table");

console.log("\n=== 9. AI Playable Sequences ===");
const aiHand = [
  getCard("spades-4"), getCard("hearts-5"), getCard("diamonds-6"), getCard("clubs-7"), getCard("diamonds-8"),
  getCard("clubs-8"), getCard("spades-9"), getCard("hearts-10")
];
const aiCombinations = getPlayableCombinations(aiHand);
const aiSequences = aiCombinations.filter((c) => c.kind === "sequence");
assert(aiSequences.length > 0, "AI identifies valid 5-card sequences in hand");
assert(aiSequences.every((s) => s.cards.length === 5), "All AI sequences have exactly 5 cards");

console.log(`\n========================================`);
console.log(`Test Results: ${passed} passed, ${failed} failed.`);
console.log(`========================================`);

if (failed > 0) process.exit(1);
