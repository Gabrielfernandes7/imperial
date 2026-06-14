import TcpSocket from 'react-native-tcp-socket';
import type Socket from 'react-native-tcp-socket/lib/types/Socket';
import { generateId } from '../../game/utils/id';
import { ConnectionState } from '../models/ConnectionState';
import { LobbyState } from '../models/NetworkPlayer';
import { ClientMessage, GameCommand } from '../protocol/ClientMessages';
import { JsonLineDecoder, encodeMessage } from '../protocol/JsonLineCodec';
import {
  ClientMessageType,
  DEFAULT_GAME_PORT,
  ServerMessageType,
  envelope,
} from '../protocol/MessageTypes';
import { ServerMessage } from '../protocol/ServerMessages';
import { StateSnapshot } from '../sync/StateSnapshot';

export interface GameClientEvents {
  connection: (state: ConnectionState) => void;
  lobby: (lobby: LobbyState) => void;
  snapshot: (snapshot: StateSnapshot) => void;
  error: (message: string) => void;
  disconnected: (playerId: string) => void;
}

type EventName = keyof GameClientEvents;

export class GameClient {
  private socket?: Socket;
  private readonly decoder = new JsonLineDecoder<ServerMessage>();
  private readonly listeners: {
    [K in EventName]: Set<GameClientEvents[K]>;
  } = {
    connection: new Set(),
    lobby: new Set(),
    snapshot: new Set(),
    error: new Set(),
    disconnected: new Set(),
  };

  private playerId?: string;
  private connectionState = ConnectionState.IDLE;

  constructor(
    readonly clientId: string,
    private readonly playerName: string,
  ) {}

  connect(host: string, port = DEFAULT_GAME_PORT): Promise<void> {
    this.disconnect();
    this.setConnectionState(ConnectionState.CONNECTING);

    return new Promise((resolve, reject) => {
      const socket = TcpSocket.createConnection(
        {
          host,
          port,
          connectTimeout: 2500,
          reuseAddress: true,
        },
        () => {
          socket.setEncoding('utf8');
          socket.setNoDelay(true);
          socket.setKeepAlive(true);
          this.socket = socket;
          this.setConnectionState(ConnectionState.CONNECTED);
          this.send(
            envelope(ClientMessageType.JOIN, {
              clientId: this.clientId,
              playerName: this.playerName,
            }),
          );
          resolve();
        },
      );

      const failConnect = (error: Error) => {
        if (this.socket !== socket) {
          socket.destroy();
          this.setConnectionState(ConnectionState.ERROR);
          reject(error);
        }
      };

      socket.on('data', (data) => {
        try {
          this.decoder.push(String(data)).forEach((message) => this.handle(message));
        } catch (error) {
          this.emit('error', error instanceof Error ? error.message : 'Mensagem inválida.');
        }
      });
      socket.on('error', (error) => {
        failConnect(error);
        this.emit('error', error.message);
      });
      socket.on('close', () => {
        if (this.socket === socket) {
          this.socket = undefined;
          this.setConnectionState(ConnectionState.DISCONNECTED);
        }
      });
    });
  }

  disconnect(): void {
    this.socket?.destroy();
    this.socket = undefined;
    if (this.connectionState !== ConnectionState.IDLE) {
      this.setConnectionState(ConnectionState.DISCONNECTED);
    }
  }

  setReady(ready: boolean): void {
    this.send(envelope(ClientMessageType.SET_READY, { ready }));
  }

  startMatch(): void {
    this.send(envelope(ClientMessageType.START_MATCH, {}));
  }

  sendCommand(command: GameCommand): void {
    this.send(envelope(ClientMessageType.GAME_COMMAND, { command }, generateId()));
  }

  getPlayerId(): string | undefined {
    return this.playerId;
  }

  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  on<K extends EventName>(event: K, listener: GameClientEvents[K]): () => void {
    this.listeners[event].add(listener);
    return () => this.listeners[event].delete(listener);
  }

  private send(message: ClientMessage): void {
    if (!this.socket || this.socket.destroyed) {
      this.emit('error', 'Sem conexão com o Host.');
      return;
    }
    this.socket.write(encodeMessage(message));
  }

  private handle(message: ServerMessage): void {
    switch (message.type) {
      case ServerMessageType.WELCOME:
        this.playerId = message.payload.playerId;
        this.emit('lobby', message.payload.lobby);
        break;
      case ServerMessageType.LOBBY_STATE:
        this.emit('lobby', message.payload.lobby);
        break;
      case ServerMessageType.STATE_SNAPSHOT:
        this.emit('snapshot', message.payload.snapshot);
        break;
      case ServerMessageType.COMMAND_REJECTED:
      case ServerMessageType.ERROR:
        this.emit('error', message.payload.message);
        break;
      case ServerMessageType.PLAYER_DISCONNECTED:
        this.emit('disconnected', message.payload.playerId);
        break;
    }
  }

  private setConnectionState(state: ConnectionState): void {
    this.connectionState = state;
    this.emit('connection', state);
  }

  private emit<K extends EventName>(event: K, value: Parameters<GameClientEvents[K]>[0]): void {
    this.listeners[event].forEach((listener) => {
      (listener as (eventValue: typeof value) => void)(value);
    });
  }
}
