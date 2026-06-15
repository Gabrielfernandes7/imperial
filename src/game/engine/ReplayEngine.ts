import { GameEvent, GameEventType } from '../models/GameEvent';
import { MatchState } from '../models/MatchState';
import { GamePhase } from '../models/GamePhase';
import { GameMode } from '../models/GameMode';
import { generateId } from '../utils/id';

/**
 * Simplified ReplayEngine that reconstructs basic state from events.
 * For a full replay, we would need to store the initial deck and random seeds.
 * Here we focus on reproducing the 'narrative' of the match.
 */
export class ReplayEngine {
  private events: GameEvent[];
  private currentIndex: number = 0;
  private state: MatchState;

  constructor(events: GameEvent[]) {
    this.events = events;
    this.state = this.initializeState();
  }

  private initializeState(): MatchState {
    const startEvent = this.events.find(e => e.type === GameEventType.GAME_STARTED);
    const playerNames: string[] = startEvent?.payload.players || [];
    const playerIds: string[] | undefined = startEvent?.payload.playerIds;
    
    return {
      config: {
        mode: GameMode.NORMAL,
      },
      players: playerNames.map((name, index) => ({
        id: playerIds?.[index] || generateId(),
        name,
        coins: 2,
        influences: [], // In a real replay, we'd need the initial cards
        alive: true,
        isBot: true,
      })),
      deck: [],
      currentPlayerIndex: 0,
      phase: GamePhase.SETUP,
      turnNumber: 1,
      challengePasses: [],
      blockPasses: [],
      blockChallengePasses: [],
      events: [],
    };
  }

  public stepForward(): void {
    if (this.currentIndex >= this.events.length) return;
    const event = this.events[this.currentIndex];
    this.applyEvent(event);
    this.currentIndex++;
  }

  private applyEvent(event: GameEvent): void {
    this.state.events.push(event);
    this.state.turnNumber = event.turn;

    switch (event.type) {
      case GameEventType.TURN_STARTED:
        this.state.currentPlayerIndex = event.payload.playerIndex;
        break;
      case GameEventType.ACTION_RESOLVED:
        // Update coins or influences based on type
        // This is a simplified version; a full replay would be more complex
        break;
      case GameEventType.PLAYER_ELIMINATED:
        const player = this.state.players.find(p => p.id === event.payload.playerId);
        if (player) player.alive = false;
        break;
      case GameEventType.GAME_FINISHED:
        this.state.winnerId = event.payload.winnerId;
        this.state.phase = GamePhase.GAME_OVER;
        break;
    }
  }

  public getCurrentState(): MatchState {
    return { ...this.state };
  }
}
