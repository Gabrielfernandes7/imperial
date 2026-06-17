import type Socket from 'react-native-tcp-socket/lib/types/Socket';
import { ClientMessage } from '../protocol/ClientMessages';
import { JsonLineDecoder, encodeMessage } from '../protocol/JsonLineCodec';
import { ServerMessage } from '../protocol/ServerMessages';

interface ClientConnection {
  socket: Socket;
  decoder: JsonLineDecoder<ClientMessage>;
  playerId?: string;
}

export class ClientManager {
  private readonly connections = new Map<Socket, ClientConnection>();

  add(socket: Socket): void {
    socket.setEncoding('utf8');
    socket.setNoDelay(true);
    socket.setKeepAlive(true);
    this.connections.set(socket, {
      socket,
      decoder: new JsonLineDecoder<ClientMessage>(),
    });
  }

  remove(socket: Socket): string | undefined {
    const playerId = this.connections.get(socket)?.playerId;
    this.connections.delete(socket);
    return playerId;
  }

  bindPlayer(socket: Socket, playerId: string): void {
    const connection = this.connections.get(socket);
    if (!connection) {
      throw new Error('Conexão não registrada.');
    }

    for (const existing of this.connections.values()) {
      if (existing.socket !== socket && existing.playerId === playerId) {
        existing.playerId = undefined;
        existing.socket.destroy();
      }
    }
    connection.playerId = playerId;
  }

  getPlayerId(socket: Socket): string | undefined {
    return this.connections.get(socket)?.playerId;
  }

  decode(socket: Socket, chunk: string): ClientMessage[] {
    const connection = this.connections.get(socket);
    if (!connection) {
      return [];
    }
    return connection.decoder.push(chunk);
  }

  send(socket: Socket, message: ServerMessage): void {
    if (!socket.destroyed) {
      socket.write(encodeMessage(message));
    }
  }

  sendToPlayer(playerId: string, message: ServerMessage): void {
    for (const connection of this.connections.values()) {
      if (connection.playerId === playerId) {
        this.send(connection.socket, message);
      }
    }
  }

  sendAll(message: ServerMessage): void {
    for (const connection of this.connections.values()) {
      this.send(connection.socket, message);
    }
  }

  destroyAll(): void {
    for (const connection of this.connections.values()) {
      connection.socket.destroy();
    }
    this.connections.clear();
  }
}
