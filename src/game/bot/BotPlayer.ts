import { MatchState } from '../models/MatchState';
import { Action } from '../models/Action';
import { ActionType } from '../models/ActionType';
import { CharacterType } from '../models/Character';
import { CharacterClaims } from '../rules/CharacterClaims';
import { BlockClaims } from '../rules/BlockClaims';
import { GameRules } from '../rules/GameRules';
import { GameMode } from '../models/GameMode';
import { BotPersonalityType } from '../models/BotPersonality';
import { BotIA } from './BotIA';

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

const MODE_MODIFIERS: Record<GameMode, BotProfile> = {
  [GameMode.INICIANTE]: {
    bluffRate: -0.06,
    challengeBase: -0.07,
    challengeRichBonus: -0.04,
    taxChallengeBonus: -0.02,
    realBlockRate: -0.12,
    bluffBlockRate: -0.04,
    spyRate: -0.12,
    richTargetRate: -0.12,
  },
  [GameMode.NORMAL]: {
    bluffRate: 0,
    challengeBase: 0,
    challengeRichBonus: 0,
    taxChallengeBonus: 0,
    realBlockRate: 0,
    bluffBlockRate: 0,
    spyRate: 0,
    richTargetRate: 0,
  },
  [GameMode.AVANCADO]: {
    bluffRate: 0.08,
    challengeBase: 0.08,
    challengeRichBonus: 0.05,
    taxChallengeBonus: 0.03,
    realBlockRate: 0.05,
    bluffBlockRate: 0.06,
    spyRate: 0.12,
    richTargetRate: 0.12,
  },
};

const PERSONALITY_PROFILES: Record<BotPersonalityType, BotProfile> = {
  [BotPersonalityType.CAUTELOSO]: {
    bluffRate: 0.08,
    challengeBase: 0.06,
    challengeRichBonus: 0.08,
    taxChallengeBonus: 0.02,
    realBlockRate: 0.82,
    bluffBlockRate: 0.04,
    spyRate: 0.22,
    richTargetRate: 0.45,
  },
  [BotPersonalityType.INTRIGANTE]: {
    bluffRate: 0.18,
    challengeBase: 0.12,
    challengeRichBonus: 0.12,
    taxChallengeBonus: 0.04,
    realBlockRate: 0.95,
    bluffBlockRate: 0.22,
    spyRate: 0.62,
    richTargetRate: 0.65,
  },
  [BotPersonalityType.AGRESSIVO]: {
    bluffRate: 0.3,
    challengeBase: 0.26,
    challengeRichBonus: 0.2,
    taxChallengeBonus: 0.08,
    realBlockRate: 0.86,
    bluffBlockRate: 0.16,
    spyRate: 0.34,
    richTargetRate: 0.9,
  },
};

export class BotPlayer implements BotIA {
  public decideAction(state: MatchState, playerId: string): Action {
    const bot = state.players.find(p => p.id === playerId)!;
    const profile = this.getProfileForPlayer(state, playerId);
    
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

  public decideChallenge(state: MatchState, playerId: string): boolean {
    const pendingAction = state.pendingAction?.action;
    if (!pendingAction) return false;
    const profile = this.getProfileForPlayer(state, playerId);

    const actor = state.players.find(p => p.id === pendingAction.actorId)!;
    let chance = profile.challengeBase;

    if (actor.coins >= 7) chance += profile.challengeRichBonus;
    if (pendingAction.type === ActionType.RECEBER_IMPOSTO) chance += profile.taxChallengeBonus;

    return Math.random() < chance;
  }

  public decideBlock(state: MatchState, playerId: string): CharacterType | null {
    const bot = state.players.find(p => p.id === playerId)!;
    const pendingAction = state.pendingAction?.action;
    if (!pendingAction) return null;
    const profile = this.getProfileForPlayer(state, playerId);

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

  public decideChallengeBlock(state: MatchState, playerId: string): boolean {
    return Math.random() < this.getProfileForPlayer(state, playerId).challengeBase;
  }

  private selectTarget(state: MatchState, botId: string): string {
    const profile = this.getProfileForPlayer(state, botId);
    const targets = state.players.filter(p => p.id !== botId && p.alive);
    if (targets.length === 0) return '';
    
    targets.sort((a, b) => b.coins - a.coins);
    
    if (Math.random() < profile.richTargetRate) {
      return targets[0].id;
    }
    return targets[Math.floor(Math.random() * targets.length)].id;
  }

  private getProfileForPlayer(state: MatchState, playerId: string): BotProfile {
    const bot = state.players.find((player) => player.id === playerId);
    const base = PERSONALITY_PROFILES[
      bot?.botPersonality ?? BotPersonalityType.CAUTELOSO
    ];
    const modifier = MODE_MODIFIERS[state.config.mode];

    return {
      bluffRate: clampChance(base.bluffRate + modifier.bluffRate),
      challengeBase: clampChance(base.challengeBase + modifier.challengeBase),
      challengeRichBonus: Math.max(0, base.challengeRichBonus + modifier.challengeRichBonus),
      taxChallengeBonus: Math.max(0, base.taxChallengeBonus + modifier.taxChallengeBonus),
      realBlockRate: clampChance(base.realBlockRate + modifier.realBlockRate),
      bluffBlockRate: clampChance(base.bluffBlockRate + modifier.bluffBlockRate),
      spyRate: clampChance(base.spyRate + modifier.spyRate),
      richTargetRate: clampChance(base.richTargetRate + modifier.richTargetRate),
    };
  }
}

export const botIA: BotIA = new BotPlayer();

function clampChance(value: number): number {
  return Math.max(0, Math.min(0.98, value));
}
