import { useState } from "react";
import PlayingCard from "./PlayingCard.jsx";
import soundManager from "../game/sounds.js";

const PlayerHand = ({
  player,
  selectedCards,
  setSelectedCards,
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

  const handCards = player?.hand ?? [];
  const handCount = handCards.length;

  return (
    <section
      className="player-hand-container"
      aria-label="Your Hand"
    >
      <div
        className="player-hand"
        style={{
          "--hand-count": handCount,
        }}
      >
        {handCards.map((card, index) => {
          const isSelected = selectedCards.includes(card.id);
          const isHovered = hoveredCardId === card.id;

          // When a card behind or next to a selected card is hovered,
          // it pops forward (z-index 60) so it hovers in front and can be selected too!
          const dynamicZIndex = isHovered
            ? isSelected
              ? 65
              : 60
            : isSelected
              ? 40 + index
              : index + 1;

          return (
            <div
              className={`hand-card-wrapper ${isSelected ? "is-selected" : ""} ${isHovered ? "is-hovered" : ""}`}
              key={card.id}
              style={{
                zIndex: dynamicZIndex,
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
