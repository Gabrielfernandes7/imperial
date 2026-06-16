import { MatchState } from '../../models/MatchState';
import { ActionResult } from '../../models/ActionResult';
import { GamePhase } from '../../models/GamePhase';

export interface ActionContext {
  state: MatchState;
  getPlayerById: (id: string) => any;
  requestInfluenceLoss: (playerId: string, nextPhase: GamePhase) => void;
  checkWinner: () => void;
}

export interface ActionHandler {
  execute(context: ActionContext): ActionResult;
}
