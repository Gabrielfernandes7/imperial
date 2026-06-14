import { MatchState } from '../models/MatchState';
import { Action } from '../models/Action';
import { ActionType } from '../models/ActionType';
import { GamePhase } from '../models/GamePhase';
import { GameRules } from './GameRules';

export class ActionRules {
  static validate(state: MatchState, action: Action): { valid: boolean; error?: string } {
    const actor = state.players.find((p) => p.id === action.actorId);
    if (!actor) return { valid: false, error: 'Ator não encontrado.' };
    if (!actor.alive) return { valid: false, error: 'Jogador eliminado não pode realizar ações.' };
    if (state.phase !== GamePhase.TURN_START) {
      return { valid: false, error: 'Ação só pode ser declarada no início do turno.' };
    }
    if (state.players[state.currentPlayerIndex]?.id !== action.actorId) {
      return { valid: false, error: 'Não é a vez deste jogador.' };
    }

    // Mandatory Coup check
    if (actor.coins >= GameRules.FORCED_COUP_COINS && action.type !== ActionType.GOLPE_DE_ESTADO) {
      return { valid: false, error: 'Golpe de Estado é obrigatório com 10 ou mais moedas.' };
    }

    // Cost validation
    let cost = 0;
    switch (action.type) {
      case ActionType.GOLPE_DE_ESTADO: cost = GameRules.COUP_COST; break;
      case ActionType.CONSPIRACAO: cost = GameRules.ASSASSINATION_COST; break;
    }

    if (actor.coins < cost) {
      return { valid: false, error: `Moedas insuficientes. Custo: ${cost}` };
    }

    // Target validation
    if ([ActionType.GOLPE_DE_ESTADO, ActionType.CONSPIRACAO, ActionType.CONTRABANDO].includes(action.type)) {
      if (!action.targetId) return { valid: false, error: 'Ação requer um alvo.' };
      const target = state.players.find((p) => p.id === action.targetId);
      if (!target) return { valid: false, error: 'Alvo não encontrado.' };
      if (!target.alive) return { valid: false, error: 'Alvo já foi eliminado.' };
      if (target.id === actor.id) return { valid: false, error: 'Não pode ser alvo da própria ação.' };
    }

    if (action.type === ActionType.NEGOCIACAO && action.targetId) {
      if (!action.targetInfluenceId) {
        return { valid: false, error: 'Selecione qual carta oculta deseja espiar.' };
      }
      const target = state.players.find((p) => p.id === action.targetId);
      if (!target) return { valid: false, error: 'Alvo não encontrado.' };
      if (!target.alive) return { valid: false, error: 'Alvo já foi eliminado.' };
      if (target.id === actor.id) return { valid: false, error: 'Não pode espiar a si mesmo.' };

      const influence = target.influences.find((item) => item.id === action.targetInfluenceId);
      if (!influence || influence.revealed) {
        return { valid: false, error: 'A carta escolhida não está mais oculta.' };
      }
    }

    return { valid: true };
  }
}
