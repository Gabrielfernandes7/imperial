import { MatchState } from '../models/MatchState';
import { GamePhase } from '../models/GamePhase';

export class StateValidator {
  static validate(state: MatchState): void {
    // 1. Coins >= 0
    state.players.forEach(p => {
      if (p.coins < 0) throw new Error(`Player ${p.name} has negative coins: ${p.coins}`);
    });

    // 2. Influences <= 2
    state.players.forEach(p => {
      if (p.influences.length > 2 && state.phase !== GamePhase.SELECTING_CARDS_TO_EXCHANGE) {
          throw new Error(`Player ${p.name} has more than 2 influences`);
      }
    });

    // 3. Only alive players play (unless turn is ending or game is over)
    const currentPlayer = state.players[state.currentPlayerIndex];
    if (currentPlayer && !currentPlayer.alive && 
        state.phase !== GamePhase.TURN_END && 
        state.phase !== GamePhase.GAME_OVER) {
      throw new Error(`Current player ${currentPlayer.name} is eliminated but the phase is ${state.phase}`);
    }

    // 4. Only one winner
    const alivePlayers = state.players.filter(p => p.alive);
    if (state.winnerId && alivePlayers.length !== 1) {
      throw new Error(`Game has a winner but ${alivePlayers.length} players are still alive`);
    }

    // 5. Deck + Player cards = 15
    const totalCards = state.deck.length + state.players.reduce((acc, p) => acc + p.influences.length, 0);
    if (totalCards !== 15) {
      throw new Error(`Total cards in game is ${totalCards}, should be 15`);
    }
  }
}
