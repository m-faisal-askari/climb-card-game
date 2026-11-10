import cards from "./cards.js";

// Helper function to shuffle a deck clone
function shuffle(deck) {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Main exported function to handle fresh game logic
export default function generateAndDealDeck() {
  const shuffledDeck = shuffle(cards);

  const quarterSize = Math.ceil(shuffledDeck.length / 4);

  const hand1 = shuffledDeck.slice(0, quarterSize);
  const hand2 = shuffledDeck.slice(quarterSize, quarterSize * 2);
  const hand3 = shuffledDeck.slice(quarterSize * 2, quarterSize * 3);
  const hand4 = shuffledDeck.slice(quarterSize * 3); // Handles trailing odd cards perfectly

  return [hand1, hand2, hand3, hand4];
}
