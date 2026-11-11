/**
 * High-performance Rules and Move Generation for Climb ML
 */

import { ALL_CARDS, CARD_BY_ID, SPADES_3_INDEX } from "./cards.js";

const COMBINATION_KINDS = {
  1: "single",
  2: "double",
  3: "triple",
  4: "four of a kind",
};

/**
 * Classifies a set of cards into a Climb combination type.
 * @param {Array<object>} cards
 * @returns {string|null} "single" | "double" | "triple" | "four of a kind" | "sequence" | null
 */
export function classifyCombination(cards) {
  if (!cards || cards.length === 0) return null;
  if (cards.length === 1) return "single";

  const jokers = cards.filter((c) => c.type === "joker");
  if (jokers.length > 0) {
    if (jokers.length !== 2 || cards.length !== 2) return null;
    const g1 = jokers[0].meta?.gender;
    const g2 = jokers[1].meta?.gender;
    return g1 && g1 === g2 ? "double" : null;
  }

  const ranks = new Set(cards.map((c) => c.rank));
  if (ranks.size === 1 && cards.length <= 4) {
    return COMBINATION_KINDS[cards.length] ?? null;
  }

  // Sequences: 5 or more standard cards of consecutive rank values, no wrapping
  if (cards.length < 5 || cards.some((c) => c.type !== "standard")) {
    return null;
  }

  const values = cards.map((c) => c.value).sort((a, b) => a - b);
  const uniqueValues = new Set(values);

  if (
    uniqueValues.size !== cards.length ||
    values[values.length - 1] - values[0] !== cards.length - 1
  ) {
    return null;
  }

  return "sequence";
}

export function getPlayMaxStrength(cards) {
  let max = -1;
  for (let i = 0; i < cards.length; i++) {
    if (cards[i].value > max) max = cards[i].value;
  }
  return max;
}

export function isJokerCombination(cards) {
  return cards.length > 0 && cards.every((c) => c.type === "joker");
}

/**
 * Checks if candidate play legally beats the current table play.
 */
export function canBeatPlay(currentPlay, candidatePlay) {
  if (!currentPlay) return true;
  if (!candidatePlay || candidatePlay.kind !== currentPlay.kind) return false;
  if (candidatePlay.cards.length !== currentPlay.cards.length) return false;

  const currentIsJoker = isJokerCombination(currentPlay.cards);
  const candidateIsJoker = isJokerCombination(candidatePlay.cards);

  if (currentIsJoker && !candidateIsJoker) return false;

  const candidateStrength = getPlayMaxStrength(candidatePlay.cards);
  const currentStrength = getPlayMaxStrength(currentPlay.cards);

  return candidateStrength > currentStrength;
}

/**
 * Helper to generate subsets of given size
 */
function getCombinationsOfSize(arr, size) {
  const result = [];
  function backtrack(start, combo) {
    if (combo.length === size) {
      result.push(combo);
      return;
    }
    for (let i = start; i <= arr.length - (size - combo.length); i++) {
      backtrack(i + 1, [...combo, arr[i]]);
    }
  }
  backtrack(0, []);
  return result;
}

/**
 * Finds all consecutive standard card sequences (length >= 5) in a hand
 */
function findSequences(hand) {
  const standardByValue = new Map();
  for (const c of hand) {
    if (c.type === "standard") {
      const list = standardByValue.get(c.value) ?? [];
      list.push(c);
      standardByValue.set(c.value, list);
    }
  }

  const sequences = [];

  function extendSeq(value, currentCards) {
    const cardsAtVal = standardByValue.get(value);
    if (!cardsAtVal) return;

    for (const card of cardsAtVal) {
      const nextSelection = [...currentCards, card];
      if (nextSelection.length >= 5) {
        sequences.push(nextSelection);
      }
      if (value < 13) {
        extendSeq(value + 1, nextSelection);
      }
    }
  }

  for (let startVal = 1; startVal <= 13; startVal++) {
    extendSeq(startVal, []);
  }

  return sequences;
}

/**
 * Enumerates all structurally valid plays that can be formed from a player's hand.
 * @param {Array<object>} hand
 * @returns {Array<object>} array of { cards, kind, maxStrength, cardIds }
 */
export function getAllHandCombinations(hand) {
  const combos = [];

  // 1. Singles
  for (const card of hand) {
    combos.push({
      cards: [card],
      kind: "single",
      maxStrength: card.value,
      cardIds: [card.id],
    });
  }

  // 2. Multi-cards of same rank (doubles, triples, quads)
  const byRank = new Map();
  const jokersByGender = new Map();

  for (const card of hand) {
    if (card.type === "joker") {
      const g = card.meta.gender;
      const jList = jokersByGender.get(g) ?? [];
      jList.push(card);
      jokersByGender.set(g, jList);
    } else {
      const rList = byRank.get(card.rank) ?? [];
      rList.push(card);
      byRank.set(card.rank, rList);
    }
  }

  for (const cards of byRank.values()) {
    for (let size = 2; size <= Math.min(cards.length, 4); size++) {
      const subsets = getCombinationsOfSize(cards, size);
      for (const subset of subsets) {
        combos.push({
          cards: subset,
          kind: COMBINATION_KINDS[size],
          maxStrength: subset[0].value,
          cardIds: subset.map((c) => c.id),
        });
      }
    }
  }

  // Double Jokers (same gender only)
  for (const jokers of jokersByGender.values()) {
    if (jokers.length >= 2) {
      const subsets = getCombinationsOfSize(jokers, 2);
      for (const subset of subsets) {
        combos.push({
          cards: subset,
          kind: "double",
          maxStrength: Math.max(subset[0].value, subset[1].value),
          cardIds: subset.map((c) => c.id),
        });
      }
    }
  }

  // 3. Sequences (length >= 5)
  const sequences = findSequences(hand);
  for (const seq of sequences) {
    combos.push({
      cards: seq,
      kind: "sequence",
      maxStrength: getPlayMaxStrength(seq),
      cardIds: seq.map((c) => c.id),
    });
  }

  return combos;
}

/**
 * Returns all legal actions for a player given the current table state.
 * @param {Array<object>} hand
 * @param {object|null} currentPlay
 * @param {boolean} isOpeningTurn
 * @param {boolean} allowPass
 * @returns {Array<object>} list of valid play actions (including null for PASS if allowed)
 */
export function getLegalActions(hand, currentPlay, isOpeningTurn = false, allowPass = true) {
  const allCombos = getAllHandCombinations(hand);

  let legalCombos = allCombos.filter((play) => {
    if (isOpeningTurn) {
      // Must include spades-3
      if (!play.cardIds.includes("spades-3")) return false;
    }
    if (!currentPlay) return true;
    return canBeatPlay(currentPlay, play);
  });

  const actions = [...legalCombos];

  // PASS is legal whenever there is an active play on the table
  // (or if explicitly permitted when leading)
  if (currentPlay !== null && allowPass) {
    actions.push({
      actionType: "pass",
      cards: [],
      kind: null,
      maxStrength: 0,
      cardIds: [],
    });
  }

  return actions;
}
