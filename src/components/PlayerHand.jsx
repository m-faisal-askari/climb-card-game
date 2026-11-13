import { useState } from "react";
import PlayingCard from "./PlayingCard.jsx";
import soundManager from "../game/sounds.js";

const PlayerHand = ({
  player,
  selectedCards,
  setSelectedCards,
  isYourTurn = false,
  currentTurnName = "",
  disabled = false,
}) => {
  const [hoveredCardId, setHoveredCardId] = useState(null);

  const handleCardClick = (cardId) => {
    if (disabled) return;

    setSelectedCards((prev) => {
      const isAlreadySelected = prev.includes(cardId);
      if (isAlreadySelected) {
        soundManager.playCardDeselect();
        return prev.filter((id) => id !== cardId);
      } else {
        soundManager.playCardSelect();
        return [...prev, cardId];
      }
    });
  };

  const handleHandPointerMove = (event) => {
    const { clientX, clientY, currentTarget } = event;
    let hoveredCardId = null;
    let nearestCenterDistance = Infinity;

    // A selected card can cover its neighbor's hit area. Resolve overlapping
    // cards by the closest visual center so the neighbor can rise above it.
    Array.from(currentTarget.children).forEach((wrapper) => {
      const card = wrapper.querySelector(".card");
      const bounds = card?.getBoundingClientRect();
      if (
        bounds &&
        clientX >= bounds.left &&
        clientX <= bounds.right &&
        clientY >= bounds.top &&
        clientY <= bounds.bottom
      ) {
        const centerDistance = Math.abs(
          clientX - (bounds.left + bounds.right) / 2,
        );
        if (centerDistance < nearestCenterDistance) {
          nearestCenterDistance = centerDistance;
          hoveredCardId = wrapper.dataset.cardId;
        }
      }
    });

    setHoveredCardId((current) =>
      current === hoveredCardId ? current : hoveredCardId,
    );
  };

  const handCards = player?.hand ?? [];
  const handCount = handCards.length;
  const selectedCount = selectedCards.length;

  return (
    <section
      className="player-hand-container"
      aria-label="Your Hand"
    >
      <div className="player-hand-info" aria-label="Hand status">
        <div className="player-hand-info-copy">
          <span className="player-hand-title">Your hand</span>
          <span className={`player-hand-turn ${isYourTurn ? "is-active" : ""}`}>
            {isYourTurn
              ? "Your turn"
              : currentTurnName
                ? `${currentTurnName}'s turn`
                : "Waiting"}
          </span>
        </div>
        <div className="player-hand-stats">
          <span className="player-hand-stat">
            <strong>{handCount}</strong> {handCount === 1 ? "card" : "cards"} left
          </span>
          <span className={`player-hand-stat ${selectedCount ? "has-selection" : ""}`}>
            <strong>{selectedCount}</strong> selected
          </span>
        </div>
      </div>
      <div
        className="player-hand"
        onPointerMove={handleHandPointerMove}
        style={{
          "--hand-count": handCount,
        }}
      >
        {handCards.map((card, index) => {
          const isSelected = selectedCards.includes(card.id);
          const isHovered = hoveredCardId === card.id;
          const zIndex = isHovered
            ? 30000
            : index + 1;

          return (
            <div
              className={`hand-card-wrapper ${isSelected ? "is-selected" : ""} ${isHovered ? "is-hovered" : ""}`}
              key={card.id}
              data-card-id={card.id}
              style={{
                // Selected cards rise above the hand; hovered cards rise above selected cards.
                zIndex,
              }}
              onMouseEnter={() => setHoveredCardId(card.id)}
              onMouseLeave={() =>
                setHoveredCardId((cur) => (cur === card.id ? null : cur))
              }
              onPointerEnter={() => setHoveredCardId(card.id)}
              onPointerLeave={() =>
                setHoveredCardId((cur) => (cur === card.id ? null : cur))
              }
            >
              <PlayingCard
                card={card}
                isSelected={isSelected}
                onClick={disabled ? undefined : () => handleCardClick(card.id)}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default PlayerHand;
