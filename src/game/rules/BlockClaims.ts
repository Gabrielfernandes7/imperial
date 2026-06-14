import { ActionType } from '../models/ActionType';
import { CharacterType } from '../models/Character';

/**
 * Maps actions to the characters that can block them.
 * Note: Contrabando (Steal) can be blocked by both Capitão and Embaixador in Coup.
 */
export const BlockClaims: Partial<Record<ActionType, CharacterType[]>> = {
  [ActionType.ARRECADACAO_PUBLICA]: [CharacterType.DUQUE],
  [ActionType.CONTRABANDO]: [CharacterType.CAPITAO, CharacterType.EMBAIXADOR],
  [ActionType.CONSPIRACAO]: [CharacterType.CONDESSA],
};
