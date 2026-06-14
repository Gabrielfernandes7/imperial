import TcpSocket from 'react-native-tcp-socket';
import type Server from 'react-native-tcp-socket/lib/types/Server';
import type Socket from 'react-native-tcp-socket/lib/types/Socket';
import { ClientMessage } from '../protocol/ClientMessages';
import {
  ClientMessageType,
  DEFAULT_GAME_PORT,
  ServerMessageType,
  envelope,
} from '../protocol/MessageTypes';
import { ClientManager } from './ClientManager';
import { MatchAuthority } from './MatchAuthority';

export interface HostServerOptions {
  tableName: string;
  hostName: string;
  hostClientId: string;
  hostAddress: string;
  port?: number;
  maxPlayers?: number;
}

export class HostServer {
  private readonly clients = new ClientManager();
  private readonly authority: MatchAuthority;
  private server?: Server;

  constructor(private readonly options: HostServerOptions) {
    this.authority = new MatchAuthority(
      options.tableName,
      options.hostName,
      options.hostClientId,
      options.hostAddress,
      options.port ?? DEFAULT_GAME_PORT,
      options.maxPlayers,
    );
  }

  start(): Promise<void> {
    if (this.server?.listening) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const server = TcpSocket.createServer(
        {
          noDelay: true,
          keepAlive: true,
          keepAliveInitialDelay: 3000,
        },
        (socket) => this.accept(socket),
      );
      this.server = server;

      const onError = (error: Error) => {
        server.removeListener('error', onError);
        reject(error);
      };
      server.on('error', onError);
      server.listen(
        {
          port: this.options.port ?? DEFAULT_GAME_PORT,
          host: '0.0.0.0',
          reuseAddress: true,
        },
        () => {
          server.removeListener('error', onError);
          resolve();
        },
      );
    });
  }

  stop(): Promise<void> {
    this.clients.destroyAll();
    if (!this.server) {
      return Promise.resolve();
    }
    const server = this.server;
    this.server = undefined;
    return new Promise((resolve) => {
      if (!server.listening) {
        resolve();
        return;
      }
      server.close(() => resolve());
    });
  }

  getAuthority(): MatchAuthority {
    return this.authority;
  }

  private accept(socket: Socket): void {
    this.clients.add(socket);

    socket.on('data', (data) => {
      try {
        const messages = this.clients.decode(socket, String(data));
        messages.forEach((message) => this.handleMessage(socket, message));
      } catch (error) {
        this.sendError(socket, error);
        socket.destroy();
      }
    });
    socket.on('error', () => {
      socket.destroy();
    });
    socket.on('close', () => {
      const playerId = this.clients.remove(socket);
      if (!playerId) {
        return;
      }
      this.authority.disconnect(playerId);
      this.broadcastLobby();
      this.broadcast(
        envelope(ServerMessageType.PLAYER_DISCONNECTED, { playerId }),
      );
    });
  }

  private handleMessage(socket: Socket, message: ClientMessage): void {
    if (message.type === ClientMessageType.DISCOVER) {
      this.clients.send(
        socket,
        envelope(
          ServerMessageType.TABLE_INFO,
          { table: this.authority.getTableSummary() },
          message.requestId,
        ),
      );
      return;
    }

    if (message.type === ClientMessageType.JOIN) {
      try {
        const player = this.authority.join(
          message.payload.clientId,
          message.payload.playerName,
        );
        this.clients.bindPlayer(socket, player.id);
        this.clients.send(
          socket,
          envelope(
            ServerMessageType.WELCOME,
            {
              playerId: player.id,
              lobby: this.authority.getLobbyState(),
            },
            message.requestId,
          ),
        );
        this.broadcastLobby();
        if (this.authority.isStarted()) {
          this.sendSnapshot(player.id);
        }
      } catch (error) {
        this.sendError(socket, error, message.requestId);
      }
      return;
    }

    const playerId = this.clients.getPlayerId(socket);
    if (!playerId) {
      this.clients.send(
        socket,
        envelope(
          ServerMessageType.ERROR,
          { message: 'Registre o jogador antes de enviar comandos.' },
          message.requestId,
        ),
      );
      return;
    }

    try {
      switch (message.type) {
        case ClientMessageType.SET_READY:
          this.authority.setReady(playerId, message.payload.ready);
          this.broadcastLobby();
          break;
        case ClientMessageType.START_MATCH:
          this.authority.startMatch(playerId);
          this.broadcastLobby();
          this.broadcastSnapshots();
          break;
        case ClientMessageType.GAME_COMMAND: {
          const result = this.authority.execute(playerId, message.payload.command);
          if (!result.success) {
            this.clients.send(
              socket,
              envelope(
                ServerMessageType.COMMAND_REJECTED,
                { message: result.message },
                message.requestId,
              ),
            );
            return;
          }
          this.broadcastSnapshots();
          break;
        }
        case ClientMessageType.LEAVE:
          socket.end();
          break;
        case ClientMessageType.PING:
          this.clients.send(
            socket,
            envelope(
              ServerMessageType.PONG,
              { sentAt: message.payload.sentAt },
              message.requestId,
            ),
          );
          break;
      }
    } catch (error) {
      this.sendError(socket, error, message.requestId);
    }
  }

  private broadcastLobby(): void {
    this.broadcast(
      envelope(ServerMessageType.LOBBY_STATE, {
        lobby: this.authority.getLobbyState(),
      }),
    );
  }

  private broadcastSnapshots(): void {
    this.authority.getLobbyState().players.forEach((player) => {
      if (player.connected) {
        this.sendSnapshot(player.id);
      }
    });
  }

  private sendSnapshot(playerId: string): void {
    this.clients.sendToPlayer(
      playerId,
      envelope(ServerMessageType.STATE_SNAPSHOT, {
        snapshot: this.authority.getSnapshot(playerId),
      }),
    );
  }

  private broadcast(message: Parameters<ClientManager['sendToPlayer']>[1]): void {
    this.authority.getLobbyState().players.forEach((player) => {
      if (player.connected) {
        this.clients.sendToPlayer(player.id, message);
      }
    });
  }

  private sendError(socket: Socket, error: unknown, requestId?: string): void {
    const message = error instanceof Error ? error.message : 'Erro de rede desconhecido.';
    this.clients.send(
      socket,
      envelope(ServerMessageType.ERROR, { message }, requestId),
    );
  }
}
