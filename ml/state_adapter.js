import { ALL_CARDS, CARD_INDEX_BY_ID } from "./engine/cards.js";
import { ClimbGameSimulation } from "./engine/game_sim.js";

/** Converts the browser game's state to the format used by the ML simulator. */
export function adaptGameStateToSim(gameState) {
  const sim = new ClimbGameSimulation();

  sim.players = gameState.players.map((player, playerIndex) => ({
    id: playerIndex,
    originalId: player.id,
    name: player.name,
    hand: (player.hand ?? []).map((card) => {
      const cardIndex = CARD_INDEX_BY_ID.get(card.id);
      return cardIndex !== undefined ? ALL_CARDS[cardIndex] : card;
    }),
    status: player.status,
    finishPosition: player.finishPosition ?? null,
  }));

  const currentIdx = gameState.players.findIndex(
    (player) => player.id === gameState.currentPlayerId,
  );
  sim.currentPlayer = currentIdx >= 0 ? currentIdx : 0;

  if (gameState.currentPlay) {
    const playCards = (gameState.currentPlay.cards ?? []).map((card) => {
      const cardIndex = CARD_INDEX_BY_ID.get(card.id);
      return cardIndex !== undefined ? ALL_CARDS[cardIndex] : card;
    });
    const playPlayerIdx = gameState.players.findIndex(
      (player) => player.id === gameState.currentPlay.playerId,
    );

    sim.currentPlay = {
      playerId: playPlayerIdx >= 0 ? playPlayerIdx : gameState.currentPlay.playerId,
      cards: playCards,
      kind: gameState.currentPlay.kind,
      maxStrength: Math.max(...playCards.map((card) => card.value ?? 0)),
      playedAtTurn: gameState.currentPlay.playedAtTurn ?? gameState.turnNumber,
    };
  } else {
    sim.currentPlay = null;
  }

  const lastPlayerIdx = gameState.players.findIndex(
    (player) => player.id === gameState.lastPlayerToPlayId,
  );
  sim.lastPlayerToPlay = lastPlayerIdx >= 0 ? lastPlayerIdx : null;
  sim.consecutivePasses = gameState.consecutivePasses ?? 0;
  sim.turnNumber = gameState.turnNumber ?? 1;
  sim.isOver = gameState.status === "finished";

  // Rebuild the public play history from cards no longer held by any player.
  const cardsStillInHands = new Set(
    gameState.players.flatMap((player) =>
      (player.hand ?? []).map((card) => card.id),
    ),
  );
  sim.playedCardsHistory = ALL_CARDS.filter(
    (card) => !cardsStillInHands.has(card.id),
  );
  sim.finishedPlayers = sim.players
    .filter((player) => player.finishPosition != null)
    .sort((a, b) => a.finishPosition - b.finishPosition)
    .map((player) => player.id);

  return { sim, currentIdx };
}
