# Climb: complete game-logic build plan

Follow this in order. Each step gives you the function to build, what it must do, and how to test it. You should be able to work through the plan without needing to ask what comes next.

Implementation rule: finish and test one function before moving to the next. Keep game logic in `gameActions.js` and `gameRules.js`. Keep React components responsible for displaying state and collecting user input, not enforcing game rules.

One important correction before we start: your current state has both `currentPlay` and `previousPlay`. For the rules you've described, `currentPlay` should be the play currently on the table and the play that the next player must beat. You don't need `previousPlay` for that. Your `playCards()` should validate against `gameState.currentPlay`, not `gameState.previousPlay`. Otherwise, a player could incorrectly play without beating the play currently on the table.

I'd simplify the state by removing `previousPlay` unless you have another specific use for it.

## Phase 1: Core rules

Current phase

| Step | Function                                          | File           | Responsibility                                                             |
| ---- | ------------------------------------------------- | -------------- | -------------------------------------------------------------------------- |
| 1    | `getCombinationType(cards)`                       | `gameRules.js` | Identify single, double, triple or four of a kind.                         |
| 2    | `validateFirstPlay(cardIds)`                      | `gameRules.js` | Ensure the opening play includes 3♠.                                       |
| 3    | `canBeatPreviousPlay(previous, next)`             | `gameRules.js` | Check that the new play has the same combination type and higher strength. |
| 4    | `validatePlay(newPlay, currentPlay, isFirstPlay)` | `gameRules.js` | Combine the rules and decide whether a play is valid.                      |

Tests before proceeding:

- One card is a single.
- Two cards of the same rank are a double.
- Three cards of the same rank are a triple.
- Four cards of the same rank are four of a kind.
- Different ranks cannot form these combinations.
- A Joker cannot pair with a standard card.
- Two Jokers form a valid pair only when they have the same gender.
- The first play must contain 3♠.
- A player cannot beat a double with a triple.

## Phase 2: Turn management

| Step | Function                                | File             | Responsibility                                                                                |
| ---- | --------------------------------------- | ---------------- | --------------------------------------------------------------------------------------------- |
| 5    | `getNextPlayerId(gameState)`            | `gameActions.js` | Find the next active player in turn order.                                                    |
| 6    | `getPlayerById(gameState, playerId)`    | `gameActions.js` | Retrieve a player by ID.                                                                      |
| 7    | `playCards(gameState, selectedCardIds)` | `gameActions.js` | Validate a play, remove cards from the hand and update the table.                             |
| 8    | `passTurn(gameState)`                   | `gameActions.js` | Register a pass and advance the turn.                                                         |
| 9    | `resolveTrick(gameState)`               | `gameActions.js` | After three consecutive passes, clear the table and give the last successful player the lead. |

Important rule for `passTurn()`:

In a four-player game, three consecutive passes after a successful play mean the other three players have declined to beat it.

The player who made the last successful play leads the next trick.

For this, `lastPlayerToPlayId` is the important property. You don't need `leadPlayerId` to represent the same information.

Tests before proceeding:

- Turns advance Player 1 → 2 → 3 → 4 → 1.
- Inactive players are skipped.
- A player cannot pass when there is no play to respond to.
- One or two passes do not clear the table.
- Three passes resolve the trick.
- The last player to play receives the next lead.

## Phase 3: Player completion and game ending

| Step | Function                            | File             | Responsibility                                       |
| ---- | ----------------------------------- | ---------------- | ---------------------------------------------------- |
| 10   | `hasPlayerFinished(player)`         | `gameRules.js`   | Check whether a player's hand is empty.              |
| 11   | `finishPlayer(gameState, playerId)` | `gameActions.js` | Mark a player as finished and record their position. |
| 12   | `checkGameOver(gameState)`          | `gameRules.js`   | Determine whether the game has ended.                |
| 13   | `getGameResults(gameState)`         | `gameActions.js` | Return the final player rankings.                    |

Tests before proceeding:

- A player who plays their final card is marked finished.
- Finished players cannot take another turn.
- Turn management skips finished players.
- Results preserve the order in which players finished.
- The game ends when the required number of players have finished, according to the final ranking rules you choose.

One decision to settle before implementing Step 12: do you want the game to stop when the first player finishes, or continue until all players have finished? I recommend continuing to establish full rankings.

## Phase 4: Joker mechanics

Do this after ordinary plays and passing work reliably. Joker rules add another layer of state management.

| Step | Function                                   | File             | Responsibility                                                                 |
| ---- | ------------------------------------------ | ---------------- | ------------------------------------------------------------------------------ |
| 14   | `isJokerPlay(play)`                        | `gameRules.js`   | Identify a single or double Joker play.                                        |
| 15   | `canCounterJoker(currentPlay, newPlay)`    | `gameRules.js`   | Check whether a higher Joker play can counter the current one.                 |
| 16   | `activateJokerControl(gameState)`          | `gameActions.js` | Enter Joker-control mode after a Joker play.                                   |
| 17   | `handleJokerPass(gameState)`               | `gameActions.js` | Count passes during Joker control.                                             |
| 18   | `counterJoker(gameState, selectedCardIds)` | `gameActions.js` | Validate and apply a higher Joker counter.                                     |
| 19   | `resolveJokerControl(gameState)`           | `gameActions.js` | Give the last successful Joker player the lead after three other players pass. |

