import PlayingCard from "./PlayingCard.jsx";

const combinationLabels = {
  single: "Single Card",
  double: "Pair",
  triple: "Three of a Kind",
  "four of a kind": "Four of a Kind",
  sequence: "Sequence",
};

const GameTable = ({
  currentPlay,
  currentPlayer,
  players,
  message,
  turnNumber,
  jokerControl,
}) => {
  const lastPlayer = players.find((player) => player.id === currentPlay?.playerId);
  const isHumanTurn = currentPlayer?.type === "human";

  return (
    <div className="game-table" role="region" aria-label="Game Table">
      {/* Top Table Info: Play Context */}
      <div className="table-header">
        {currentPlay ? (
          <div className="table-badge table-badge-play">
            <span className="player-highlight">{lastPlayer?.name ?? "Player"}</span>
            <span className="badge-divider">•</span>
            <span className="play-kind-highlight">
              {combinationLabels[currentPlay.kind] ?? currentPlay.kind}
            </span>
            <span className="badge-card-count">
              ({currentPlay.cards.length} {currentPlay.cards.length === 1 ? "card" : "cards"})
            </span>
          </div>
        ) : (
          <div className="table-badge table-badge-empty">
            {turnNumber === 1 ? (
              <span>Opening Play · Must include 3♠</span>
            ) : (
              <span>Table is clear · Lead any play</span>
            )}
          </div>
        )}
      </div>

      {/* Center Stage: The Cards on the Felt */}
      <div className="table-cards-zone">
        {currentPlay && currentPlay.cards.length > 0 ? (
          <div className="table-cards-container">
            {currentPlay.cards.map((card) => (
              <div className="table-card-item" key={card.id}>
                <PlayingCard card={card} />
              </div>
            ))}
          </div>
        ) : (
          <div className="table-cards-placeholder" aria-hidden="true">
            <div className="placeholder-card-outline">
              <span className="placeholder-icon">🂠</span>
              <span className="placeholder-text">
                {turnNumber === 1 ? "Lead 3♠" : "Lead"}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Table Info: Turn status & prompts */}
      <div className="table-footer">
        <div
          className={`table-status-badge ${
            isHumanTurn ? "status-your-turn" : "status-waiting"
          }`}
        >
          {isHumanTurn ? (
            <span>
              Your turn {currentPlay ? "— Beat the play or pass" : "— Lead a combination"}
            </span>
          ) : (
            <span>
              Waiting for <strong className="text-amber-200">{currentPlayer?.name ?? "player"}</strong>...
            </span>
          )}
        </div>

        {jokerControl && (
          <p className="table-joker-notice">
            ★ {currentPlay?.kind === "double"
              ? "Only higher double Joker can beat this play"
              : "Only higher Joker can beat this play"}
          </p>
        )}

        {message && (
          <p className="table-message-alert" role="status">
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

export default GameTable;
