import { MatchState } from '../models/MatchState';
import { GamePhase } from '../models/GamePhase';
import { GameEventType } from '../models/GameEvent';
import { GameLogger } from './GameLogger';

export class TurnManager {
  public static endTurn(state: MatchState): void {
    if (state.phase !== GamePhase.TURN_END) {
      throw new Error('O turno ainda não pode ser encerrado.');
    }

    this.checkWinner(state);
    if (state.winnerId) {
      return;
    }

    let nextIndex = (state.currentPlayerIndex + 1) % state.players.length;
    while (!state.players[nextIndex].alive) {
      nextIndex = (nextIndex + 1) % state.players.length;
    }

    state.currentPlayerIndex = nextIndex;
    state.turnNumber++;
    state.phase = GamePhase.TURN_START;
    state.pendingAction = undefined;
    state.pendingBlock = undefined;
    state.privatePeekedInfluence = undefined;
    
    // Reset responses
    state.challengePasses = [];
    state.blockPasses = [];
    state.blockChallengePasses = [];
    
    const nextPlayer = state.players[nextIndex];
    GameLogger.logEvent(state, GameEventType.TURN_STARTED, {
      description: `Início do turno ${state.turnNumber}: vez de ${nextPlayer.name}.`,
      playerIndex: nextIndex,
      playerId: nextPlayer.id,
    });
  }

  private static checkWinner(state: MatchState): void {
    const alivePlayers = state.players.filter((player) => player.alive);
    if (alivePlayers.length !== 1 || state.phase === GamePhase.GAME_OVER) {
      return;
    }

    const [winner] = alivePlayers;
    state.winnerId = winner.id;
    state.phase = GamePhase.GAME_OVER;
    GameLogger.logEvent(state, GameEventType.GAME_FINISHED, {
      description: `FIM DE JOGO! ${winner.name} é o novo Imperador!`,
      winnerId: winner.id,
      winnerName: winner.name,
    });
  }
}
