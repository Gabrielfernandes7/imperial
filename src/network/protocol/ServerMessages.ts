import { LobbyState, TableSummary } from '../models/NetworkPlayer';
import { StateSnapshot } from '../sync/StateSnapshot';
import { MessageEnvelope, ServerMessageType } from './MessageTypes';

export type TableInfoMessage = MessageEnvelope<
  ServerMessageType.TABLE_INFO,
  { table: TableSummary }
>;
export type WelcomeMessage = MessageEnvelope<
  ServerMessageType.WELCOME,
  { playerId: string; lobby: LobbyState }
>;
export type LobbyStateMessage = MessageEnvelope<
  ServerMessageType.LOBBY_STATE,
  { lobby: LobbyState }
>;
export type StateSnapshotMessage = MessageEnvelope<
  ServerMessageType.STATE_SNAPSHOT,
  { snapshot: StateSnapshot }
>;
export type CommandRejectedMessage = MessageEnvelope<
  ServerMessageType.COMMAND_REJECTED,
  { message: string }
>;
export type PlayerDisconnectedMessage = MessageEnvelope<
  ServerMessageType.PLAYER_DISCONNECTED,
  { playerId: string }
>;
export type ErrorMessage = MessageEnvelope<ServerMessageType.ERROR, { message: string }>;
export type PongMessage = MessageEnvelope<ServerMessageType.PONG, { sentAt: number }>;

export type ServerMessage =
  | TableInfoMessage
  | WelcomeMessage
  | LobbyStateMessage
  | StateSnapshotMessage
  | CommandRejectedMessage
  | PlayerDisconnectedMessage
  | ErrorMessage
  | PongMessage;
