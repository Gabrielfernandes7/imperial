export interface NetworkPlayer {
  id: string;
  clientId: string;
  name: string;
  isHost: boolean;
  ready: boolean;
  connected: boolean;
}

export interface TableSummary {
  id: string;
  name: string;
  hostAddress: string;
  port: number;
  playerCount: number;
  maxPlayers: number;
  started: boolean;
}

export interface LobbyState {
  table: TableSummary;
  players: NetworkPlayer[];
}
