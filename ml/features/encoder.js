/**
 * State and Action Feature Encoder for Climb Machine Learning
 * Converts game states and candidate actions into fixed-size normalized feature vectors.
 */

import { ALL_CARDS, CARD_INDEX_BY_ID, TOTAL_CARDS } from "../engine/cards.js";

export const FEATURE_DIM = 216;

/**
 * Encodes a (state, action) pair into a float feature vector of length 216.
 *
 * @param {object} sim - The ClimbGameSimulation instance
 * @param {number} playerIndex - Index of the player making the decision
 * @param {object} action - Candidate action to evaluate
 * @returns {Float64Array}
 */
export function encodeStateAction(sim, playerIndex, action) {
  const vec = new Float64Array(FEATURE_DIM);
  let offset = 0;

  const player = sim.players[playerIndex];
  const hand = player?.hand ?? [];

  // 1. My Hand Cards (56 binary)
  for (const card of hand) {
    vec[offset + card.index] = 1.0;
  }
  offset += TOTAL_CARDS; // +56 -> offset = 56

  // 2. Hand Distribution by Rank (14 floats: 3..2, Jokers)
  const rankCounts = new Float64Array(14);
  for (const card of hand) {
    if (card.type === "joker") {
      rankCounts[13] += 1;
    } else {
      const rankIdx = card.value - 1; // 0..12
      if (rankIdx >= 0 && rankIdx < 13) {
        rankCounts[rankIdx] += 1;
      }
    }
  }
  for (let i = 0; i < 14; i++) {
    vec[offset + i] = rankCounts[i] / 4.0;
  }
  offset += 14; // +14 -> offset = 70

  // 3. Played Discards History (56 binary)
  for (const card of sim.playedCardsHistory) {
    vec[offset + card.index] = 1.0;
  }
  offset += TOTAL_CARDS; // +56 -> offset = 126

  // 4. Remaining Unknown Cards (56 binary: neither in my hand nor played)
  for (let i = 0; i < TOTAL_CARDS; i++) {
    const inMyHand = vec[i] > 0.5;
    const isPlayed = vec[offset - TOTAL_CARDS + i] > 0.5;
    if (!inMyHand && !isPlayed) {
      vec[offset + i] = 1.0;
    }
  }
  offset += TOTAL_CARDS; // +56 -> offset = 182

  // 5. Opponent Hand Sizes (3 floats, clockwise relative to player)
  for (let step = 1; step <= 3; step++) {
    const oppIdx = (playerIndex + step) % 4;
    const opp = sim.players[oppIdx];
    vec[offset + (step - 1)] = opp.hand.length / 14.0;
  }
  offset += 3; // +3 -> offset = 185

  // 6. Opponent Finished Status (3 floats)
  for (let step = 1; step <= 3; step++) {
    const oppIdx = (playerIndex + step) % 4;
    const opp = sim.players[oppIdx];
    vec[offset + (step - 1)] = opp.status === "finished" ? 1.0 : 0.0;
  }
  offset += 3; // +3 -> offset = 188

  // 7. Current Table Play Context (10 floats)
  const currentPlay = sim.currentPlay;
  if (!currentPlay) {
    vec[offset] = 1.0; // Table is empty
  } else {
    // Play kind one-hot: single, double, triple, four of a kind, sequence
    const kinds = ["single", "double", "triple", "four of a kind", "sequence"];
    const kIdx = kinds.indexOf(currentPlay.kind);
    if (kIdx >= 0) vec[offset + 1 + kIdx] = 1.0;

    vec[offset + 6] = currentPlay.cards.length / 14.0;
    vec[offset + 7] = (currentPlay.maxStrength ?? 0) / 17.0;
    vec[offset + 8] = currentPlay.cards.every((c) => c.type === "joker") ? 1.0 : 0.0;
    vec[offset + 9] = sim.consecutivePasses / 3.0;
  }
  offset += 10; // +10 -> offset = 198

  // 8. Candidate Action Features (18 floats)
  const isPass = !action || action.actionType === "pass" || action.cards?.length === 0;

  if (isPass) {
    vec[offset] = 1.0; // Is pass
    vec[offset + 7] = hand.length / 14.0; // Cards remaining if pass
  } else {
    const actionKinds = ["single", "double", "triple", "four of a kind", "sequence"];
    const akIdx = actionKinds.indexOf(action.kind);
    if (akIdx >= 0) vec[offset + 1 + akIdx] = 1.0;

    const actionCount = action.cards.length;
    const actionStrength = action.maxStrength ?? 0;
    const cardsRemaining = hand.length - actionCount;

    vec[offset + 6] = actionCount / 14.0;
    vec[offset + 7] = actionStrength / 17.0;
    vec[offset + 8] = cardsRemaining / 14.0;
    vec[offset + 9] = cardsRemaining === 0 ? 1.0 : 0.0; // Instant win flag!

    // High cards retained after action (2s and Jokers, values >= 13)
    const actionCardIds = new Set(action.cards.map((c) => c.id));
    let highCardsKept = 0;
    for (const c of hand) {
      if (c.value >= 13 && !actionCardIds.has(c.id)) {
        highCardsKept += 1;
      }
    }
    vec[offset + 10] = highCardsKept / 8.0;

    // Check if breaking a pair/triple:
    if (action.kind === "single") {
      const singleCard = action.cards[0];
      if (singleCard && singleCard.type === "standard") {
        const countOfRankInHand = hand.filter((c) => c.rank === singleCard.rank).length;
        if (countOfRankInHand > 1) {
          vec[offset + 11] = 1.0; // Breaking a pair or triple!
        }
      }
    }

    // Opponent endgame threat: does any active opponent have <= 2 cards?
    let minOpponentCards = 14;
    for (let i = 0; i < 4; i++) {
      if (i !== playerIndex && sim.players[i].status === "active") {
        minOpponentCards = Math.min(minOpponentCards, sim.players[i].hand.length);
      }
    }
    vec[offset + 12] = minOpponentCards <= 2 ? 1.0 : 0.0;
    vec[offset + 13] = minOpponentCards === 1 ? 1.0 : 0.0;

    // Danger flag: playing a low single when an opponent has 1 card left
    if (action.kind === "single" && actionStrength <= 6 && minOpponentCards === 1) {
      vec[offset + 14] = 1.0; // Highly dangerous move!
    }

    // Boss card flag: is this action's top card higher than all remaining cards in opponents' hands?
    let maxOpponentStrength = 0;
    for (let cIdx = 0; cIdx < TOTAL_CARDS; cIdx++) {
      if (vec[182 + cIdx] > 0.5) { // Unplayed unknown card
        if (ALL_CARDS[cIdx].value > maxOpponentStrength) {
          maxOpponentStrength = ALL_CARDS[cIdx].value;
        }
      }
    }
    vec[offset + 15] = actionStrength >= maxOpponentStrength ? 1.0 : 0.0; // Guarantees trick victory!
  }

  return vec;
}
