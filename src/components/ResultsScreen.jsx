import soundManager from "../game/sounds.js";

const ordinal = (position) => {
  if (position % 100 >= 11 && position % 100 <= 13) return `${position}th`;
  return `${position}${({ 1: "st", 2: "nd", 3: "rd" })[position % 10] ?? "th"}`;
};

const medalIcons = {
  1: "🥇",
  2: "🥈",
  3: "🥉",
  4: "4th",
};

const ResultsScreen = ({ results, onRestart }) => {
  const winner = results[0];
  const isHumanWinner = winner?.type === "human";

  const handleRestartClick = () => {
    soundManager.playButtonClick();
    onRestart();
  };

  return (
    <main className="results-screen">
      <section className="results-card">
        <div className="results-header">
          <span className="results-kicker">Game Complete</span>
          <h1 className="results-title">
            {winner?.name ? `${winner.name} Wins!` : "Final Standings"}
          </h1>
          <p className="results-subtitle">
            {isHumanWinner
              ? "Congratulations on the victory!"
              : `${winner?.name ?? "Opponent"} emptied their hand first.`}
          </p>
        </div>

        <ol className="results-list">
          {results.map((player) => (
            <li
              className={`results-item ${player.position === 1 ? "is-winner" : ""}`}
              key={player.id}
            >
              <span className="results-position">
                {medalIcons[player.position] ?? ordinal(player.position)}
              </span>
              <img
                src={player.path}
                alt=""
                className="results-avatar"
              />
              <span className="results-name">{player.name}</span>
              {player.position === 1 && (
                <span className="results-winner-tag">Champion</span>
              )}
            </li>
          ))}
        </ol>

        <button
          type="button"
          className="btn-action btn-play is-ready results-cta"
          onClick={handleRestartClick}
        >
          Play Again
        </button>
      </section>
    </main>
  );
};

export default ResultsScreen;
