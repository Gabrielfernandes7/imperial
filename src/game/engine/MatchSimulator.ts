import { GameEngine } from './GameEngine';

export interface Statistics {
  totalMatches: number;
  averageTurns: number;
  shortestMatch: number;
  longestMatch: number;
  winsBySeat: Record<number, number>;
  winsByCharacter: Record<string, number>;
}

export class MatchSimulator {
  public simulateOneMatch() {
    const engine = new GameEngine(['Bot 1', 'Bot 2', 'Bot 3'], null);
    engine.startGame();
    engine.playUntilFinished();
    const state = engine.getState();
    const winner = state.players.find(p => p.id === state.winnerId)!;
    
    return {
      winnerId: state.winnerId,
      winnerSeat: state.players.findIndex(p => p.id === state.winnerId),
      winnerCharacters: winner.influences.filter(inf => !inf.revealed).map(inf => inf.character.type),
      totalTurns: state.turnNumber,
      totalEvents: state.events.length,
    };
  }

  public simulateManyMatches(count: number): Statistics {
    const stats: Statistics = {
      totalMatches: count,
      averageTurns: 0,
      shortestMatch: Infinity,
      longestMatch: 0,
      winsBySeat: { 0: 0, 1: 0, 2: 0 },
      winsByCharacter: {},
    };

    let totalTurns = 0;

    for (let i = 0; i < count; i++) {
      const result = this.simulateOneMatch();
      totalTurns += result.totalTurns;
      if (result.totalTurns < stats.shortestMatch) stats.shortestMatch = result.totalTurns;
      if (result.totalTurns > stats.longestMatch) stats.longestMatch = result.totalTurns;
      
      stats.winsBySeat[result.winnerSeat] = (stats.winsBySeat[result.winnerSeat] || 0) + 1;
      
      result.winnerCharacters.forEach(char => {
        stats.winsByCharacter[char] = (stats.winsByCharacter[char] || 0) + 1;
      });
    }

    stats.averageTurns = totalTurns / count;

    return stats;
  }
}
