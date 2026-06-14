import { ActionType } from './ActionType';
import { CharacterType } from './Character';

export interface Block {
  blockerId: string;
  targetAction: ActionType;
  requiredCharacter: CharacterType;
}
