import { ActionHandler, ActionContext } from './ActionHandler';
import { ActionResult } from '../../models/ActionResult';
import { GamePhase } from '../../models/GamePhase';
import { GameLogger } from '../GameLogger';
import { GameEventType } from '../../models/GameEvent';
import { generateId } from '../../utils/id';

export class ExchangeHandler implements ActionHandler {
  execute(context: ActionContext): ActionResult {
    const { state, getPlayerById, checkWinner } = context;
    const { action } = state.pendingAction!;
    const actor = getPlayerById(action.actorId);

    if (!action.targetId) {
      // Logic for Draw & Exchange
      const cardsDrawn = [state.deck.pop()].filter(Boolean) as any[];
      cardsDrawn.forEach((character) => {
        actor.influences.push({ id: generateId(), character, revealed: false });
      });
      state.phase = GamePhase.SELECTING_CARDS_TO_EXCHANGE;
      GameLogger.logEvent(state, GameEventType.ACTION_RESOLVED, {
        description: `${actor.name} escolhendo 1 carta para trocar.`,
        type: action.type,
        actorId: actor.id,
      });
      return { success: true, message: 'Escolha a carta.', stateChanged: true };
    } else {
      // Logic for Peek (Diplomat variant in some rules or specific implementation)
      const targetPlayer = getPlayerById(action.targetId);
      if (!targetPlayer) {
        return { success: false, message: 'Alvo não encontrado.', stateChanged: false };
      }

      const hiddenInfluence = targetPlayer.influences.find(
        (inf: any) => inf.id === action.targetInfluenceId && !inf.revealed,
      );

      if (!hiddenInfluence || !hiddenInfluence.character) {
        return { success: false, message: 'Influência inválida ou já revelada.', stateChanged: false };
      }

      const peekedInfluence = { ...hiddenInfluence, character: { ...hiddenInfluence.character } };
      state.privatePeekedInfluence = {
        viewerId: actor.id,
        targetPlayerId: targetPlayer.id,
        influence: peekedInfluence,
      };

      const description = `${actor.name} espiou uma carta oculta de ${targetPlayer.name}.`;
      GameLogger.logEvent(state, GameEventType.ACTION_RESOLVED, { 
        description, 
        type: action.type, 
        actorId: actor.id, 
        targetId: targetPlayer.id 
      });

      state.pendingAction = undefined;
      state.phase = GamePhase.TURN_END;
      checkWinner();
      return { success: true, message: 'Ação resolvida.', stateChanged: true, peekedInfluence: peekedInfluence };
    }
  }
}
