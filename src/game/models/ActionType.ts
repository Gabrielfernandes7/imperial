import { CharacterType } from './Character';

export enum ActionType {
  // Public Actions
  COLETAR_IMPOSTOS_LOCAIS = 'COLETAR_IMPOSTOS_LOCAIS', // Income (+1)
  ARRECADACAO_PUBLICA = 'ARRECADACAO_PUBLICA',         // Foreign Aid (+2)
  GOLPE_DE_ESTADO = 'GOLPE_DE_ESTADO',               // Coup (-7)

  // Character Actions
  RECEBER_IMPOSTO = 'RECEBER_IMPOSTO',               // Tax (+3) - Duque
  CONSPIRACAO = 'CONSPIRACAO',                         // Assassinate (-3) - Assassino
  CONTRABANDO = 'CONTRABANDO',                         // Steal (+2/-2) - Capitão
  NEGOCIACAO = 'NEGOCIACAO',                           // Exchange - Embaixador
}

export interface GameAction {
  type: ActionType;
  name: string;
  cost: number;
  characterRequired?: CharacterType;
  isBlockable: boolean;
  isChallengeable: boolean;
}

export const ACTIONS: Record<ActionType, GameAction> = {
  [ActionType.COLETAR_IMPOSTOS_LOCAIS]: {
    type: ActionType.COLETAR_IMPOSTOS_LOCAIS,
    name: 'Coletar Impostos Locais',
    cost: 0,
    isBlockable: false,
    isChallengeable: false,
  },
  [ActionType.ARRECADACAO_PUBLICA]: {
    type: ActionType.ARRECADACAO_PUBLICA,
    name: 'Arrecadação Pública',
    cost: 0,
    isBlockable: true,
    isChallengeable: false, // In Coup, Foreign Aid is blockable but not challengeable itself (the block is challengeable)
  },
  [ActionType.GOLPE_DE_ESTADO]: {
    type: ActionType.GOLPE_DE_ESTADO,
    name: 'Golpe de Estado',
    cost: 7,
    isBlockable: false,
    isChallengeable: false,
  },
  [ActionType.RECEBER_IMPOSTO]: {
    type: ActionType.RECEBER_IMPOSTO,
    name: 'Receber Imposto',
    cost: 0,
    characterRequired: CharacterType.DUQUE,
    isBlockable: false,
    isChallengeable: true,
  },
  [ActionType.CONSPIRACAO]: {
    type: ActionType.CONSPIRACAO,
    name: 'Conspiração',
    cost: 3,
    characterRequired: CharacterType.ASSASSINO,
    isBlockable: true,
    isChallengeable: true,
  },
  [ActionType.CONTRABANDO]: {
    type: ActionType.CONTRABANDO,
    name: 'Contrabando',
    cost: 0,
    characterRequired: CharacterType.CAPITAO,
    isBlockable: true,
    isChallengeable: true,
  },
  [ActionType.NEGOCIACAO]: {
    type: ActionType.NEGOCIACAO,
    name: 'Negociação',
    cost: 0,
    characterRequired: CharacterType.EMBAIXADOR,
    isBlockable: false,
    isChallengeable: true,
  },
};
