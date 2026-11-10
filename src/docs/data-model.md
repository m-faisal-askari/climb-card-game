# Climb — Data Model

## 1. Purpose

This document defines the data structures used by Climb, a four-player card-shedding game built with React, Vite, and JavaScript.

It is the reference for how the application represents cards, players, plays, and game state. The model should support the agreed game rules without embedding those rules inside UI components.

**Design principles**
- Use plain JavaScript objects and arrays.
- Give every physical card a stable, unique ID.
- Keep game state separate from React presentation details.
- Keep rule decisions in game-logic functions, not in the data objects themselves.
- Make state transitions predictable and testable.
- Mark unresolved rules as decisions to confirm, rather than inventing behavior.

## 2. Core Entities

Climb's main entities are:
1. **Card** — one physical card in the 56-card deck.
2. **Player** — a human player or a computer-controlled opponent.
3. **Play** — a set of cards submitted together as one move.
4. **Game State** — the current state of a single game.
5. **Turn State** — information used to determine whose turn it is and what can happen next.
6. **Game Result** — finishing positions once players finish.

These are conceptual entities. They do not all need separate JavaScript classes. Plain objects and pure functions are sufficient.

## 3. Card

A card represents one physical card in the deck.

### Standard card

```js
{
  id: "spades-3",
  type: "standard",
  rank: "3",
  suit: { id: "spades", symbol: "♠", color: "black" },
  value: 3
}
```

### Joker

```js
{
  id: "joker-black-white",
  type: "joker",
  rank: "BMJ",
  suit: null,
  value: 14,
  meta: { color: "black-and-white", gender: "male" }
}
```

The four Joker IDs are `BMJ`, `CMJ`, `BFJ`, and `CFJ`, with distinct values from 14 to 17.

### Fields

| Field | Type | Purpose |
|---|---|---|
| `id` | string | Unique identity of this physical card |
| `type` | string | `"standard"` or `"joker"` |
| `rank` | string | Rank label, or Joker identifier |
| `suit` | object or `null` | Suit ID, display symbol, and color for standard cards; `null` for Jokers |
| `value` | number | Numeric comparison value defined by the game's rank mapping |
| `meta` | object or `null` | Joker gender and artwork color; `null` for standard cards |

### Card rules
- The deck contains 52 standard cards and four distinct Jokers.
- Each card ID must be unique.
- Do not use a card's display label as its identity.
- Card values must come from one central rank mapping, not from repeated hardcoded comparisons throughout the code.
- Standard ranks use values 1–13 from 3 through 2. Jokers use values 14–17 in the order BMJ, CMJ, BFJ, CFJ.
- Selection state stays in the UI and is never stored inside a card object.

## 4. Player

A player represents one participant in the current game.

```js
{
  id: "player-1",
  name: "You",
  type: "human",
  hand: [],
  status: "active",
  finishPosition: null
}
```

### Fields

| Field | Type | Purpose |
|---|---|---|
| `id` | string | Stable player identity |
| `name` | string | Name shown in the interface |
| `type` | string | `"human"` or `"computer"` |
| `hand` | Card array | Cards currently held by the player |
| `status` | string | `"active"` or `"finished"` |
| `finishPosition` | number or `null` | Position achieved when the player finishes |

### Player rules
- Version 1 has four players: one human and three computer opponents.
- A player's hand contains card objects, not just display strings.
- When a card is played legally, remove those exact card IDs from the player's hand.
- `finishPosition` remains `null` until the player finishes.
- The model should not store a separate `cardsRemaining` field unless needed for a specific reason; it can be derived from `hand.length`.
- Turn eligibility should be derived from game state and player status rather than inferred from UI styling.

## 5. Play

A play represents the cards a player submits together in one move.

```js
{
  playerId: "player-1",
  cards: [],
  kind: "single",
  playedAtTurn: 1
}
```

`cards` is an array of Card objects. `kind` is determined by the combination-classification function, not trusted blindly from the UI.

### Suggested play kinds

The exact set depends on the confirmed rules. The initial model may support:
- `"single"`
- `"pair"`
- `"triple"`
- `"sequence"`
- `"joker"`

Do not add unsupported combinations simply because another card game has them.

### Play validation

A rule function should inspect the selected cards and current table state and return a structured result. For example:

```js
{
  valid: false,
  reason: "wrong-card-count",
  message: "Play the same number of cards as the current play."
}
```

A successful validation can return:

```js
{
  valid: true,
  reason: null,
  message: null,
  kind: "pair"
}
```

