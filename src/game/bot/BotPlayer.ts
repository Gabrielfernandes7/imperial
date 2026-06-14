import { MatchState } from '../models/MatchState';
import { Action } from '../models/Action';
import { ActionType } from '../models/ActionType';
import { CharacterType } from '../models/Character';
import { CharacterClaims } from '../rules/CharacterClaims';
import { BlockClaims } from '../rules/BlockClaims';
import { GameRules } from '../rules/GameRules';
import { GameMode } from '../models/GameMode';

interface BotProfile {
  bluffRate: number;
  challengeBase: number;
  challengeRichBonus: number;
  taxChallengeBonus: number;
  realBlockRate: number;
  bluffBlockRate: number;
  spyRate: number;
  richTargetRate: number;
}

const BOT_PROFILES: Record<GameMode, BotProfile> = {
  [GameMode.INICIANTE]: {
    bluffRate: 0.08,
    challengeBase: 0.05,
    challengeRichBonus: 0.08,
    taxChallengeBonus: 0.03,
    realBlockRate: 0.7,
    bluffBlockRate: 0.05,
    spyRate: 0.15,
    richTargetRate: 0.45,
  },
  [GameMode.NORMAL]: {
    bluffRate: 0.2,
    challengeBase: 0.15,
    challengeRichBonus: 0.15,
    taxChallengeBonus: 0.05,
    realBlockRate: 0.9,
    bluffBlockRate: 0.15,
    spyRate: 0.4,
    richTargetRate: 0.7,
  },
  [GameMode.AVANCADO]: {
    bluffRate: 0.28,
    challengeBase: 0.25,
    challengeRichBonus: 0.2,
    taxChallengeBonus: 0.08,
    realBlockRate: 0.95,
    bluffBlockRate: 0.2,
    spyRate: 0.55,
    richTargetRate: 0.9,
  },
};

export class BotPlayer {
  static decideAction(state: MatchState, playerId: string): Action {
    const bot = state.players.find(p => p.id === playerId)!;
    const profile = this.getProfile(state);
    
    // Mandatory Coup
    if (bot.coins >= GameRules.FORCED_COUP_COINS) {
      return { type: ActionType.GOLPE_DE_ESTADO, actorId: playerId, targetId: this.selectTarget(state, playerId) };
    }

    const random = Math.random();
    const isBleffing = random > 1 - profile.bluffRate;

    const availableActions: ActionType[] = [
      ActionType.COLETAR_IMPOSTOS_LOCAIS,
      ActionType.ARRECADACAO_PUBLICA,
      ActionType.RECEBER_IMPOSTO,
      ActionType.CONTRABANDO,
      ActionType.NEGOCIACAO,
    ];

    if (bot.coins >= GameRules.ASSASSINATION_COST) {
      availableActions.push(ActionType.CONSPIRACAO);
    }
    if (bot.coins >= GameRules.COUP_COST) {
      availableActions.push(ActionType.GOLPE_DE_ESTADO);
    }

    let choices: ActionType[];
    if (!isBleffing) {
      choices = availableActions.filter(type => {
        const claim = CharacterClaims[type];
        if (!claim) return true;
        return bot.influences.some(inf => !inf.revealed && inf.character.type === claim);
      });
      if (choices.length === 0) choices = [ActionType.COLETAR_IMPOSTOS_LOCAIS, ActionType.ARRECADACAO_PUBLICA];
    } else {
      choices = availableActions.filter(type => {
        const claim = CharacterClaims[type];
        if (!claim) return false;
        return !bot.influences.some(inf => !inf.revealed && inf.character.type === claim);
      });
      // Bots avoid bluffing Assassination or Coup as much if poor
      if (bot.coins < 3) choices = choices.filter(c => c !== ActionType.CONSPIRACAO);
      if (choices.length === 0) choices = [ActionType.ARRECADACAO_PUBLICA];
    }

    const selectedType = choices[Math.floor(Math.random() * choices.length)];
    let targetId: string | undefined = undefined;
    let targetInfluenceId: string | undefined = undefined;

    if ([ActionType.GOLPE_DE_ESTADO, ActionType.CONSPIRACAO, ActionType.CONTRABANDO].includes(selectedType)) {
      targetId = this.selectTarget(state, playerId);
    } else if (selectedType === ActionType.NEGOCIACAO && Math.random() < profile.spyRate) {
      targetId = this.selectTarget(state, playerId);
      const target = state.players.find((player) => player.id === targetId);
      targetInfluenceId = target?.influences.find((influence) => !influence.revealed)?.id;
    }

    return { type: selectedType, actorId: playerId, targetId, targetInfluenceId };
  }

  static decideChallenge(state: MatchState, playerId: string): boolean {
    const pendingAction = state.pendingAction?.action;
    if (!pendingAction) return false;
    const profile = this.getProfile(state);

    const actor = state.players.find(p => p.id === pendingAction.actorId)!;
    let chance = profile.challengeBase;

    if (actor.coins >= 7) chance += profile.challengeRichBonus;
    if (pendingAction.type === ActionType.RECEBER_IMPOSTO) chance += profile.taxChallengeBonus;

    return Math.random() < chance;
  }

  static decideBlock(state: MatchState, playerId: string): CharacterType | null {
    const bot = state.players.find(p => p.id === playerId)!;
    const pendingAction = state.pendingAction?.action;
    if (!pendingAction) return null;
    const profile = this.getProfile(state);

    const possibleBlockers = BlockClaims[pendingAction.type];
    if (!possibleBlockers) return null;

    const realBlocker = possibleBlockers.find(type => 
      bot.influences.some(inf => !inf.revealed && inf.character.type === type)
    );

    if (realBlocker) {
      return Math.random() < profile.realBlockRate ? realBlocker : null;
    } else {
      if (Math.random() < profile.bluffBlockRate) {
        return possibleBlockers[Math.floor(Math.random() * possibleBlockers.length)];
      }
    }

    return null;
  }

  static decideChallengeBlock(state: MatchState, playerId: string): boolean {
    return Math.random() < this.getProfile(state).challengeBase;
  }

  private static selectTarget(state: MatchState, botId: string): string {
    const profile = this.getProfile(state);
    const targets = state.players.filter(p => p.id !== botId && p.alive);
    if (targets.length === 0) return '';
    
    // Sort by coins descending
    targets.sort((a, b) => b.coins - a.coins);
    
    if (Math.random() < profile.richTargetRate) {
      return targets[0].id;
    }
    return targets[Math.floor(Math.random() * targets.length)].id;
  }

  private static getProfile(state: MatchState): BotProfile {
    return BOT_PROFILES[state.config.mode];
  }
}
