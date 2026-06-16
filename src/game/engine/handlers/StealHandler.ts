import { ActionHandler, ActionContext } from './ActionHandler';
import { ActionResult } from '../../models/ActionResult';
import { GamePhase } from '../../models/GamePhase';
import { GameLogger } from '../GameLogger';
import { GameEventType } from '../../models/GameEvent';
import { GameRules } from '../../rules/GameRules';

export class StealHandler implements ActionHandler {
  execute(context: ActionContext): ActionResult {
    const { state, getPlayerById, checkWinner } = context;
    const { action } = state.pendingAction!;
    const actor = getPlayerById(action.actorId);
    const target = getPlayerById(action.targetId!);

    state.phase = GamePhase.ACTION_RESOLUTION;
    const amount = Math.min(target.coins, GameRules.STEAL_AMOUNT);
    target.coins -= amount;
    actor.coins += amount;

    const description = `${actor.name} roubou ${amount} moedas de ${target.name}.`;
    GameLogger.logEvent(state, GameEventType.ACTION_RESOLVED, { 
      description, 
      type: action.type, 
      actorId: actor.id, 
      targetId: target.id 
    });

    state.pendingAction = undefined;
    state.phase = GamePhase.TURN_END;
    checkWinner();

    return { success: true, message: 'Ação resolvida.', stateChanged: true };
  }
}
