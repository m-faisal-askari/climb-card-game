# Climb Card Game — Machine Learning AI System

A standalone Machine Learning & Reinforcement Learning framework built specifically for the **Climb** card game (a 4-player shedding game with Jokers and complex combinations).

This ML module is completely decoupled from the production game source code (`src/` remains untouched).

---

## 1. System Architecture

```
ml/
├── engine/
│   ├── cards.js            # 56-card deck representation, rankings, & values
│   ├── rules.js            # Combination validation, Joker control, legal move generation
│   └── game_sim.js         # Ultra-fast self-play Climb simulation engine
├── features/
│   └── encoder.js          # 216-dimensional state-action feature vector encoder
├── models/
│   ├── neural_network.js   # Pure JS Deep Q-Network with Adam optimizer (zero external deps)
│   └── climb_policy_weights.json  # Trained weights checkpoint
├── algorithms/
│   ├── dqn_agent.js        # Deep Q-Learning agent with experience replay
│   ├── ismcts_agent.js     # Information Set Monte Carlo Tree Search (imperfect info)
│   └── expert_heuristic.js # Strategic baseline with card counting & voluntary passing
├── py/
│   └── model.py            # Vectorized NumPy counterpart with cross-platform weight compatibility
├── train.js                # Self-play reinforcement learning training script
├── evaluate.js             # Benchmark tournament comparing ML, Heuristic, and Baseline Greedy
└── agent.js                # Clean inference adapter for future game integration
```

---

## 2. Feature Representation (216 Dimensions)

The state-action feature encoder maps the game situation and candidate action into a normalized float vector of length 216:

| Feature Segment | Dimensions | Description |
|---|---|---|
| **My Hand** | 56 | One-hot binary indicator for all 56 cards currently in hand |
| **Rank Distribution** | 14 | Count of cards per rank (3 through 2 + Jokers), normalized / 4 |
| **Discards History** | 56 | One-hot binary indicator for cards already played onto the table |
| **Remaining Unknown Cards** | 56 | Cards in opponents' hands (neither in my hand nor discarded) |
| **Opponent Hand Sizes** | 3 | Normalized card count for opponents (`count / 14`) |
| **Opponent Status** | 3 | Binary flag indicating if each opponent has finished |
| **Current Table Context** | 10 | Empty flag, combination kind one-hot (5), count, top value, Joker flag, passes |
| **Candidate Action Features** | 18 | Pass flag, action kind one-hot (5), count, top value, remaining cards, instant win flag, 2s/Jokers retained, pair-breaking penalty, endgame defense threat flag, and boss card flag |

---

## 3. Why the ML Agent Is Significantly Smarter

| Strategy Factor | Baseline Greedy Agent (`src/game/ai.js`) | Smart ML Model (`ml/`) |
|---|---|---|
| **Passing Policy** | Only passes when 0 legal moves exist (never voluntary) | **Strategic Voluntary Passing**: passes to save 2s and Jokers for crucial tricks |
| **Card Counting** | None; has no memory of played cards | **Full Discard Memory**: detects when a card is the highest remaining card ("Boss") |
| **Endgame Defense** | Naively plays low singles even if opponent has 1 card left | **Anti-Win Blocking**: refuses to feed low cards when an opponent is down to $\le 2$ cards |
| **Hand Partitioning** | Plays any arbitrary combination matching lowest value | **Combo Preservation**: avoids breaking pairs/triples/sequences for minor singles |
| **Future Expected Payoff** | Greedy 1-ply choice | **Bellman TD Learning**: optimizes long-term finish position ($+3$ for 1st to $-3$ for 4th) |

---

## 4. Running Training & Benchmarks

### Train the ML Model (Self-Play):
```bash
node ml/train.js
```
Trains the Deep Q-Network over 300+ self-play games, updates network weights via Adam, and saves checkpoints to `ml/models/climb_policy_weights.json`.

### Run Benchmark Tournament:
```bash
node ml/evaluate.js
```
Pits the trained ML model, Expert Heuristic, Baseline Greedy, and Random agents against each other across 100+ games with rotating seat assignments.

---

## 5. Integrating with the Main Game (When Ready)

Whenever you are ready to bring the smart AI into the live React application, you only need to import `chooseSmartMove` from [`ml/agent.js`](file:///C:/Users/IT-HOME/Downloads/Projects/Program%20Files/Climb%200003/climb-card-game/ml/agent.js):

```javascript
import { chooseSmartMove } from "../../ml/agent.js";

// Inside ai.js or gameActions.js:
const smartPlay = chooseSmartMove(gameState, { mode: "dqn" });
```
No other changes to game rules or UI are required!
