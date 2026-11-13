import { useEffect, useRef, useState } from "react";
import "./App.css";
import humanAvatar from "./assets/human.webp";
import daveAvatar from "./assets/dave.webp";
import graceAvatar from "./assets/grace.webp";
import lilyAvatar from "./assets/lily.webp";
import ActionControls from "./components/ActionControls.jsx";
import GameTable from "./components/GameTable.jsx";
import HowToPlayModal from "./components/HowToPlayModal.jsx";
import PauseOverlay from "./components/PauseOverlay.jsx";
import PlayerArea from "./components/PlayerArea.jsx";
import PlayerHand from "./components/PlayerHand.jsx";
import ResultsScreen from "./components/ResultsScreen.jsx";
import { makeAIMove } from "./game/ai.js";
import createGameState from "./game/game.js";
import { getGameResults, passTurn, playCards } from "./game/gameActions.js";
import { isJokerPlay, validateFirstPlay } from "./game/gameRules.js";
import soundManager from "./game/sounds.js";

const STORAGE_KEY = "climb_saved_gamestate";

const avatarMap = {
  "player-1": humanAvatar,
  "player-2": daveAvatar,
  "player-3": graceAvatar,
  "player-4": lilyAvatar,
};

function getInitialGameState() {
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (
          parsed &&
          Array.isArray(parsed.players) &&
          parsed.players.length === 4 &&
          parsed.currentPlayerId &&
          parsed.status
        ) {
          // Re-hydrate avatar paths to match current bundler assets
          parsed.players = parsed.players.map((p) => ({
            ...p,
            path: avatarMap[p.id] || p.path,
          }));
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Could not restore saved game state:", e);
    }
  }
  return createGameState();
}

