import soundManager from "../game/sounds.js";

const ActionControls = ({
  onPlay,
  onPass,
  disabled = false,
  canPass = true,
  hasSelection = true,
}) => {
  const canPlay = !disabled && hasSelection;
  const canPassTurn = !disabled && canPass;

  const handlePlayClick = () => {
    if (!canPlay) return;
    soundManager.playButtonClick();
    onPlay();
  };

  const handlePassClick = () => {
    if (!canPassTurn) return;
    soundManager.playButtonClick();
    onPass();
  };

  return (
    <div className="action-controls" role="group" aria-label="Game actions">
      <button
        type="button"
        className={`btn-action btn-play ${canPlay ? "is-ready" : "is-disabled"}`}
        onClick={handlePlayClick}
        disabled={!canPlay}
      >
        <span className="btn-icon" aria-hidden="true">▲</span>
        <span>Play Selected</span>
      </button>

      <button
        type="button"
        className={`btn-action btn-pass ${canPassTurn ? "is-ready" : "is-disabled"}`}
        onClick={handlePassClick}
        disabled={!canPassTurn}
      >
        <span>Pass Turn</span>
      </button>
    </div>
  );
};

export default ActionControls;
