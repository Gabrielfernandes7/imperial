import { GameEngine } from '../../game/engine/GameEngine';
import { ActionResult } from '../../game/models/ActionResult';
import { GamePhase } from '../../game/models/GamePhase';
import { generateId } from '../../game/utils/id';
import { LobbyState, NetworkPlayer, TableSummary } from '../models/NetworkPlayer';
import { GameCommand } from '../protocol/ClientMessages';
import { StateSerializer } from '../sync/StateSerializer';
import { StateSnapshot } from '../sync/StateSnapshot';

const MIN_PLAYERS = 2;

export class MatchAuthority {
  private readonly tableId = generateId();
  private readonly players: NetworkPlayer[];
  private engine?: GameEngine;
  private revision = 0;

  constructor(
    private readonly tableName: string,
    hostName: string,
    hostClientId: string,
    private readonly hostAddress: string,
    private readonly port: number,
    private readonly maxPlayers = 4,
  ) {
    this.players = [
      {
        id: generateId(),
        clientId: hostClientId,
        name: hostName,
        isHost: true,
        ready: true,
        connected: false,
      },
    ];
  }

  getTableSummary(): TableSummary {
    return {
      id: this.tableId,
      name: this.tableName,
      hostAddress: this.hostAddress,
      port: this.port,
      playerCount: this.players.length,
      maxPlayers: this.maxPlayers,
      started: Boolean(this.engine),
    };
  }

  getLobbyState(): LobbyState {
    return {
      table: this.getTableSummary(),
      players: this.players.map((player) => ({ ...player })),
    };
  }

  join(clientId: string, rawName: string): NetworkPlayer {
    const existing = this.players.find((player) => player.clientId === clientId);
    if (existing) {
      existing.connected = true;
      return { ...existing };
    }
    if (this.engine) {
      throw new Error('A partida já começou.');
    }
    if (this.players.length >= this.maxPlayers) {
      throw new Error('A mesa está cheia.');
    }

    const name = rawName.trim().slice(0, 20);
    if (!name) {
      throw new Error('Informe um nome de jogador.');
    }

    const player: NetworkPlayer = {
      id: generateId(),
      clientId,
      name,
      isHost: false,
      ready: false,
      connected: true,
    };
    this.players.push(player);
    return { ...player };
  }

  setReady(playerId: string, ready: boolean): void {
    const player = this.requirePlayer(playerId);
    player.ready = player.isHost ? true : ready;
  }

  startMatch(requesterId: string): void {
    const requester = this.requirePlayer(requesterId);
    if (!requester.isHost) {
      throw new Error('Somente o Host pode iniciar a partida.');
    }
    if (this.engine) {
      throw new Error('A partida já começou.');
    }
    if (this.players.length < MIN_PLAYERS) {
      throw new Error('São necessários pelo menos dois jogadores.');
    }
    if (this.players.some((player) => !player.connected || !player.ready)) {
      throw new Error('Todos os jogadores devem estar conectados e prontos.');
    }

    this.engine = new GameEngine(
      this.players.map((player) => player.name),
      0,
      {
        playerIds: this.players.map((player) => player.id),
        allHuman: true,
      },
    );
    this.engine.startGame();
    this.revision++;
  }

  execute(playerId: string, command: GameCommand): ActionResult {
    const player = this.requirePlayer(playerId);
    if (!player.connected) {
      throw new Error('Jogador desconectado não pode enviar comandos.');
    }
    if (!this.engine) {
      throw new Error('A partida ainda não começou.');
    }

    let result: ActionResult;
    switch (command.type) {
      case 'DECLARE_ACTION':
        if (command.action.actorId !== playerId) {
          throw new Error('Um cliente não pode agir por outro jogador.');
        }
        result = this.engine.declareAction(command.action);
        break;
      case 'PASS_CHALLENGE':
        result = this.engine.passChallenge(playerId);
        break;
      case 'CHALLENGE':
        result = this.normalizeResult(this.engine.challenge(playerId));
        break;
      case 'DECLARE_BLOCK':
        result = this.engine.declareBlock(playerId, command.characterType);
        break;
      case 'PASS_BLOCK':
        result = this.engine.passBlock(playerId);
        break;
      case 'CHALLENGE_BLOCK':
        result = this.normalizeResult(this.engine.challengeBlock(playerId));
        break;
      case 'PASS_BLOCK_CHALLENGE':
        result = this.engine.passBlockChallenge(playerId);
        break;
      case 'RESOLVE_ACTION':
        this.requireCurrentPlayer(playerId);
        result = this.engine.resolvePendingAction();
        break;
      case 'REVEAL_INFLUENCE':
        result = this.engine.revealInfluence(playerId, command.influenceId);
        break;
      case 'EXCHANGE_CARDS':
        result = this.engine.exchangeCards(playerId, command.influenceIds);
        break;
      case 'END_TURN':
        this.requireCurrentPlayer(playerId);
        result = this.engine.endTurn();
        break;
      default:
        throw new Error('Comando de jogo não suportado.');
    }

    if (result.success && result.stateChanged) {
      this.revision++;
    }
    return result;
  }

  getSnapshot(playerId: string): StateSnapshot {
    if (!this.engine) {
      throw new Error('A partida ainda não começou.');
    }
    return StateSerializer.forPlayer(this.engine.getState(), playerId, this.revision);
  }

  getPlayerByClientId(clientId: string): NetworkPlayer | undefined {
    const player = this.players.find((candidate) => candidate.clientId === clientId);
    return player ? { ...player } : undefined;
  }

  disconnect(playerId: string): void {
    const index = this.players.findIndex((player) => player.id === playerId);
    if (index === -1) {
      return;
    }
    if (!this.engine && !this.players[index].isHost) {
      this.players.splice(index, 1);
      return;
    }
    this.players[index].connected = false;
    this.players[index].ready = this.players[index].isHost;
  }

  isStarted(): boolean {
    return Boolean(this.engine);
  }

  getPhase(): GamePhase | undefined {
    return this.engine?.getState().phase;
  }

  private requirePlayer(playerId: string): NetworkPlayer {
    const player = this.players.find((candidate) => candidate.id === playerId);
    if (!player) {
      throw new Error('Jogador não registrado nesta mesa.');
    }
    return player;
  }

  private requireCurrentPlayer(playerId: string): void {
    if (this.engine?.getCurrentPlayer().id !== playerId) {
      throw new Error('Somente o jogador do turno pode executar este comando.');
    }
  }

  private normalizeResult(
    result: ActionResult | { success: boolean; lostInfluencePlayerId: string },
  ): ActionResult {
    if ('stateChanged' in result) {
      return result;
    }
    return {
      success: result.success,
      message: result.success ? 'Contestação processada.' : 'Contestação rejeitada.',
      stateChanged: result.success,
    };
  }
}
