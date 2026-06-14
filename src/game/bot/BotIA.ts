import { MatchState } from '../models/MatchState';
import { Action } from '../models/Action';
import { CharacterType } from '../models/Character';

export interface BotIA {
  decideAction(state: MatchState, playerId: string): Action;
  decideChallenge(state: MatchState, playerId: string): boolean;
  decideBlock(state: MatchState, playerId: string): CharacterType | null;
  decideChallengeBlock(state: MatchState, playerId: string): boolean;
}
