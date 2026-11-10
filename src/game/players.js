import generateAndDealDeck from "./deck.js";
import humanAvatar from "../assets/human.png";
import daveAvatar from "../assets/dave.png";
import graceAvatar from "../assets/grace.png";
import lilyAvatar from "../assets/lily.png";

const sortPlayerHand = (hand) =>
  [...hand].sort((a, b) => a.value - b.value || a.id.localeCompare(b.id));

const createPlayers = () => {
  const gameHands = generateAndDealDeck();
  const playerDetails = [
    { id: "player-1", name: "You", type: "human", path: humanAvatar },
    { id: "player-2", name: "Dave", type: "computer", path: daveAvatar },
    { id: "player-3", name: "Grace", type: "computer", path: graceAvatar },
    { id: "player-4", name: "Lily", type: "computer", path: lilyAvatar },
  ];

  return playerDetails.map((details, index) => ({
    ...details,
    hand: sortPlayerHand(gameHands[index]),
    status: "active",
    finishPosition: null,
  }));
};

const playersData = () => {
  const players = createPlayers();
  const startingPlayer = players.find((player) =>
    player.hand.some((card) => card.id === "spades-3"),
  );

  if (!startingPlayer) {
    throw new Error("Starting card (3♠) not found in any player's hand.");
  }

  return {
    players,
    startingPlayerId: startingPlayer.id,
  };
};

export default playersData;
