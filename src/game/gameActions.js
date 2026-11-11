import {
  checkGameOver,
  getCombinationType,
  hasPlayerFinished,
  isJokerPlay,
  validatePlay,
} from "./gameRules.js";

export function getPlayerById(gameState, playerId) {
  return gameState.players.find((player) => player.id === playerId) ?? null;
}

export function getNextPlayerId(gameState) {
  const currentIndex = gameState.players.findIndex(
    (player) => player.id === gameState.currentPlayerId,
  );

  if (currentIndex === -1) return null;

  for (let offset = 1; offset <= gameState.players.length; offset += 1) {
    const player =
      gameState.players[(currentIndex + offset) % gameState.players.length];

    if (player.status === "active") return player.id;
  }

  return null;
}

function getNextActivePlayerAfter(gameState, playerId) {
  const playerIndex = gameState.players.findIndex(
    (player) => player.id === playerId,
  );

  if (playerIndex === -1) {
    return gameState.players.find((player) => player.status === "active")?.id ?? null;
  }

  for (let offset = 1; offset <= gameState.players.length; offset += 1) {
    const player =
      gameState.players[(playerIndex + offset) % gameState.players.length];

    if (player.status === "active") return player.id;
  }

  return null;
}

function getRequiredPasses(gameState) {
  const activePlayers = gameState.players.filter(
    (player) => player.status === "active",
  );
  const lastPlayer = getPlayerById(gameState, gameState.lastPlayerToPlayId);
  const lastPlayerCanLead = lastPlayer?.status === "active";

  return Math.max(0, activePlayers.length - (lastPlayerCanLead ? 1 : 0));
}

export function finishPlayer(gameState, playerId) {
  const player = getPlayerById(gameState, playerId);

  if (
    !player ||
    !hasPlayerFinished(player) ||
    gameState.results.some((result) => result.playerId === playerId)
  ) {
    return gameState;
  }

  const position = gameState.results.length + 1;
  let nextState = {
    ...gameState,
    players: gameState.players.map((candidate) =>
      candidate.id === playerId
        ? { ...candidate, status: "finished", finishPosition: position }
        : candidate,
    ),
    results: [...gameState.results, { playerId, position }],
  };

  if (checkGameOver(nextState)) {
    const remainingPlayer = nextState.players.find(
      (candidate) => !nextState.results.some((r) => r.playerId === candidate.id),
    );
    if (remainingPlayer) {
      const lastPosition = 4;
      nextState = {
        ...nextState,
        players: nextState.players.map((candidate) =>
          candidate.id === remainingPlayer.id
            ? { ...candidate, status: "finished", finishPosition: lastPosition }
            : candidate,
        ),
        results: [
          ...nextState.results,
          { playerId: remainingPlayer.id, position: lastPosition },
        ],
      };
    }
    return { ...nextState, status: "finished" };
  }

  return nextState;
}

export function getGameResults(gameState) {
  return [...gameState.results]
    .sort((a, b) => a.position - b.position)
    .map((result) => ({
      ...getPlayerById(gameState, result.playerId),
      position: result.position,
    }));
}

export function activateJokerControl(gameState) {
  return {
    ...gameState,
    jokerControl: isJokerPlay(gameState.currentPlay),
  };
}

export function resolveTrick(gameState) {
  if (!gameState.currentPlay || !gameState.lastPlayerToPlayId) return gameState;
  if (gameState.consecutivePasses < getRequiredPasses(gameState)) return gameState;

  const lastPlayer = getPlayerById(gameState, gameState.lastPlayerToPlayId);
  const nextLeadPlayerId =
    lastPlayer?.status === "active"
      ? lastPlayer.id
      : getNextActivePlayerAfter(gameState, gameState.lastPlayerToPlayId);

  return {
    ...gameState,
    currentPlayerId: nextLeadPlayerId,
    currentPlay: null,
    lastPlayerToPlayId: null,
    consecutivePasses: 0,
    jokerControl: false,
  };
}

function applyPass(gameState) {
  if (
    gameState.status !== "playing" ||
    !gameState.currentPlay ||
    getRequiredPasses(gameState) === 0
  ) {
    return gameState;
  }

  const nextState = {
    ...gameState,
    consecutivePasses: gameState.consecutivePasses + 1,
    turnNumber: gameState.turnNumber + 1,
  };

  const passesNeeded = getRequiredPasses(nextState);
  if (nextState.consecutivePasses >= passesNeeded) {
    return resolveTrick(nextState);
  }

  return { ...nextState, currentPlayerId: getNextPlayerId(gameState) };
}

export function handleJokerPass(gameState) {
  if (!gameState.jokerControl) return gameState;
  return applyPass(gameState);
}

export function passTurn(gameState) {
  return gameState.jokerControl ? handleJokerPass(gameState) : applyPass(gameState);
}

export function counterJoker(gameState, selectedCardIds) {
  if (!gameState.jokerControl) return gameState;
  return playCards(gameState, selectedCardIds);
}

export function resolveJokerControl(gameState) {
  if (!gameState.jokerControl) return gameState;
  return resolveTrick(gameState);
}

export function playCards(gameState, selectedCardIds) {
  if (
    gameState.status !== "playing" ||
    !Array.isArray(selectedCardIds) ||
    selectedCardIds.length === 0 ||
    new Set(selectedCardIds).size !== selectedCardIds.length
  ) {
    return gameState;
  }

  const currentPlayer = getPlayerById(gameState, gameState.currentPlayerId);
  if (!currentPlayer || currentPlayer.status !== "active") return gameState;

  const selectedIds = new Set(selectedCardIds);
  const selectedCards = currentPlayer.hand.filter((card) => selectedIds.has(card.id));
  if (selectedCards.length !== selectedIds.size) return gameState;

  const sortedCards = [...selectedCards].sort((a, b) => a.value - b.value);

  const newPlay = {
    playerId: currentPlayer.id,
    cards: sortedCards,
    kind: getCombinationType(sortedCards),
    playedAtTurn: gameState.turnNumber,
  };

  if (!validatePlay(newPlay, gameState.currentPlay, gameState.turnNumber === 1)) {
    return gameState;
  }

  let nextState = {
    ...gameState,
    players: gameState.players.map((player) =>
      player.id === currentPlayer.id
        ? {
            ...player,
            hand: player.hand.filter((card) => !selectedIds.has(card.id)),
          }
        : player,
    ),
    currentPlay: newPlay,
    lastPlayerToPlayId: currentPlayer.id,
    consecutivePasses: 0,
    turnNumber: gameState.turnNumber + 1,
  };

  const updatedPlayer = getPlayerById(nextState, currentPlayer.id);
  if (hasPlayerFinished(updatedPlayer)) {
    nextState = finishPlayer(nextState, currentPlayer.id);
  }

  nextState = {
    ...nextState,
    currentPlayerId: getNextPlayerId({
      ...nextState,
      currentPlayerId: currentPlayer.id,
    }),
  };
  nextState = activateJokerControl(nextState);

  // If only the player who led remains active, there is no response to wait for.
  if (
    nextState.status === "playing" &&
    nextState.currentPlayerId === currentPlayer.id &&
    getRequiredPasses(nextState) === 0
  ) {
    nextState = resolveTrick(nextState);
  }

  return nextState;
}
