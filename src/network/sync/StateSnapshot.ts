import { Character } from '../../game/models/Character';
import { Action } from '../../game/models/Action';
import { Block } from '../../game/models/Block';
import { GameEvent } from '../../game/models/GameEvent';
import { GamePhase } from '../../game/models/GamePhase';
import { Influence } from '../../game/models/Influence';

export interface PublicInfluenceSnapshot {
  id: string;
  revealed: boolean;
  character?: Character;
}

export interface PublicPlayerSnapshot {
  id: string;
  name: string;
  coins: number;
  alive: boolean;
  influenceCount: number;
  revealedInfluenceCount: number;
  influences: PublicInfluenceSnapshot[];
}

export interface PrivatePlayerSnapshot extends PublicPlayerSnapshot {
  influences: Influence[];
}

export interface StateSnapshot {
  revision: number;
  recipientPlayerId: string;
  players: PublicPlayerSnapshot[];
  self: PrivatePlayerSnapshot;
  currentPlayerId: string;
  phase: GamePhase;
  turnNumber: number;
  pendingAction?: {
    action: Action;
    requiredCharacter?: string;
  };
  pendingBlock?: Block;
  challengePasses: string[];
  blockPasses: string[];
  blockChallengePasses: string[];
  events: GameEvent[];
  winnerId?: string;
  playerToRevealId?: string;
  exchangeCardCount?: number;
  privatePeekedInfluence?: {
    targetPlayerId: string;
    influence: Influence;
  };
}
