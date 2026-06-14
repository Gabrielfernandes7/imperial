export const NETWORK_PROTOCOL_VERSION = 1;
export const DEFAULT_GAME_PORT = 45892;

export enum ClientMessageType {
  DISCOVER = 'DISCOVER',
  JOIN = 'JOIN',
  SET_READY = 'SET_READY',
  START_MATCH = 'START_MATCH',
  GAME_COMMAND = 'GAME_COMMAND',
  LEAVE = 'LEAVE',
  PING = 'PING',
}

export enum ServerMessageType {
  TABLE_INFO = 'TABLE_INFO',
  WELCOME = 'WELCOME',
  LOBBY_STATE = 'LOBBY_STATE',
  STATE_SNAPSHOT = 'STATE_SNAPSHOT',
  COMMAND_REJECTED = 'COMMAND_REJECTED',
  PLAYER_DISCONNECTED = 'PLAYER_DISCONNECTED',
  ERROR = 'ERROR',
  PONG = 'PONG',
}

export interface MessageEnvelope<TType extends string, TPayload> {
  version: typeof NETWORK_PROTOCOL_VERSION;
  type: TType;
  requestId?: string;
  payload: TPayload;
}

export function envelope<TType extends string, TPayload>(
  type: TType,
  payload: TPayload,
  requestId?: string,
): MessageEnvelope<TType, TPayload> {
  return {
    version: NETWORK_PROTOCOL_VERSION,
    type,
    requestId,
    payload,
  };
}
