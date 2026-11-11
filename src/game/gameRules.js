const combinationTypes = {
  1: "single",
  2: "double",
  3: "triple",
  4: "four of a kind",
};

export function getCombinationType(cards = []) {
  if (!Array.isArray(cards) || cards.length === 0) return null;

  if (cards.length === 1) return "single";

  const jokers = cards.filter((card) => card.type === "joker");

  if (jokers.length > 0) {
    if (jokers.length !== cards.length || jokers.length !== 2) return null;

    const genders = new Set(jokers.map((card) => card.meta?.gender));
    return genders.size === 1 && !genders.has(undefined) ? "double" : null;
  }

  const ranks = new Set(cards.map((card) => card.rank));
  if (ranks.size === 1 && cards.length <= 4) {
    return combinationTypes[cards.length] ?? null;
  }

  // A sequence must have exactly five standard cards in consecutive rank order and does not wrap from 2 to 3.
  if (cards.length !== 5 || cards.some((card) => card.type !== "standard")) {
    return null;
  }

  const values = cards.map((card) => card.value).sort((a, b) => a - b);
  const uniqueValues = new Set(values);

  if (
    uniqueValues.size !== 5 ||
    values[4] - values[0] !== 4
  ) {
    return null;
  }

  return "sequence";
}

export function validateFirstPlay(cardIds) {
  return Array.isArray(cardIds) && cardIds.includes("spades-3");
}

export function isJokerPlay(play) {
  return Boolean(
    play?.cards?.length && play.cards.every((card) => card.type === "joker"),
  );
}

function getPlayStrength(play) {
  return Math.max(...play.cards.map((card) => card.value));
}

export function getSequenceFirstValue(cards = []) {
  if (!Array.isArray(cards) || cards.length === 0) return 0;
  return Math.min(...cards.map((card) => card.value));
}

export function canBeatPreviousPlay(previousPlay, nextPlay) {
  if (!previousPlay || !nextPlay) {
    return false;
  }

  if (isJokerPlay(previousPlay) && !isJokerPlay(nextPlay)) return false;

  // If next play is a sequence (exactly five cards in consecutive order)
  if (nextPlay.kind === "sequence") {
    if (nextPlay.cards.length !== 5) return false;

    const nextFirstVal = getSequenceFirstValue(nextPlay.cards);

    // Beating a sequence on the table: first number in sequence must be bigger
    if (previousPlay.kind === "sequence") {
      const prevFirstVal = getSequenceFirstValue(previousPlay.cards);
      return nextFirstVal > prevFirstVal;
    }

    // A sequence can also be thrown if its first number is bigger than the play on the table
    // (regardless of whether the table has a single card, pair, or triple)
    if (
      previousPlay.kind === "single" ||
      previousPlay.kind === "double" ||
      previousPlay.kind === "triple"
    ) {
      const tableVal = getPlayStrength(previousPlay);
      return nextFirstVal > tableVal;
    }

    return false;
  }

  // A non-sequence play cannot beat a sequence on the table
  if (previousPlay.kind === "sequence") {
    return false;
  }

  if (previousPlay.kind !== nextPlay.kind) {
    return false;
  }

  if (previousPlay.cards.length !== nextPlay.cards.length) return false;

  return getPlayStrength(nextPlay) > getPlayStrength(previousPlay);
}

export function canCounterJoker(currentPlay, newPlay) {
  return (
    isJokerPlay(currentPlay) &&
    isJokerPlay(newPlay) &&
    currentPlay.kind === newPlay.kind &&
    currentPlay.cards.length === newPlay.cards.length &&
    getPlayStrength(newPlay) > getPlayStrength(currentPlay)
  );
}

export function validatePlay(newPlay, currentPlay, isFirstPlay = false) {
  if (!newPlay?.cards?.length) return false;

  const cardIds = newPlay.cards.map((card) => card.id);
  if (new Set(cardIds).size !== cardIds.length) return false;

  const combinationType = getCombinationType(newPlay.cards);
  if (!combinationType || combinationType !== newPlay.kind) return false;

  if (isFirstPlay && !validateFirstPlay(cardIds)) return false;
  if (!currentPlay) return true;

  if (isJokerPlay(currentPlay)) {
    return canCounterJoker(currentPlay, newPlay);
  }

  return canBeatPreviousPlay(currentPlay, newPlay);
}

export function hasPlayerFinished(player) {
  return Boolean(player && player.hand.length === 0);
}

export function checkGameOver(gameState) {
  if (!gameState?.players?.length) return false;
  const finishedCount = gameState.players.filter(
    (player) => player.status === "finished" || hasPlayerFinished(player),
  ).length;
  return finishedCount >= 3;
}
