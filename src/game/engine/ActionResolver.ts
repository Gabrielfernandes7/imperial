import { MatchState } from '../models/MatchState';
import { ActionType } from '../models/ActionType';
import { ACTIONS } from '../models/ActionType';
import { CharacterType } from '../models/Character';
import { ActionResult } from '../models/ActionResult';
import { GamePhase } from '../models/GamePhase';
import { GameRules } from '../rules/GameRules';
import { GameLogger } from './GameLogger';
import { GameEventType } from '../models/GameEvent';
import { generateId } from '../utils/id';
import { shuffle } from '../utils/shuffle';

export class ActionResolver {
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
    const target = action.targetId ? getPlayerById(action.targetId) : undefined;

    if (!actor.alive) {
      return { success: false, message: 'Jogador eliminado.', stateChanged: false };
    }

    if (action.type === ActionType.CONSPIRACAO || action.type === ActionType.GOLPE_DE_ESTADO) {
      state.phase = GamePhase.ACTION_RESOLUTION;
      GameLogger.logEvent(state, GameEventType.ACTION_RESOLVED, {
        description: `${actor.name} executou ${ACTIONS[action.type].name} contra ${target!.name}.`,
        type: action.type,
        actorId: actor.id,
        targetId: target!.id,
      });
      requestInfluenceLoss(target!.id, GamePhase.TURN_END);
      return { success: true, message: 'Ação resolvida.', stateChanged: true };
    }

    state.phase = GamePhase.ACTION_RESOLUTION;
    let description = `${actor.name} executou ${ACTIONS[action.type].name}.`;

    switch (action.type) {
      case ActionType.COLETAR_IMPOSTOS_LOCAIS:
        actor.coins += 1;
        break;
      case ActionType.ARRECADACAO_PUBLICA:
        actor.coins += GameRules.FOREIGN_AID_AMOUNT;
        break;
      case ActionType.RECEBER_IMPOSTO:
        actor.coins += GameRules.TAX_AMOUNT;
        break;
      case ActionType.NEGOCIACAO: {
        if (!action.targetId) {
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
          const targetPlayer = getPlayerById(action.targetId);
          const hiddenInfluence = targetPlayer.influences.find(
            (inf: any) => inf.id === action.targetInfluenceId && !inf.revealed,
          );
          const peekedInfluence = { ...hiddenInfluence, character: { ...hiddenInfluence.character } };
          state.privatePeekedInfluence = {
            viewerId: actor.id,
            targetPlayerId: targetPlayer.id,
            influence: peekedInfluence,
          };
          description = `${actor.name} espiou uma carta oculta de ${targetPlayer.name}.`;
          GameLogger.logEvent(state, GameEventType.ACTION_RESOLVED, { description, type: action.type, actorId: actor.id, targetId: targetPlayer.id });
          state.pendingAction = undefined;
          state.phase = GamePhase.TURN_END;
          checkWinner();
          return { success: true, message: 'Ação resolvida.', stateChanged: true };
        }
      }
      case ActionType.CONTRABANDO: {
        const amount = Math.min(target!.coins, GameRules.STEAL_AMOUNT);
        target!.coins -= amount;
        actor.coins += amount;
        description = `${actor.name} roubou ${amount} moedas de ${target!.name}.`;
        break;
      }
    }

    GameLogger.logEvent(state, GameEventType.ACTION_RESOLVED, { description, type: action.type, actorId: actor.id, targetId: target?.id });
    state.pendingAction = undefined;
    state.phase = GamePhase.TURN_END;
    checkWinner();
    return { success: true, message: 'Ação resolvida.', stateChanged: true };
  }
}
