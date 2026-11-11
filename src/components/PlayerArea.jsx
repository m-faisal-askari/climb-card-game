import { memo } from "react";

const ordinal = (position) => {
  if (position % 100 >= 11 && position % 100 <= 13) return `${position}th`;
  return `${position}${({ 1: "st", 2: "nd", 3: "rd" })[position % 10] ?? "th"}`;
};

const PlayerArea = ({ player, isActive = false }) => {
  if (!player) return null;

  const isFinished = player.status === "finished";
  const cardCount = player.hand?.length ?? 0;
  const isDanger = !isFinished && cardCount <= 2;

  return (
    <div
      className={`player-area ${isActive ? "is-active" : ""} ${isFinished ? "is-finished" : ""}`}
      aria-current={isActive ? "step" : undefined}
    >
      {/* Active turn indicator pill */}
      {isActive && (
        <span className="player-turn-pill" aria-label="Current Turn">
          Turn
        </span>
      )}

      {/* Avatar with optional placement medal */}
      <div className="player-avatar-container">
        <img
          src={player.path}
          alt={player.name}
          className="player-avatar"
          loading="lazy"
          decoding="async"
          width="52"
          height="52"
        />
        {isFinished && (
          <span
            className="player-finish-badge"
            title={`Finished ${ordinal(player.finishPosition)}`}
          >
            {player.finishPosition === 1 ? "🥇" : player.finishPosition === 2 ? "🥈" : "🥉"}
          </span>
        )}
      </div>

      {/* Name */}
      <p className="player-name" title={player.name}>
        {player.name}
      </p>

      {/* Cards remaining or finish position */}
      <div className="player-status-row">
        {isFinished ? (
          <span className="player-finished-text">
            {player.finishPosition === 1 ? "Winner 🏆" : ordinal(player.finishPosition)}
          </span>
        ) : (
          <span className={`player-card-badge ${isDanger ? "danger-alert" : ""}`}>
            <span className="card-glyph" aria-hidden="true">🂠</span>
            <span>{cardCount} {cardCount === 1 ? "card" : "cards"}</span>
          </span>
        )}
      </div>
    </div>
  );
};

export default memo(PlayerArea);
