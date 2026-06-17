import { GameEvent } from '../../game/models/GameEvent';
import { MatchState } from '../../game/models/MatchState';
import { StateSnapshot } from './StateSnapshot';

export class StateSerializer {
  static forPlayer(
    state: MatchState,
    recipientPlayerId: string,
    revision: number,
  ): StateSnapshot {
    const self = state.players.find((player) => player.id === recipientPlayerId);
    if (!self) {
      throw new Error('Jogador não pertence a esta partida.');
    }

    const exchangingPlayerId =
      state.phase === 'SELECTING_CARDS_TO_EXCHANGE'
        ? state.players[state.currentPlayerIndex].id
        : undefined;

    const publicInfluencesFor = (player: MatchState['players'][number]) => {
      const revealedInfluences = player.influences
        .filter((influence) => influence.revealed)
        .map((influence) => ({
          id: influence.id,
          revealed: true,
          character: { ...influence.character },
        }));
      const hiddenInfluences = player.influences
        .filter((influence) => !influence.revealed)
        .map((influence) => ({
          id: influence.id,
          revealed: false as const,
        }));

      if (player.id === exchangingPlayerId && player.id !== recipientPlayerId) {
        return [...revealedInfluences, ...hiddenInfluences.slice(0, Math.max(0, hiddenInfluences.length - 1))];
      }

      return [...revealedInfluences, ...hiddenInfluences];
    };

    const publicPlayers = state.players.map((player) => {
      const hiddenCount = player.influences.filter((influence) => !influence.revealed).length;
      const publicInfluences = publicInfluencesFor(player);
      return {
        id: player.id,
        name: player.name,
        coins: player.coins,
        alive: player.alive,
        isBot: player.isBot,
        botPersonality: player.botPersonality,
        influenceCount:
          player.id === exchangingPlayerId && player.id !== recipientPlayerId
            ? Math.max(0, hiddenCount - 1)
            : hiddenCount,
        revealedInfluenceCount: player.influences.filter(
          (influence) => influence.revealed,
        ).length,
        influences: publicInfluences,
      };
    });

    return {
      revision,
      recipientPlayerId,
      players: publicPlayers,
      self: {
        ...publicPlayers.find((player) => player.id === self.id)!,
        influences: self.influences.map((influence) => ({
          ...influence,
          character: { ...influence.character },
        })),
      },
      currentPlayerId: state.players[state.currentPlayerIndex].id,
      phase: state.phase,
      turnNumber: state.turnNumber,
      pendingAction: state.pendingAction
        ? {
            action: { ...state.pendingAction.action },
            requiredCharacter: state.pendingAction.requiredCharacter,
          }
        : undefined,
      pendingBlock: state.pendingBlock ? { ...state.pendingBlock } : undefined,
      challengePasses: [...state.challengePasses],
      blockPasses: [...state.blockPasses],
      blockChallengePasses: [...state.blockChallengePasses],
      events: state.events.map(StateSerializer.publicEvent),
      winnerId: state.winnerId,
      playerToRevealId: state.playerToRevealId,
      exchangeCardCount:
        state.phase === 'SELECTING_CARDS_TO_EXCHANGE' &&
        state.players[state.currentPlayerIndex].id === recipientPlayerId
          ? self.influences.filter((influence) => !influence.revealed).length
          : undefined,
      privatePeekedInfluence:
        state.privatePeekedInfluence?.viewerId === recipientPlayerId
          ? {
              targetPlayerId: state.privatePeekedInfluence.targetPlayerId,
              influence: {
                ...state.privatePeekedInfluence.influence,
                character: { ...state.privatePeekedInfluence.influence.character },
              },
            }
          : undefined,
    };
  }

  static stringify(snapshot: StateSnapshot): string {
    return JSON.stringify(snapshot);
  }

  static parse(serialized: string): StateSnapshot {
    return JSON.parse(serialized) as StateSnapshot;
  }

  private static publicEvent(event: GameEvent): GameEvent {
    return {
      id: event.id,
      turn: event.turn,
      timestamp: event.timestamp,
      type: event.type,
      description: event.description,
      payload: StateSerializer.publicEventPayload(event.payload),
    };
  }

  private static publicEventPayload(payload: Record<string, unknown>): Record<string, unknown> {
    const allowedKeys = [
      'description',
      'players',
      'playerIds',
      'actorId',
      'targetId',
      'type',
      'costPaid',
      'challengerId',
      'blockerId',
      'characterType',
      'character',
      'playerId',
      'playerIndex',
      'winnerId',
      'winnerName',
    ];

    return Object.fromEntries(
      Object.entries(payload).filter(([key]) => allowedKeys.includes(key)),
    );
  }
}
