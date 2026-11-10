# Climb

Climb is a four-player card-shedding game for one human player and three computer opponents. It uses a shuffled 56-card deck, turn-based plays, passes, Joker counters, and finishing rankings.

## Run locally

```sh
npm install
npm run dev
```

Use the **Play Selected** button to play the highlighted cards. Use **Pass Turn** when another player has the current play. The opening play must include 3♠. Choose **Play again** after the final standings to deal a new hand.

## Rules

Climb supports singles, same-rank pairs, three of a kind, four of a kind, and standard-card sequences of five or more consecutive ranks. Same-gender Jokers can form a pair. Joker plays require a higher Joker play of the same size to counter them. The game continues until all four players have finished.

The full local rule interpretation, including sequence and pass behavior, is in [src/docs/rules.md](src/docs/rules.md).

## Project structure

- `src/game/` contains card data, dealing, rules, state transitions, and computer-player decisions.
- `src/components/` contains the table, player areas, hand, card, controls, and results display.
- `src/docs/` contains the product model and rule documentation.

## Available commands

```sh
npm run dev
npm run lint
npm run build
npm run preview
```
