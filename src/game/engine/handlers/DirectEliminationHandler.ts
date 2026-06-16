import { ActionHandler, ActionContext } from './ActionHandler';
import { ActionResult } from '../../models/ActionResult';
import { GamePhase } from '../../models/GamePhase';
import { GameLogger } from '../GameLogger';
import { GameEventType } from '../../models/GameEvent';
import { ACTIONS } from '../../models/ActionType';

export class DirectEliminationHandler implements ActionHandler {
  execute(context: ActionContext): ActionResult {
    const { state, getPlayerById, requestInfluenceLoss } = context;
    const { action } = state.pendingAction!;
    const actor = getPlayerById(action.actorId);
    const target = getPlayerById(action.targetId!);

    state.phase = GamePhase.ACTION_RESOLUTION;
    GameLogger.logEvent(state, GameEventType.ACTION_RESOLVED, {
      description: `${actor.name} executou ${ACTIONS[action.type].name} contra ${target.name}.`,
      type: action.type,
      actorId: actor.id,
      targetId: target.id,
    });

    requestInfluenceLoss(target.id, GamePhase.TURN_END);
    
    return { success: true, message: 'Ação resolvida.', stateChanged: true };
  }
}
