/**
 * Fast Card Representations and Constants for Climb ML Engine
 * Total 56 cards: 52 standard cards + 4 Jokers
 */

export const SUITS = [
  { id: "spades", symbol: "\u2660", color: "black", index: 0 },
  { id: "hearts", symbol: "\u2665", color: "red", index: 1 },
  { id: "clubs", symbol: "\u2663", color: "black", index: 2 },
  { id: "diamonds", symbol: "\u2666", color: "red", index: 3 },
];

export const RANKS = ["3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A", "2"];

export const JOKERS = [
  { id: "BMJ", color: "black-and-white", gender: "male", name: "B&W Male Joker" },
  { id: "CMJ", color: "colored", gender: "male", name: "Colored Male Joker" },
  { id: "BFJ", color: "black-and-white", gender: "female", name: "B&W Female Joker" },
  { id: "CFJ", color: "colored", gender: "female", name: "Colored Female Joker" },
];

export const RANK_VALUES = {
  "3": 1,
  "4": 2,
  "5": 3,
  "6": 4,
  "7": 5,
  "8": 6,
  "9": 7,
  "10": 8,
  "J": 9,
  "Q": 10,
  "K": 11,
  "A": 12,
  "2": 13,
  "BMJ": 14,
  "CMJ": 15,
  "BFJ": 16,
  "CFJ": 17,
};

// Build the standard 56 card array with stable index 0..55
export const ALL_CARDS = [];
export const CARD_BY_ID = new Map();
export const CARD_INDEX_BY_ID = new Map();

let cardIdx = 0;

for (const suit of SUITS) {
  for (const rank of RANKS) {
    const card = {
      index: cardIdx,
      id: `${suit.id}-${rank}`,
      type: "standard",
      rank,
      suit,
      value: RANK_VALUES[rank],
      meta: null,
    };
    ALL_CARDS.push(card);
    CARD_BY_ID.set(card.id, card);
    CARD_INDEX_BY_ID.set(card.id, cardIdx);
    cardIdx += 1;
  }
}

for (const joker of JOKERS) {
  const card = {
    index: cardIdx,
    id: joker.id,
    type: "joker",
    rank: joker.id,
    suit: null,
    value: RANK_VALUES[joker.id],
    meta: joker,
  };
  ALL_CARDS.push(card);
  CARD_BY_ID.set(card.id, card);
  CARD_INDEX_BY_ID.set(card.id, cardIdx);
  cardIdx += 1;
}

export const TOTAL_CARDS = ALL_CARDS.length; // 56
export const CARDS_PER_PLAYER = 14;
export const SPADES_3_INDEX = CARD_INDEX_BY_ID.get("spades-3");
