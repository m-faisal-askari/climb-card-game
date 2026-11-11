/**
 * Master Strategic Heuristic Agent for Climb
 * Balances aggressive card shedding with smart trump preservation and combo defense.
 */

import { ALL_CARDS, TOTAL_CARDS } from "../engine/cards.js";

/**
 * Finds the highest remaining unplayed card value among opponents
 */
export function getBossCardValue(playedHistory, myHand) {
  const playedIndices = new Set(playedHistory.map((c) => c.index));
  const myIndices = new Set(myHand.map((c) => c.index));

  let maxOpponentValue = 0;
  for (let i = 0; i < TOTAL_CARDS; i++) {
    if (!playedIndices.has(i) && !myIndices.has(i)) {
      if (ALL_CARDS[i].value > maxOpponentValue) {
        maxOpponentValue = ALL_CARDS[i].value;
      }
    }
  }
  return maxOpponentValue;
}

/**
 * Master move selector
 */
export function chooseExpertMove(sim, playerIndex) {
  const player = sim.players[playerIndex];
  if (!player || player.status !== "active") return null;

  const legalActions = sim.getLegalActionsForCurrentPlayer();
  if (legalActions.length === 0) return null;
  if (legalActions.length === 1) return legalActions[0];

  const hand = player.hand;
  const isLeading = sim.currentPlay === null;
  const maxOpponentValue = getBossCardValue(sim.playedCardsHistory, hand);

  // Check minimum opponent hand size
  let minOpponentCards = 14;
  for (let i = 0; i < 4; i++) {
    if (i !== playerIndex && sim.players[i].status === "active") {
      minOpponentCards = Math.min(minOpponentCards, sim.players[i].hand.length);
    }
  }

  // 1. Instant Win: If any action sheds all cards in hand, take it immediately!
  const winMove = legalActions.find((a) => a.cards?.length === hand.length);
  if (winMove) return winMove;

  // 2. LEADING (Table is clear)
  if (isLeading) {
    const playActions = legalActions.filter((a) => a.actionType !== "pass");

    // Endgame defense: if an opponent has 1 card left, NEVER lead a low single!
    if (minOpponentCards === 1) {
      const nonSingles = playActions.filter((a) => a.kind !== "single");
      if (nonSingles.length > 0) {
        // Lead longest combo or pair to block the 1-card opponent
        return nonSingles.sort((a, b) => b.cards.length - a.cards.length || a.maxStrength - b.maxStrength)[0];
      }
      // Forced to lead a single: lead highest card so opponent cannot beat it
      return playActions.sort((a, b) => b.maxStrength - a.maxStrength)[0];
    }

    // Lead combinations in priority order to maximize shedding:
    // A. Sequences (sheds 5+ cards at once)
    const sequences = playActions.filter((a) => a.kind === "sequence");
    if (sequences.length > 0) {
      return sequences.sort((a, b) => b.cards.length - a.cards.length || a.maxStrength - b.maxStrength)[0];
    }

    // B. Quads / Triples (very hard to counter, sheds 3-4 cards and usually keeps lead)
    const multiCards = playActions.filter((a) => a.kind === "four of a kind" || a.kind === "triple");
    if (multiCards.length > 0) {
      return multiCards.sort((a, b) => b.cards.length - a.cards.length || a.maxStrength - b.maxStrength)[0];
    }

    // C. Doubles (pairs)
    const doubles = playActions.filter((a) => a.kind === "double" && a.maxStrength < 14);
    if (doubles.length > 0) {
      return doubles.sort((a, b) => a.maxStrength - b.maxStrength)[0];
    }

    // D. Singles: Prefer lowest unpaired single (don't break pairs when leading a single)
    const singles = playActions.filter((a) => a.kind === "single");
    const unpairedSingles = singles.filter((a) => {
      const rank = a.cards[0].rank;
      return hand.filter((c) => c.rank === rank).length === 1 && a.maxStrength < 13;
    });

    if (unpairedSingles.length > 0) {
      return unpairedSingles.sort((a, b) => a.maxStrength - b.maxStrength)[0];
    }

    // Any low single
    const lowSingles = singles.filter((a) => a.maxStrength < 13);
    if (lowSingles.length > 0) {
      return lowSingles.sort((a, b) => a.maxStrength - b.maxStrength)[0];
    }

    return playActions.sort((a, b) => a.maxStrength - b.maxStrength)[0];
  }

  // 3. RESPONDING TO AN ACTIVE PLAY
  const passAction = legalActions.find((a) => a.actionType === "pass");
  const playActions = legalActions.filter((a) => a.actionType !== "pass");

  if (playActions.length === 0) return passAction ?? null;

  // Separate plays into standard plays (ranks 3..A, values <= 12) and trump plays (2s & Jokers, values >= 13)
  const standardPlays = playActions.filter((a) => a.maxStrength <= 12);
  const trumpPlays = playActions.filter((a) => a.maxStrength >= 13);

  // If we can beat the table with a standard card:
  if (standardPlays.length > 0) {
    // For singles: prefer an unpaired single over breaking a pair
    if (sim.currentPlay.kind === "single") {
      const cleanSingles = standardPlays.filter((a) => {
        const rank = a.cards[0].rank;
        return hand.filter((c) => c.rank === rank).length === 1;
      });
      if (cleanSingles.length > 0) {
        return cleanSingles.sort((a, b) => a.maxStrength - b.maxStrength)[0];
      }
    }
    // Otherwise play the lowest standard beating play
    return standardPlays.sort((a, b) => a.maxStrength - b.maxStrength)[0];
  }

  // If we only have Trump plays (2s or Jokers):
  if (trumpPlays.length > 0) {
    const isCriticalDefense = minOpponentCards <= 2;
    const canWeFinishFast = hand.length <= 3;
    const isHighStakesTrick = sim.currentPlay.maxStrength >= 11; // table card is King, Ace, or 2

    // If opponent is about to win, or we can finish quickly, or table card is already high -> PLAY TRUMP!
    if (isCriticalDefense || canWeFinishFast || isHighStakesTrick) {
      return trumpPlays.sort((a, b) => a.maxStrength - b.maxStrength)[0];
    }

    // Otherwise, PASS and save our 2s / Jokers for when it truly matters!
    if (passAction) return passAction;
  }

  return playActions.sort((a, b) => a.maxStrength - b.maxStrength)[0];
}
