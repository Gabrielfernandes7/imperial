import { MatchState } from '../models/MatchState';
import { ActionType } from '../models/ActionType';
import { ActionResult } from '../models/ActionResult';
import { GamePhase } from '../models/GamePhase';
import { ActionHandler, ActionContext } from './handlers/ActionHandler';
import { SimpleActionHandler } from './handlers/SimpleActionHandler';
import { DirectEliminationHandler } from './handlers/DirectEliminationHandler';
import { StealHandler } from './handlers/StealHandler';
import { ExchangeHandler } from './handlers/ExchangeHandler';

export class ActionResolver {
  private static readonly handlers: Record<ActionType, ActionHandler> = {
    [ActionType.COLETAR_IMPOSTOS_LOCAIS]: new SimpleActionHandler(),
    [ActionType.ARRECADACAO_PUBLICA]: new SimpleActionHandler(),
    [ActionType.RECEBER_IMPOSTO]: new SimpleActionHandler(),
    [ActionType.GOLPE_DE_ESTADO]: new DirectEliminationHandler(),
    [ActionType.CONSPIRACAO]: new DirectEliminationHandler(),
    [ActionType.CONTRABANDO]: new StealHandler(),
    [ActionType.NEGOCIACAO]: new ExchangeHandler(),
  };

  public static resolve(
    state: MatchState,
    getPlayerById: (id: string) => any,
    requestInfluenceLoss: (playerId: string, nextPhase: GamePhase) => void,
    checkWinner: () => void
  ): ActionResult {
    if (state.phase !== GamePhase.ACTION_DECLARED || !state.pendingAction) {
      return { success: false, message: 'Ação ainda não pronta.', stateChanged: false };
    }

    const { action } = state.pendingAction;
    const actor = getPlayerById(action.actorId);

    if (!actor.alive) {
      return { success: false, message: 'Jogador eliminado.', stateChanged: false };
    }

    const handler = this.handlers[action.type];
    
    if (!handler) {
      return { success: false, message: `Ação ${action.type} não suportada.`, stateChanged: false };
    }

    const context: ActionContext = {
      state,
      getPlayerById,
      requestInfluenceLoss,
      checkWinner,
    };

    return handler.execute(context);
  }
}