Your established Joker order is:

| Joker                  | Value |
| ---------------------- | ----- |
| Black-and-white male   | 14    |
| Colored male           | 15    |
| Black-and-white female | 16    |
| Colored female         | 17    |

For double Jokers, the counter must also be a double Joker play. Don't allow a single Joker to counter a double Joker.

The Joker player doesn't automatically win. The normal turn order continues, with players either passing or countering.

## Phase 5: AI opponents

Only begin this once the human player can complete a full game using the rules above.

| Step | Function                        | File    | Responsibility                             |
| ---- | ------------------------------- | ------- | ------------------------------------------ |
| 20   | `getPlayableCombinations(hand)` | `ai.js` | Generate possible legal combinations.      |
| 21   | `choosePlay(gameState, player)` | `ai.js` | Select a play that beats the current play. |
| 22   | `shouldPass(gameState, player)` | `ai.js` | Decide whether passing is preferable.      |
| 23   | `makeAIMove(gameState)`         | `ai.js` | Execute the selected AI action.            |

Start with a basic AI, not an advanced opponent. It should:

- Play the lowest valid combination when possible.
- Pass when it cannot beat the current play.
- Respect Joker restrictions.
- Never play cards it doesn't hold.

You can improve its strategy later.

## Phase 6: React integration

| Step | Function / task      | Location         | Responsibility                                     |
| ---- | -------------------- | ---------------- | -------------------------------------------------- |
| 24   | `handlePlay()`       | `App.jsx`        | Call `playCards()` and update React state.         |
| 25   | `handlePass()`       | `App.jsx`        | Call `passTurn()` and update React state.          |
| 26   | Selection validation | `PlayerHand.jsx` | Prevent invalid card selections where appropriate. |
| 27   | Current-play display | `GameTable.jsx`  | Display the cards currently on the table.          |
| 28   | Turn indicator       | `PlayerArea.jsx` | Show whose turn it is.                             |
| 29   | Game status display  | UI components    | Show playing, finished and game-over states.       |
| 30   | Results screen       | New component    | Display final rankings and restart option.         |

For React state updates, use the returned state:

```
setGameState((currentState) =>
  playCards(currentState, selectedCards)
);
```

Don't mutate `gameState` directly.

## Phase 7: Testing and polish

| Step | Task                                                                      |
| ---- | ------------------------------------------------------------------------- |
| 31   | Test all combinations and invalid plays.                                  |
| 32   | Test complete four-player turn cycles.                                    |
| 33   | Test passing and trick resolution.                                        |
| 34   | Test Joker counters and Joker-control resolution.                         |
| 35   | Test players finishing in different orders.                               |
| 36   | Test restarting a game with a newly shuffled deck.                        |
| 37   | Test edge cases such as a player finishing while others still have cards. |
| 38   | Add animations, card transitions and sound effects.                       |

## Recommended project structure

```
src/
├── components/
│   ├── PlayerArea.jsx
│   ├── PlayerHand.jsx
│   ├── PlayingCard.jsx
│   ├── GameTable.jsx
│   ├── ActionControls.jsx
│   └── ResultsScreen.jsx
│
├── game/
│   ├── cards.js
│   ├── deck.js
│   ├── players.js
│   ├── game.js
│   ├── gameRules.js
│   ├── gameActions.js
│   └── ai.js
│
├── App.jsx
└── App.css
```

## Your working checklist

Climb development progress

# 0/16

- [ ] Complete and test combination validation

- [ ] Complete first-play validation

- [ ] Complete play comparison

- [ ] Complete overall play validation

- [ ] Implement next-player selection

- [ ] Implement player lookup

- [ ] Complete playCards

- [ ] Complete passTurn

- [ ] Complete trick resolution

- [ ] Implement player finishing

- [ ] Implement game-over detection and results

- [ ] Implement Joker control

- [ ] Implement AI decisions

- [ ] Connect all actions to React

- [ ] Test full games and edge cases

- [ ] Polish animations and presentation

## One architectural warning

Don't build all 38 steps as one giant file. Keep the rules pure wherever possible: a rule function receives data and returns a result, without modifying game state. Action functions receive the game state and return an updated state. This separation will make debugging much easier.

Your immediate next task is Step 1: finish `getCombinationType(cards)` and test it. Don't start AI, animations, or advanced strategy until the ordinary game loop works.

One correction to the earlier `passTurn()` implementation: when three players pass, set `currentPlayerId` to `lastPlayerToPlayId`. Do not use `leadPlayerId` as a separate source of truth if both fields represent the same player.

I'll use this plan as the reference point when we continue building Climb. We can work through it one function at a time, with implementation, testing, and review before moving forward.