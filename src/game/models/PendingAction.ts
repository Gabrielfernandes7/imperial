import { Action } from './Action';
import { CharacterType } from './Character';

export interface PendingAction {
  action: Action;
  declaredAtTurn: number;
  requiredCharacter?: CharacterType;
  costPaid: number;
}
