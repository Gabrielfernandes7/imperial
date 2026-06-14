import { MatchState } from '../models/MatchState';
import { GameEvent, GameEventType } from '../models/GameEvent';
import { generateId } from '../utils/id';

export class GameLogger {
  public static logEvent(state: MatchState, type: GameEventType, payload: Record<string, unknown>): void {
    const event: GameEvent = {
      id: generateId(),
      turn: state.turnNumber,
      timestamp: Date.now(),
      type,
      payload,
      description: typeof payload.description === 'string' ? payload.description : '',
    };
    state.events.push(event);
  }
}
