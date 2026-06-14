import { Character } from './Character';

export interface Influence {
  id: string;
  character: Character;
  revealed: boolean;
}
