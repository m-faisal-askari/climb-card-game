/**
 * Fast Self-Play Simulation Environment for Climb Card Game
 */

import { ALL_CARDS, CARD_INDEX_BY_ID, SPADES_3_INDEX } from "./cards.js";
import { getLegalActions } from "./rules.js";

/**
 * Modern Fisher-Yates shuffle
 */
function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export class ClimbGameSimulation {
  constructor() {
    this.reset();
  }

  /**
   * Resets and deals a new game of Climb
   */
  reset(fixedSeedDeck = null) {
    const deck = fixedSeedDeck ? [...fixedSeedDeck] : shuffle(ALL_CARDS);

    this.players = [
      { id: 0, name: "Player 0", hand: deck.slice(0, 14), status: "active", finishPosition: null },
      { id: 1, name: "Player 1", hand: deck.slice(14, 28), status: "active", finishPosition: null },
      { id: 2, name: "Player 2", hand: deck.slice(28, 42), status: "active", finishPosition: null },
      { id: 3, name: "Player 3", hand: deck.slice(42, 56), status: "active", finishPosition: null },
    ];

    // Sort hands ascending by card value
    for (const p of this.players) {
      p.hand.sort((a, b) => a.value - b.value);
    }

    // Find starting player holding spades-3
    let starter = 0;
    for (let i = 0; i < 4; i++) {
      if (this.players[i].hand.some((c) => c.index === SPADES_3_INDEX)) {
        starter = i;
        break;
      }
    }

    this.currentPlayer = starter;
    this.currentPlay = null;
    this.lastPlayerToPlay = null;
    this.consecutivePasses = 0;
    this.turnNumber = 1;
    this.finishedPlayers = []; // ordered by finish position
    this.isOver = false;
    this.playedCardsHistory = []; // list of cards already played onto table

    return this.getState();
  }

  /**
   * Deep clones the current game simulation state (for MCTS rollouts)
   */
  clone() {
    const copy = new ClimbGameSimulation();
    copy.players = this.players.map((p) => ({
      id: p.id,
      name: p.name,
      hand: [...p.hand],
      status: p.status,
      finishPosition: p.finishPosition,
    }));
    copy.currentPlayer = this.currentPlayer;
    copy.currentPlay = this.currentPlay
      ? {
          playerId: this.currentPlay.playerId,
          cards: [...this.currentPlay.cards],
          kind: this.currentPlay.kind,
          maxStrength: this.currentPlay.maxStrength,
          playedAtTurn: this.currentPlay.playedAtTurn,
        }
      : null;
    copy.lastPlayerToPlay = this.lastPlayerToPlay;
    copy.consecutivePasses = this.consecutivePasses;
    copy.turnNumber = this.turnNumber;
    copy.finishedPlayers = [...this.finishedPlayers];
    copy.isOver = this.isOver;
    copy.playedCardsHistory = [...this.playedCardsHistory];
    return copy;
  }

  getState() {
    return {
      players: this.players,
      currentPlayer: this.currentPlayer,
      currentPlay: this.currentPlay,
      lastPlayerToPlay: this.lastPlayerToPlay,
      consecutivePasses: this.consecutivePasses,
      turnNumber: this.turnNumber,
      finishedPlayers: this.finishedPlayers,
      isOver: this.isOver,
      playedCardsCount: this.playedCardsHistory.length,
    };
  }

  getActivePlayersCount() {
    return this.players.filter((p) => p.status === "active").length;
  }

  getNextActivePlayerIndex(fromIndex) {
    for (let offset = 1; offset <= 4; offset++) {
      const idx = (fromIndex + offset) % 4;
      if (this.players[idx].status === "active") {
        return idx;
      }
    }
    return null;
  }

  getLegalActionsForCurrentPlayer() {
    if (this.isOver) return [];
    const player = this.players[this.currentPlayer];
    if (!player || player.status !== "active") return [];

    const isFirstTurn = this.turnNumber === 1;
    return getLegalActions(player.hand, this.currentPlay, isFirstTurn, true);
  }

  /**
   * Applies an action to the game state.
   * @param {object} action - either { actionType: "pass" } or play object
   */
  step(action) {
    if (this.isOver) {
      return { isOver: true, rewards: this.getRewards() };
    }

    const player = this.players[this.currentPlayer];

    // CASE 1: PASS
    if (!action || action.actionType === "pass" || action.cards?.length === 0) {
      this.consecutivePasses += 1;
      this.turnNumber += 1;

      // Check if trick is cleared
      const activeCount = this.getActivePlayersCount();
      const lastPlayerActive =
        this.lastPlayerToPlay !== null &&
        this.players[this.lastPlayerToPlay].status === "active";

      // If everyone else active has passed
      const requiredPasses = Math.max(0, activeCount - (lastPlayerActive ? 1 : 0));

      if (this.consecutivePasses >= requiredPasses) {
        // Trick is cleared! The last player who played gets the lead (or next active clockwise)
        const nextLeader = lastPlayerActive
          ? this.lastPlayerToPlay
          : this.getNextActivePlayerIndex(this.lastPlayerToPlay);

        this.currentPlay = null;
        this.lastPlayerToPlay = null;
        this.consecutivePasses = 0;
        this.currentPlayer = nextLeader;
      } else {
        // Next active player
        this.currentPlayer = this.getNextActivePlayerIndex(this.currentPlayer);
      }

      return { isOver: this.isOver, rewards: this.getRewards() };
    }

    // CASE 2: PLAY CARDS
    const playedCardIds = new Set(action.cards.map((c) => c.id));
    player.hand = player.hand.filter((c) => !playedCardIds.has(c.id));
    this.playedCardsHistory.push(...action.cards);

    this.currentPlay = {
      playerId: player.id,
      cards: action.cards,
      kind: action.kind,
      maxStrength: action.maxStrength,
      playedAtTurn: this.turnNumber,
    };
    this.lastPlayerToPlay = player.id;
    this.consecutivePasses = 0;
    this.turnNumber += 1;

    // Check if current player emptied their hand
    if (player.hand.length === 0) {
      player.status = "finished";
      const pos = this.finishedPlayers.length + 1;
      player.finishPosition = pos;
      this.finishedPlayers.push(player.id);

      // Check if 3 players have finished -> game over!
      if (this.finishedPlayers.length >= 3) {
        // Assign 4th position to the remaining active player
        const remaining = this.players.find((p) => p.status === "active");
        if (remaining) {
          remaining.status = "finished";
          remaining.finishPosition = 4;
          this.finishedPlayers.push(remaining.id);
        }
        this.isOver = true;
        return { isOver: true, rewards: this.getRewards() };
      }
    }

    // Advance to next active player
    this.currentPlayer = this.getNextActivePlayerIndex(this.currentPlayer);

    // If only the player who led remains active and has cards, clear trick
    if (
      this.currentPlayer === this.lastPlayerToPlay &&
      this.getActivePlayersCount() <= 1
    ) {
      this.currentPlay = null;
      this.lastPlayerToPlay = null;
      this.consecutivePasses = 0;
    }

    return { isOver: this.isOver, rewards: this.getRewards() };
  }

  /**
   * Final game rewards for reinforcement learning:
   * 1st place: +3.0
   * 2nd place: +1.0
   * 3rd place: -1.0
   * 4th place: -3.0
   */
  getRewards() {
    const rewards = [0, 0, 0, 0];
    const rankPayouts = { 1: 3.0, 2: 1.0, 3: -1.0, 4: -3.0 };

    for (const p of this.players) {
      if (p.finishPosition) {
        rewards[p.id] = rankPayouts[p.finishPosition] ?? 0;
      }
    }
    return rewards;
  }
}
