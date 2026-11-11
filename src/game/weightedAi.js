import trainedWeights from "../../ml/models/climb_policy_weights.json";
import { DQNAgent } from "../../ml/algorithms/dqn_agent.js";
import { adaptGameStateToSim } from "../../ml/state_adapter.js";

const weightedAgent = new DQNAgent({ epsilon: 0 });
weightedAgent.model.loadJSON(trainedWeights);

export function chooseWeightedAction(gameState) {
  const { sim, currentIdx } = adaptGameStateToSim(gameState);
  if (sim.isOver || currentIdx < 0) return null;

  return weightedAgent.act(sim, currentIdx, false);
}
