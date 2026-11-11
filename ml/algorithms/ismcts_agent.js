/**
 * Information Set Monte Carlo Tree Search (ISMCTS) for Climb Card Game
 * Handles hidden cards through determinization and tree rollouts.
 */

import { ALL_CARDS, TOTAL_CARDS } from "../engine/cards.js";
import { chooseExpertMove } from "./expert_heuristic.js";

/**
 * Creates a determinized simulation where unknown cards are randomly dealt to opponents
 */
function createDeterminization(sim, rootPlayerIndex) {
  const cloned = sim.clone();
  const rootPlayer = cloned.players[rootPlayerIndex];

  // Set of cards known: root player's hand + cards played to table
  const knownIndices = new Set();
  for (const c of rootPlayer.hand) knownIndices.add(c.index);
  for (const c of cloned.playedCardsHistory) knownIndices.add(c.index);

  // Cards that are in other players' hands (unseen)
  const unseenCards = [];
  for (let i = 0; i < TOTAL_CARDS; i++) {
    if (!knownIndices.has(i)) {
      unseenCards.push(ALL_CARDS[i]);
    }
  }

  // Shuffle unseen cards
  for (let i = unseenCards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [unseenCards[i], unseenCards[j]] = [unseenCards[j], unseenCards[i]];
  }

  // Deal unseen cards to active opponents matching their exact hand sizes
  let cardPointer = 0;
  for (let i = 0; i < 4; i++) {
    if (i !== rootPlayerIndex) {
      const opp = cloned.players[i];
      const needed = opp.hand.length;
      opp.hand = unseenCards.slice(cardPointer, cardPointer + needed);
      opp.hand.sort((a, b) => a.value - b.value);
      cardPointer += needed;
    }
  }

  return cloned;
}

class ISMCTSNode {
  constructor(parent = null, action = null) {
    this.parent = parent;
    this.action = action; // action that led to this node
    this.children = [];
    this.visits = 0;
    this.totalReward = 0;
    this.actionKey = action ? (action.actionType === "pass" ? "pass" : action.cardIds.sort().join(",")) : "root";
  }

  getUCB(exploration = 1.414) {
    if (this.visits === 0) return Infinity;
    const exploitation = this.totalReward / this.visits;
    const explore = exploration * Math.sqrt(Math.log(this.parent.visits) / this.visits);
    return exploitation + explore;
  }
}

/**
 * Executes ISMCTS for the current player
 * @param {object} sim - The ClimbGameSimulation instance
 * @param {number} playerIndex - Deciding player index
 * @param {number} iterations - Number of rollout simulations (default 100)
 * @returns {object} Best legal action
 */
export function chooseISMCTSMove(sim, playerIndex, iterations = 100) {
  const legalActions = sim.getLegalActionsForCurrentPlayer();
  if (legalActions.length === 0) return null;
  if (legalActions.length === 1) return legalActions[0];

  const root = new ISMCTSNode();

  for (let iter = 0; iter < iterations; iter++) {
    // 1. Determinization
    const detSim = createDeterminization(sim, playerIndex);

    // 2. Selection
    let currentNode = root;
    const visitedNodes = [root];

    while (!detSim.isOver && currentNode.children.length > 0) {
      // Find children matching current legal actions in this determinization
      const currentLegal = detSim.getLegalActionsForCurrentPlayer();
      if (currentLegal.length === 0) break;

      const legalKeys = new Set(
        currentLegal.map((a) => (a.actionType === "pass" ? "pass" : a.cardIds.sort().join(",")))
      );

      const availableChildren = currentNode.children.filter((c) => legalKeys.has(c.actionKey));

      if (availableChildren.length < currentLegal.length) {
        // There are unexpanded actions in this node
        break;
      }

      // Select child with highest UCB
      let bestChild = availableChildren[0];
      let bestUCB = -Infinity;
      for (const child of availableChildren) {
        const ucb = child.getUCB();
        if (ucb > bestUCB) {
          bestUCB = ucb;
          bestChild = child;
        }
      }

      detSim.step(bestChild.action);
      currentNode = bestChild;
      visitedNodes.push(currentNode);
    }

    // 3. Expansion
    if (!detSim.isOver) {
      const currentLegal = detSim.getLegalActionsForCurrentPlayer();
      const existingKeys = new Set(currentNode.children.map((c) => c.actionKey));
      const unexpanded = currentLegal.filter(
        (a) => !existingKeys.has(a.actionType === "pass" ? "pass" : a.cardIds.sort().join(","))
      );

      if (unexpanded.length > 0) {
        const chosenAction = unexpanded[Math.floor(Math.random() * unexpanded.length)];
        const newNode = new ISMCTSNode(currentNode, chosenAction);
        currentNode.children.push(newNode);
        detSim.step(chosenAction);
        currentNode = newNode;
        visitedNodes.push(currentNode);
      }
    }

    // 4. Simulation / Rollout (fast heuristic play until game ends or depth limit)
    let rolloutSteps = 0;
    while (!detSim.isOver && rolloutSteps < 50) {
      rolloutSteps += 1;
      const move = chooseExpertMove(detSim, detSim.currentPlayer);
      if (!move) break;
      detSim.step(move);
    }

    // 5. Backpropagation
    const rewards = detSim.getRewards();
    const myReward = rewards[playerIndex] ?? 0;

    for (const node of visitedNodes) {
      node.visits += 1;
      node.totalReward += myReward;
    }
  }

  // Choose the root child with the highest visit count
  let bestChild = root.children[0];
  let mostVisits = -1;

  for (const child of root.children) {
    if (child.visits > mostVisits) {
      mostVisits = child.visits;
      bestChild = child;
    }
  }

  return bestChild?.action ?? legalActions[0];
}