These examples describe a result shape, not the complete rule implementation. The exact reason codes can evolve as the rule engine is built.

## 6. Game State

The game state is the authoritative snapshot of one active game.

```js
{
  players: [],
  currentPlayerId: "player-1",
  currentPlay: null,
  lastPlayerToPlayId: null,
  consecutivePasses: 0,
  jokerControl: false,
  status: "playing",
  turnNumber: 1,
  results: []
}
```

### Fields

| Field | Type | Purpose |
|---|---|---|
| `players` | Player array | All four players and their current hands/statuses |
| `currentPlayerId` | string | ID of the player whose turn is active |
| `currentPlay` | Play or `null` | Current play on the table |
| `lastPlayerToPlayId` | string or `null` | Player who made the current play |
| `consecutivePasses` | number | Number of consecutive passes in the current response cycle |
| `jokerControl` | boolean | Whether the current Joker play can only be answered by a higher Joker play |
| `status` | string | `"setup"`, `"playing"`, or `"finished"` |
| `turnNumber` | number | Monotonically increasing turn counter for debugging and logs |
| `results` | array | Players' finishing positions, as they become available |

### Important invariants
- There are four player records in Version 1.
- Every physical card belongs to exactly one location: a player's hand or the current play/history area, depending on the final history design.
- A card cannot appear in two hands at once.
- `currentPlayerId` must identify an active player while the game is in progress.
- A finished player must not be selected for another turn.
- Invalid actions must not partially mutate the game state.
- A finished game must not accept ordinary play actions.
- Derived information should not be stored redundantly unless there is a clear reason.

**Card-location note:** Once a card is played, it is removed from the player's hand. The current play keeps a reference to the played card data for display and rule comparisons. If the game later needs a full play history, store past plays separately rather than treating them as cards still in players' hands.

## 7. Game Result

A result records a player's finishing position.

```js
{
  playerId: "player-2",
  position: 1
}
```

The `results` array is ordered by finishing position. The game ends after all players finish.

## 8. UI State Is Separate

Do not put temporary presentation state into the authoritative game state.

Examples of UI-only state:
- Selected card IDs.
- Whether a settings or rules modal is open.
- Current sort mode.
- Hovered card.
- Animation progress.
- Temporary toast message.

For example, React can track selection as an array of card IDs:

```js
const [selectedCardIds, setSelectedCardIds] = useState([]);
```

When the player chooses Play, look up those IDs in the player's current hand and ask the game engine to validate the move. The UI should not decide legality by itself.

## 9. Recommended Module Responsibilities

```text
src/
├── game/
│   ├── cards.js          # Standard cards, Jokers, and rank values
│   ├── deck.js           # Shuffle and deal cards
│   ├── players.js        # Create players and sort their hands
│   ├── game.js           # Initialize a game state
│   ├── gameRules.js      # Classify and validate plays
│   ├── gameActions.js    # Apply plays, passes, and finishing
│   └── ai.js             # Choose computer-player moves
└── components/           # React presentation components
```

Create these files gradually as their functionality is implemented; do not create empty files merely to match the diagram.

## 10. State Transition Contract

Game logic should expose functions that accept the current state and an action, then return a new state or a clear validation error.

Conceptually:

```js
const result = playCards(gameState, playerId, selectedCardIds);

if (result.ok) {
  setGameState(result.state);
} else {
  setErrorMessage(result.message);
}
```

This is a conceptual interface, not a requirement to use these exact function names or fields.

Prefer returning a new state over mutating the existing state directly. This works well with React and makes behavior easier to test.

Possible actions include:
- Start a game.
- Play selected cards.
- Pass.
- Sort a hand (UI preference, not a game action).
- Restart the game.

The game engine must verify that the acting player is allowed to perform the action.

## 11. Implemented local rule decisions

The local version's playable rules are specified in [rules.md](./rules.md). That file resolves sequence comparison and wrapping, Joker control, pass resolution after players finish, and the game-end condition. Update the rule specification before changing these behaviors in the engine.

## 12. Definition of Done

The data model is ready for implementation when:
- Every card has a unique ID and consistent rank/suit representation.
- The four players can be represented without UI-specific fields.
- A play can represent any combination supported by the confirmed rules.
- Game state can represent turns, passes, the current play, and finished players.
- Temporary UI state is separate from game state.
- The implemented rules are documented and consistent with the game engine.
- The model can be tested with plain JavaScript, without rendering React components.
