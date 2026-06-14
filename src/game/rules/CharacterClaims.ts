import { ActionType } from '../models/ActionType';
import { CharacterType } from '../models/Character';

export const CharacterClaims: Partial<Record<ActionType, CharacterType>> = {
  [ActionType.RECEBER_IMPOSTO]: CharacterType.DUQUE,
  [ActionType.CONSPIRACAO]: CharacterType.ASSASSINO,
  [ActionType.CONTRABANDO]: CharacterType.CAPITAO,
  [ActionType.NEGOCIACAO]: CharacterType.EMBAIXADOR,
};
