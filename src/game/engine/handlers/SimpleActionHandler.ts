import { ActionHandler, ActionContext } from './ActionHandler';
import { ActionResult } from '../../models/ActionResult';
import { GamePhase } from '../../models/GamePhase';
import { GameLogger } from '../GameLogger';
import { GameEventType } from '../../models/GameEvent';
import { ACTIONS } from '../../models/ActionType';

export class SimpleActionHandler implements ActionHandler {
  execute(context: ActionContext): ActionResult {
    const { state, getPlayerById, checkWinner } = context;
    const { action } = state.pendingAction!;
    const actor = getPlayerById(action.actorId);

    state.phase = GamePhase.ACTION_RESOLUTION;
    let description = `${actor.name} executou ${ACTIONS[action.type].name}.`;

    switch (action.type) {
      case 'COLETAR_IMPOSTOS_LOCAIS':
        actor.coins += 1;
        break;
      case 'ARRECADACAO_PUBLICA':
        actor.coins += 2; // Fixed value from GameRules
        break;
      case 'RECEBER_IMPOSTO':
        actor.coins += 3; // Fixed value from GameRules
        break;
    }

    GameLogger.logEvent(state, GameEventType.ACTION_RESOLVED, { 
      description, 
      type: action.type, 
      actorId: actor.id 
    });

    state.pendingAction = undefined;
    state.phase = GamePhase.TURN_END;
    checkWinner();

    return { success: true, message: 'Ação resolvida.', stateChanged: true };
  }
}
