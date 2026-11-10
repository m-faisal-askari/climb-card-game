import playersData from "./players.js";

const createGameState = () => {
  const { players, startingPlayerId } = playersData();

  if (!startingPlayerId) {
    throw new Error("Starting player could not be determined.");
  }

  return {
    players,
    currentPlayerId: startingPlayerId,
    currentPlay: null,
    lastPlayerToPlayId: null,
    consecutivePasses: 0,
    jokerControl: false,
    status: "playing",
    turnNumber: 1,
    results: [],
  };
};

export default createGameState;
