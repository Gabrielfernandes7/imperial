import * as Network from 'expo-network';
import * as Crypto from 'expo-crypto';
import { create } from 'zustand';
import { GameClient } from './client/GameClient';
import { HostServer } from './host/HostServer';
import { ConnectionState } from './models/ConnectionState';
import { LobbyState, TableSummary } from './models/NetworkPlayer';
import { DEFAULT_GAME_PORT } from './protocol/MessageTypes';
import { GameCommand } from './protocol/ClientMessages';
import { StateSnapshot } from './sync/StateSnapshot';

interface NetworkSessionState {
  client?: GameClient;
  host?: HostServer;
  playerId?: string;
  isHost: boolean;
  connectionState: ConnectionState;
  lobby?: LobbyState;
  snapshot?: StateSnapshot;
  error?: string;
  createHost: (playerName: string, tableName: string) => Promise<void>;
  joinTable: (playerName: string, table: TableSummary) => Promise<void>;
  setReady: (ready: boolean) => void;
  startMatch: () => void;
  sendCommand: (command: GameCommand) => void;
  clearError: () => void;
  leave: () => Promise<void>;
}

function attachClient(
  client: GameClient,
  set: (partial: Partial<NetworkSessionState>) => void,
): void {
  client.on('connection', (connectionState) =>
    set({
      connectionState,
      ...(connectionState === ConnectionState.DISCONNECTED
        ? { lobby: undefined, snapshot: undefined }
        : {}),
    }),
  );
  client.on('lobby', (lobby) =>
    set({
      lobby,
      playerId: client.getPlayerId(),
      error: undefined,
    }),
  );
  client.on('snapshot', (snapshot) =>
    set({
      snapshot,
      playerId: client.getPlayerId(),
      error: undefined,
    }),
  );
  client.on('error', (error) => set({ error }));
}

export const useNetworkSession = create<NetworkSessionState>((set, get) => ({
  isHost: false,
  connectionState: ConnectionState.IDLE,

  createHost: async (playerName, tableName) => {
    await get().leave();
    const hostAddress = await Network.getIpAddressAsync();
    if (!hostAddress || hostAddress === '0.0.0.0') {
      throw new Error('Conecte o dispositivo a uma rede Wi-Fi local.');
    }

    const clientId = Crypto.randomUUID();
    const host = new HostServer({
      tableName: tableName.trim() || `Mesa de ${playerName}`,
      hostName: playerName,
      hostClientId: clientId,
      hostAddress,
      port: DEFAULT_GAME_PORT,
    });
    await host.start();

    const client = new GameClient(clientId, playerName);
    attachClient(client, set);
    set({
      host,
      client,
      isHost: true,
      error: undefined,
      connectionState: ConnectionState.CONNECTING,
    });
    try {
      await client.connect(hostAddress, DEFAULT_GAME_PORT);
    } catch (error) {
      await host.stop();
      set({ host: undefined, client: undefined, isHost: false });
      throw error;
    }
  },

  joinTable: async (playerName, table) => {
    await get().leave();
    const client = new GameClient(Crypto.randomUUID(), playerName);
    attachClient(client, set);
    set({
      client,
      host: undefined,
      isHost: false,
      error: undefined,
      connectionState: ConnectionState.CONNECTING,
    });
    await client.connect(table.hostAddress, table.port);
  },

  setReady: (ready) => get().client?.setReady(ready),
  startMatch: () => get().client?.startMatch(),
  sendCommand: (command) => get().client?.sendCommand(command),
  clearError: () => set({ error: undefined }),

  leave: async () => {
    const { client, host } = get();
    client?.disconnect();
    await host?.stop();
    set({
      client: undefined,
      host: undefined,
      playerId: undefined,
      isHost: false,
      connectionState: ConnectionState.IDLE,
      lobby: undefined,
      snapshot: undefined,
      error: undefined,
    });
  },
}));
