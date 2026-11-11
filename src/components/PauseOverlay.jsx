import soundManager from "../game/sounds.js";

const PauseOverlay = ({
  onResume,
  onRestart,
  gameState,
  isMuted,
  onToggleSound,
  onOpenGuide,
}) => {
  const currentPlayer = gameState.players.find(
    (player) => player.id === gameState.currentPlayerId,
  );

  const handleResume = () => {
    soundManager.playButtonClick();
    onResume();
  };

  const handleRestart = () => {
    soundManager.playButtonClick();
    onRestart();
  };

  const handleOpenGuide = () => {
    soundManager.playButtonClick();
    onOpenGuide?.();
  };

  return (
    <div
      className="pause-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pause-title"
    >
      <div className="pause-card">
        {/* Pause Icon Glow */}
        <div className="pause-icon-wrapper" aria-hidden="true">
          <svg
            className="pause-modal-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
        </div>

        <h2 id="pause-title" className="pause-title">
          Game Paused
        </h2>

        <p className="pause-subtitle">
          Turn {gameState.turnNumber} · Current Turn:{" "}
          <strong className="text-amber-300">
            {currentPlayer?.name ?? "Player"}
          </strong>
        </p>

        {/* Players Summary */}
        <div className="pause-players-summary">
          <span className="summary-heading">Cards Remaining</span>
          <div className="summary-chips">
            {gameState.players.map((p) => (
              <div
                key={p.id}
                className={`summary-chip ${p.id === currentPlayer?.id ? "chip-active" : ""}`}
              >
                <span className="chip-name">{p.name}</span>
                <span className="chip-count">
                  {p.status === "finished"
                    ? `Done (#${p.finishPosition})`
                    : `${p.hand.length} cards`}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Controls */}
        <div className="pause-actions">
          <button
            type="button"
            className="btn-action btn-play is-ready pause-resume-btn"
            onClick={handleResume}
          >
            <span aria-hidden="true">▶</span>
            <span>Resume Game</span>
          </button>

          <button
            type="button"
            className="btn-pause-guide"
            onClick={handleOpenGuide}
          >
            <span aria-hidden="true">📖</span>
            <span>How to Play & Full Rules</span>
          </button>

          <button
            type="button"
            className="btn-pause-restart"
            onClick={handleRestart}
          >
            <span aria-hidden="true">↺</span>
            <span>Restart Game</span>
          </button>
        </div>

        {/* Sound toggle quick control in pause menu */}
        <button
          type="button"
          className="pause-sound-toggle"
          onClick={onToggleSound}
        >
          {isMuted ? (
            <>
              <span aria-hidden="true">🔇</span>
              <span>Sound: Muted (Click to Unmute)</span>
            </>
          ) : (
            <>
              <span aria-hidden="true">🔊</span>
              <span>Sound: Enabled (Click to Mute)</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default PauseOverlay;
