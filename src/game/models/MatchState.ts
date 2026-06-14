import { Player } from './Player';
import { Character } from './Character';
import { GamePhase } from './GamePhase';
import { PendingAction } from './PendingAction';
import { Block } from './Block';
import { GameEvent } from './GameEvent';
import { Influence } from './Influence';
import { GameConfig } from './GameMode';

export interface PrivatePeekedInfluence {
  viewerId: string;
  targetPlayerId: string;
  influence: Influence;
}

export interface MatchState {
  config: GameConfig;
  players: Player[];
  deck: Character[];
  currentPlayerIndex: number;
  phase: GamePhase;
  turnNumber: number;
  pendingAction?: PendingAction;
  pendingBlock?: Block;
  challengePasses: string[];
  blockPasses: string[];
  blockChallengePasses: string[];
  events: GameEvent[];
  winnerId?: string;
  privatePeekedInfluence?: PrivatePeekedInfluence;
  
  // New fields for manual revelation
  playerToRevealId?: string;
  nextPhaseAfterReveal?: GamePhase;
  tempExchangeCards?: Character[];
}
