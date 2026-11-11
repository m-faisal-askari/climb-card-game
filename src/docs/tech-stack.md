# Climb: Tech Stack

## 1. Project Overview

Climb is a browser-based, four-player shedding card game. The first release will let one human player play locally against three computer-controlled opponents.

**Primary goals**
- Build a playable game while keeping the code understandable and maintainable.
- Separate game rules from UI rendering.
- Test important game rules independently of React.
- Keep the initial release lightweight; add online multiplayer only as a later feature.

## 2. Core Stack

| Area | Technology | Purpose |
|---|---|---|
| Language | JavaScript (ES modules) | Game rules, state transitions, UI behavior |
| UI library | React | Reusable interface components and rendering |
| Build tool / dev server | Vite | Local development and production builds |
| Styling | CSS | Table layout, cards, responsive design, animations |
| Testing | Vitest | Unit tests for deck, combinations, rules, and turns |
| Version control | Git and GitHub | Change history, backup, and portfolio repository |
| Hosting | Vercel (planned) | Deploy the browser game |

Use JavaScript, not TypeScript, for the initial version.

## 3. Initial Scope

The first release should include:
- A standard 56-card deck: 52 cards plus four distinct Jokers.
- Shuffling and dealing to four players.
- A human player's selectable hand.
- Three basic computer opponents.
- Legal-play validation.
- Turn order and passing.
- The game's special sequence and Joker rules.
- Finishing positions, game-over screen, and restart.
- Responsive desktop and mobile layouts.

The local implementation follows [the Climb rules specification](./rules.md), which records the decisions used for sequences, Jokers, passing, and finishing.

## 4. Architecture

Keep the game engine independent of React. UI components display the state and send player actions to the game logic; they should not independently decide whether a move is legal.

```text
src/
├── components/       # Presentational React components
├── game/             # Pure JavaScript game logic
├── hooks/             # React hooks, if needed
├── App.jsx
├── main.jsx
└── index.css
```

### UI layer: `src/components/`

Responsible for rendering:
- `PlayingCard`
- `PlayerHand`
- `PlayerArea`
- `GameTable`
- `ActionControls`
- `GameStatus`
- `GameOverModal`

Components should receive data through props and call callbacks for user actions. Keep game rules out of visual components.

### Game layer: `src/game/`

Add modules as they become necessary:
- `deck.js`: create, shuffle, and deal the deck.
- `combinations.js`: classify selected cards into supported play types.
- `rules.js`: validate and compare plays.
- `turns.js`: handle turn order, passes, and the next eligible lead.
- `gameState.js`: initialize the game and apply valid actions.
- `computerPlayer.js`: choose a legal move for a computer opponent.

Prefer small, testable functions. Keep state changes explicit and predictable.

## 5. State Management

Start with React's built-in state tools (`useState` and, if useful later, `useReducer`). Do not add Redux, Zustand, or another state-management library unless the project develops a concrete need.

The game state will eventually need to represent:
- Each player's hand and status.
- The current player.
- The current table play.
- The player who made the current play.
- Consecutive passes and who is eligible to lead.
- Finished players and finishing order.
- Game status, such as setup, playing, or finished.

Avoid duplicating information that can be derived from the existing state.

## 6. Card Data Model

Represent cards as JavaScript objects with stable, unique IDs. For example:

```js
{
  id: "spades-3",
  rank: "3",
  suit: "spades",
  value: 3,
  type: "standard"
}
```

Jokers should have distinct IDs and explicit types. Do not rely on a card's display text as its unique identity.

The rank values shown above are illustrative. Establish one authoritative rank mapping that matches the final rules specification, including both Jokers.

## 7. Testing Strategy

Use Vitest for game-engine unit tests. Add tests alongside each feature instead of postponing all testing until the end.

Test at least:
- A complete 56-card deck with unique IDs.
- Shuffling preserves all cards.
- Dealing distributes all cards without duplication or loss.
- The opening player is correctly identified.
- Singles and same-count combinations are classified correctly.
- Sequence validation and comparison follow the agreed rules.
- Joker behavior follows the agreed rules.
- Invalid moves do not alter the game state.
- Passing and turn progression work correctly.
- Finished players and game-over conditions are handled correctly.

Keep most rules tests independent of React and the browser UI.

## 8. Styling and Accessibility

- Use regular CSS initially; do not add a styling framework without a clear benefit.
- Use CSS variables for colors, spacing, and card dimensions.
- Design for desktop first, then adapt the layout for narrow screens.
- Ensure ranks and suits remain legible when cards overlap.
- Provide visible focus states and keyboard-accessible controls where practical.
- Do not rely on color alone to communicate turn ownership or selection.
- Respect reduced-motion preferences for animations.

## 9. Development Workflow

1. Create the Vite React project.
2. Confirm the starter app runs locally.
3. Build card data, deck creation, shuffling, and dealing.
4. Build and test the card components.
5. Implement the table and card selection.
6. Specify and implement the rules in small, testable functions.
7. Connect the UI to the game engine.
8. Add computer opponents and game completion.
9. Test edge cases and responsive layouts.
10. Build the production bundle and deploy.

Use Git commits after meaningful, working milestones. Keep changes small enough to review and debug.

## 10. Explicitly Out of Scope for Version 1

Do not add these unless the core local game is complete:
- Online multiplayer or WebSockets.
- User accounts and authentication.
- Database or cloud game storage.
- Backend API.
- Payments, ads, or analytics.
- Large UI libraries or state-management dependencies without a demonstrated need.

If online multiplayer is added later, evaluate a server-authoritative game engine and a networking solution at that point. Do not build infrastructure for a feature that Version 1 does not need.

## 11. Definition of Done

The initial release is ready when:
- A player can start and finish a complete game against three computer opponents.
- The deck and dealing are correct.
- Legal and illegal moves are handled according to the documented rules.
- Turn progression, passing, Jokers, sequences, and finishing order behave consistently.
- Automated tests cover the critical game rules.
- The interface works on desktop and mobile.
- The production build succeeds.
- The repository includes a README with instructions, rules, screenshots, and a live demo link once deployed.