function App() {
  const [gameState, setGameState] = useState(() => getInitialGameState());
  const [isPaused, setIsPaused] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [selectedCards, setSelectedCards] = useState([]);
  const [message, setMessage] = useState("");
  const [isMuted, setIsMuted] = useState(() => soundManager.isMuted());
  const prevPlayerIdRef = useRef(gameState.currentPlayerId);

  const currentPlayer = gameState.players.find(
    (player) => player.id === gameState.currentPlayerId,
  );
  const humanPlayer = gameState.players.find((player) => player.type === "human");
  const opponents = gameState.players.filter((player) => player.type !== "human");
  const isHumanTurn = currentPlayer?.type === "human";

  // Persist gameState to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
    } catch (e) {
      console.error("Failed to save gameState to localStorage:", e);
    }
  }, [gameState]);

  // Keyboard shortcuts: Escape / P to pause, M to toggle mute, H / ? for guide
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (isGuideOpen) {
          e.preventDefault();
          soundManager.playButtonClick();
          setIsGuideOpen(false);
        } else if (gameState.status === "playing") {
          e.preventDefault();
          soundManager.playButtonClick();
          setIsPaused((prev) => !prev);
        }
      } else if (e.key === "p" || e.key === "P") {
        if (!isGuideOpen && gameState.status === "playing") {
          e.preventDefault();
          soundManager.playButtonClick();
          setIsPaused((prev) => !prev);
        }
      } else if (e.key === "h" || e.key === "H" || e.key === "?") {
        e.preventDefault();
        soundManager.playButtonClick();
        setIsGuideOpen((prev) => !prev);
      } else if (e.key === "m" || e.key === "M") {
        e.preventDefault();
        soundManager.playButtonClick();
        const nextMuted = soundManager.toggleMute();
        setIsMuted(nextMuted);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameState.status, isGuideOpen]);

  // AI turns (paused while isPaused or isGuideOpen is true)
  useEffect(() => {
    if (gameState.status !== "playing" || isPaused || isGuideOpen || currentPlayer?.type !== "computer") {
      return undefined;
    }

    const timerId = window.setTimeout(() => {
      setGameState((state) => {
        const next = makeAIMove(state);
        if (next !== state) {
          // Play card placement vs turn pass sound
          if (next.currentPlay !== state.currentPlay && next.currentPlay?.cards?.length) {
            const isJoker = isJokerPlay(next.currentPlay);
            soundManager.playCardPlacement(next.currentPlay.cards.length, isJoker);
          } else if (next.consecutivePasses > state.consecutivePasses) {
            soundManager.playTurnPass();
          }

          // Check if any player finished
          const prevFinishedCount = state.players.filter((p) => p.status === "finished").length;
          const nextFinishedCount = next.players.filter((p) => p.status === "finished").length;
          if (nextFinishedCount > prevFinishedCount && next.status !== "finished") {
            soundManager.playPlayerFinished();
          }
        }
        return next;
      });
    }, 1400);

    return () => window.clearTimeout(timerId);
  }, [
    gameState.currentPlayerId,
    gameState.status,
    gameState.turnNumber,
    currentPlayer?.type,
    isPaused,
    isGuideOpen,
  ]);

  // Alert chime when it becomes human's turn
  useEffect(() => {
    if (
      gameState.status === "playing" &&
      !isPaused &&
      !isGuideOpen &&
      isHumanTurn &&
      prevPlayerIdRef.current !== currentPlayer?.id
    ) {
      soundManager.playYourTurn();
    }
    prevPlayerIdRef.current = currentPlayer?.id;
  }, [isHumanTurn, currentPlayer?.id, gameState.status, isPaused, isGuideOpen]);

  // Victory / Game over sound
  useEffect(() => {
    if (gameState.status === "finished") {
      const results = getGameResults(gameState);
      const isWinner = results[0]?.type === "human";
      soundManager.playGameOver(isWinner);
    }
  }, [gameState]);

  const handlePlay = () => {
    if (isPaused || isGuideOpen) return;

    const nextState = playCards(gameState, selectedCards);

    if (nextState === gameState) {
      soundManager.playError();
      const selectedCardIds = new Set(selectedCards);
      const selectedHandCards = humanPlayer.hand.filter((card) =>
        selectedCardIds.has(card.id),
      );
      setMessage(
        gameState.turnNumber === 1 && !validateFirstPlay(selectedCards)
          ? "Your opening play must include the 3♠."
          : "Choose a valid combination that beats the cards on the table.",
      );
      if (selectedHandCards.length !== selectedCards.length) {
        setMessage("One or more selected cards are no longer in your hand.");
      }
      return;
    }

    const isJoker = isJokerPlay(nextState.currentPlay);
    soundManager.playCardPlacement(selectedCards.length, isJoker);

    const prevFinishedCount = gameState.players.filter((p) => p.status === "finished").length;
    const nextFinishedCount = nextState.players.filter((p) => p.status === "finished").length;
    if (nextFinishedCount > prevFinishedCount && nextState.status !== "finished") {
      soundManager.playPlayerFinished();
    }

    setGameState(nextState);
    setSelectedCards([]);
    setMessage("");
  };

  const handlePass = () => {
    if (isPaused || isGuideOpen) return;

    const nextState = passTurn(gameState);
    if (nextState === gameState) return;

    soundManager.playTurnPass();
    setGameState(nextState);
    setSelectedCards([]);
    setMessage("");
  };

  const handleRestart = () => {
    soundManager.playCardPlacement(1);
    const freshState = createGameState();
    setGameState(freshState);
    setSelectedCards([]);
    setMessage("");
    setIsPaused(false);
    setIsGuideOpen(false);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(freshState));
    } catch {
      // ignore storage failure
    }
  };

  const handleToggleSound = () => {
    soundManager.playButtonClick();
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  };

  const handleTogglePause = () => {
    soundManager.playButtonClick();
    setIsPaused((prev) => !prev);
  };

  const handleToggleGuide = () => {
    soundManager.playButtonClick();
    setIsGuideOpen((prev) => !prev);
  };

  return (
    <div className="app-shell">
      {gameState.status === "playing" && (
        <div
          className="easy-mode-indicator"
          title="All three opponents use the trained model in easy mode."
          aria-label="Easy Mode"
        >
          <span className="easy-mode-dot" aria-hidden="true" />
          <span>Easy Mode</span>
        </div>
      )}

      {/* Top Controls Bar */}
      <div className="top-controls-bar">
        {gameState.status === "playing" && (
          <button
            type="button"
            className={`top-control-btn pause-btn ${isPaused ? "is-active" : ""}`}
            onClick={handleTogglePause}
            title={isPaused ? "Resume game (P / Esc)" : "Pause game (P / Esc)"}
            aria-label={isPaused ? "Resume game" : "Pause game"}
          >
            {isPaused ? (
              <svg className="control-icon" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            ) : (
              <svg className="control-icon" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            )}
          </button>
        )}

        <button
          type="button"
          className="top-control-btn sound-btn"
          onClick={handleToggleSound}
          title={isMuted ? "Unmute sound effects (M)" : "Mute sound effects (M)"}
          aria-label={isMuted ? "Unmute sound effects" : "Mute sound effects"}
        >
          {isMuted ? (
            <svg className="control-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <line x1="23" y1="9" x2="17" y2="15" />
              <line x1="17" y1="9" x2="23" y2="15" />
            </svg>
          ) : (
            <svg className="control-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            </svg>
          )}
        </button>

        <button
          type="button"
          className={`top-control-btn guide-btn ${isGuideOpen ? "is-active" : ""}`}
          onClick={handleToggleGuide}
          title={isGuideOpen ? "Close Guide (H / Esc)" : "How to Play & Full Rules (H)"}
          aria-label={isGuideOpen ? "Close Guide" : "How to Play"}
        >
          <svg className="control-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </button>
      </div>

      {/* Pause Modal Overlay */}
      {isPaused && gameState.status === "playing" && (
        <PauseOverlay
          gameState={gameState}
          onResume={() => setIsPaused(false)}
          onRestart={handleRestart}
          isMuted={isMuted}
          onToggleSound={handleToggleSound}
          onOpenGuide={() => setIsGuideOpen(true)}
        />
      )}

      {/* How to Play Guide Modal */}
      <HowToPlayModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />

      <div className="app-content">
        {gameState.status === "finished" ? (
          <ResultsScreen results={getGameResults(gameState)} onRestart={handleRestart} />
        ) : (
          <main className="game-screen">
            {/* Top Seat: Grace (opponents[1]) */}
            <div className="seat-top">
              <PlayerArea
                player={opponents[1]}
                isActive={currentPlayer?.id === opponents[1]?.id}
              />
            </div>

            {/* Left Seat: Lily (opponents[2]) */}
            <div className="seat-left">
              <PlayerArea
                player={opponents[2]}
                isActive={currentPlayer?.id === opponents[2]?.id}
              />
            </div>

            {/* Central Game Table */}
            <div className="seat-table">
              <GameTable
                currentPlay={gameState.currentPlay}
                currentPlayer={currentPlayer}
                players={gameState.players}
                message={message}
                turnNumber={gameState.turnNumber}
                jokerControl={gameState.jokerControl}
              />
            </div>

            {/* Right Seat: Dave (opponents[0]) */}
            <div className="seat-right">
              <PlayerArea
                player={opponents[0]}
                isActive={currentPlayer?.id === opponents[0]?.id}
              />
            </div>

            {/* Action Controls */}
            <div className="seat-controls">
              <ActionControls
                onPlay={handlePlay}
                onPass={handlePass}
                disabled={!isHumanTurn || gameState.status !== "playing" || isPaused || isGuideOpen}
                canPass={Boolean(gameState.currentPlay)}
                hasSelection={selectedCards.length > 0}
              />
            </div>

            {/* Player Hand */}
            <div className="seat-hand">
              <PlayerHand
                player={humanPlayer}
                selectedCards={selectedCards}
                setSelectedCards={setSelectedCards}
                isYourTurn={isHumanTurn}
                currentTurnName={currentPlayer?.name}
                disabled={!isHumanTurn || gameState.status !== "playing" || isPaused || isGuideOpen}
              />
            </div>
          </main>
        )}
      </div>

      {/* App Footer */}
      <footer className="app-footer">
        <span className="footer-copyright">
          © {new Date().getFullYear()} <strong className="footer-brand">Askari Labs</strong>. All rights reserved.
        </span>
        <span className="footer-divider" aria-hidden="true">•</span>
        <span className="footer-developer">
          Developed by <strong className="footer-dev-name">Faisal Askari</strong>
        </span>
      </footer>
    </div>
  );
}

export default App;
