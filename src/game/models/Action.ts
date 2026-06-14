import { ActionType } from './ActionType';

export interface Action {
  type: ActionType;
  actorId: string;
  targetId?: string;
  targetInfluenceId?: string;
}
