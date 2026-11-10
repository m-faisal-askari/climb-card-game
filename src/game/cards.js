const suits = [
  { id: "spades", symbol: "\u2660", color: "black" },
  { id: "hearts", symbol: "\u2665", color: "red" },
  { id: "clubs", symbol: "\u2663", color: "black" },
  { id: "diamonds", symbol: "\u2666", color: "red" },
];

const ranks = ["3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A", "2"];

const jokers = [
  { id: "BMJ", color: "black-and-white", gender: "male" },
  { id: "CMJ", color: "colored", gender: "male" },
  { id: "BFJ", color: "black-and-white", gender: "female" },
  { id: "CFJ", color: "colored", gender: "female" },
];

const rankValues = {
  3: 1,
  4: 2,
  5: 3,
  6: 4,
  7: 5,
  8: 6,
  9: 7,
  10: 8,
  J: 9,
  Q: 10,
  K: 11,
  A: 12,
  2: 13,
  BMJ: 14,
  CMJ: 15,
  BFJ: 16,
  CFJ: 17,
};

const jokerCards = jokers.map((joker) => ({
  id: joker.id,
  type: "joker",
  rank: joker.id,
  suit: null,
  value: rankValues[joker.id],
  meta: joker,
}));

const cards = [
  ...suits.flatMap((suit) =>
    ranks.map((rank) => ({
      id: `${suit.id}-${rank}`,
      type: "standard",
      rank,
      suit,
      value: rankValues[rank],
      meta: null,
    })),
  ),
  ...jokerCards,
];

export default cards;
