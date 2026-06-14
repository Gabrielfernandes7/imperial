import { Action } from '../../game/models/Action';
import { CharacterType } from '../../game/models/Character';
import { ClientMessageType, MessageEnvelope } from './MessageTypes';

export type GameCommand =
  | { type: 'DECLARE_ACTION'; action: Action }
  | { type: 'PASS_CHALLENGE' }
  | { type: 'CHALLENGE' }
  | { type: 'DECLARE_BLOCK'; characterType: CharacterType }
  | { type: 'PASS_BLOCK' }
  | { type: 'CHALLENGE_BLOCK' }
  | { type: 'PASS_BLOCK_CHALLENGE' }
  | { type: 'RESOLVE_ACTION' }
  | { type: 'REVEAL_INFLUENCE'; influenceId: string }
  | { type: 'EXCHANGE_CARDS'; influenceIds: string[] }
  | { type: 'END_TURN' };

export type DiscoverMessage = MessageEnvelope<ClientMessageType.DISCOVER, Record<string, never>>;
export type JoinMessage = MessageEnvelope<
  ClientMessageType.JOIN,
  { clientId: string; playerName: string }
>;
export type SetReadyMessage = MessageEnvelope<
  ClientMessageType.SET_READY,
  { ready: boolean }
>;
export type StartMatchMessage = MessageEnvelope<
  ClientMessageType.START_MATCH,
  Record<string, never>
>;
export type GameCommandMessage = MessageEnvelope<
  ClientMessageType.GAME_COMMAND,
  { command: GameCommand }
>;
export type LeaveMessage = MessageEnvelope<ClientMessageType.LEAVE, Record<string, never>>;
export type PingMessage = MessageEnvelope<ClientMessageType.PING, { sentAt: number }>;

export type ClientMessage =
  | DiscoverMessage
  | JoinMessage
  | SetReadyMessage
  | StartMatchMessage
  | GameCommandMessage
  | LeaveMessage
  | PingMessage;
