import { passTurn, playCards } from "./gameActions.js";
import { getCombinationType, validatePlay } from "./gameRules.js";

function getSubsets(cards, size) {
  const subsets = [];

  function visit(startIndex, selected) {
    if (selected.length === size) {
      subsets.push(selected);
      return;
    }

    for (let index = startIndex; index <= cards.length - (size - selected.length); index += 1) {
      visit(index + 1, [...selected, cards[index]]);
    }
  }

  visit(0, []);
  return subsets;
}

function getSequences(hand) {
  const cardsByValue = new Map();

  hand
    .filter((card) => card.type === "standard")
    .forEach((card) => {
      const cards = cardsByValue.get(card.value) ?? [];
      cards.push(card);
      cardsByValue.set(card.value, cards);
    });

  const sequences = [];

  function extendSequence(value, selectedCards) {
    const cards = cardsByValue.get(value);
    if (!cards) return;

    cards.forEach((card) => {
      const nextSelection = [...selectedCards, card];
      if (nextSelection.length === 5) {
        sequences.push(nextSelection);
      } else if (nextSelection.length < 5 && value < 13) {
        extendSequence(value + 1, nextSelection);
      }
    });
  }

  for (let startValue = 1; startValue <= 9; startValue += 1) {
    extendSequence(startValue, []);
  }

  return sequences;
}

export function getPlayableCombinations(hand) {
  const combinations = hand.map((card) => ({ cards: [card], kind: "single" }));
  const cardsByRank = new Map();
  const jokersByGender = new Map();

  hand.forEach((card) => {
    if (card.type === "joker") {
      const jokers = jokersByGender.get(card.meta.gender) ?? [];
      jokers.push(card);
      jokersByGender.set(card.meta.gender, jokers);
      return;
    }

    const rankCards = cardsByRank.get(card.rank) ?? [];
    rankCards.push(card);
    cardsByRank.set(card.rank, rankCards);
  });

  cardsByRank.forEach((cards) => {
    for (let size = 2; size <= Math.min(cards.length, 4); size += 1) {
      getSubsets(cards, size).forEach((subset) => {
        combinations.push({ cards: subset, kind: getCombinationType(subset) });
      });
    }
  });

  jokersByGender.forEach((cards) => {
    getSubsets(cards, 2).forEach((subset) => {
      combinations.push({ cards: subset, kind: getCombinationType(subset) });
    });
  });

  getSequences(hand).forEach((sequence) => {
    combinations.push({ cards: sequence, kind: "sequence" });
  });

  return combinations.filter((combination) => combination.kind);
}

function getPlayValue(play) {
  if (play.kind === "sequence") {
    return Math.min(...play.cards.map((card) => card.value));
  }
  return Math.max(...play.cards.map((card) => card.value));
}

export function choosePlay(gameState, player) {
  const activePlayer =
    player ?? gameState.players.find((candidate) => candidate.id === gameState.currentPlayerId);
  if (!activePlayer) return null;

  const isOpeningPlay = gameState.turnNumber === 1;

  return (
    getPlayableCombinations(activePlayer.hand)
      .filter((combination) => {
        const proposedPlay = {
          ...combination,
          playerId: activePlayer.id,
          playedAtTurn: gameState.turnNumber,
        };
        return validatePlay(proposedPlay, gameState.currentPlay, isOpeningPlay);
      })
      .sort(
        (a, b) =>
          getPlayValue(a) -
            getPlayValue(b) ||
          b.cards.length - a.cards.length ||
          a.cards.reduce((sum, card) => sum + card.value, 0) -
            b.cards.reduce((sum, card) => sum + card.value, 0),
      )[0] ?? null
  );
}

export function shouldPass(gameState, player) {
  if (!gameState.currentPlay) return false;
  return choosePlay(gameState, player) === null;
}

export function makeAIMove(gameState) {
  const currentPlayer = gameState.players.find(
    (player) => player.id === gameState.currentPlayerId,
  );

  if (
    gameState.status !== "playing" ||
    currentPlayer?.type !== "computer" ||
    currentPlayer.status !== "active"
  ) {
    return gameState;
  }

  const play = choosePlay(gameState, currentPlayer);
  return play
    ? playCards(gameState, play.cards.map((card) => card.id))
    : passTurn(gameState);
}
