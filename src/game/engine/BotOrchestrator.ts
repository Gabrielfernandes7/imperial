import { MatchState } from '../models/MatchState';
import { GamePhase } from '../models/GamePhase';
import { BotIA } from '../bot/BotIA';

export class BotOrchestrator {
  public static executeBotStep(
    state: MatchState,
    botIA: BotIA,
    actions: {
      declareAction: (action: any) => void;
      challenge: (playerId: string) => void;
      passChallenge: (playerId: string) => void;
      declareBlock: (playerId: string, character: any) => void;
      passBlock: (playerId: string) => void;
      challengeBlock: (playerId: string) => void;
      passBlockChallenge: (playerId: string) => void;
      revealInfluence: (playerId: string, influenceId: string) => void;
      exchangeCards: (playerId: string, influenceIds: string[]) => void;
      getPlayerById: (id: string) => any;
      getCurrentPlayer: () => any;
      getEligibleChallengePlayers: () => any[];
      getEligibleBlockPlayers: () => any[];
      getEligibleBlockChallengePlayers: () => any[];
    }
  ): void {
    const currentPlayer = actions.getCurrentPlayer();

    switch (state.phase) {
      case GamePhase.TURN_START:
        if (currentPlayer.isBot) {
          actions.declareAction(botIA.decideAction(state, currentPlayer.id));
        }
        break;

      case GamePhase.CHALLENGE_WINDOW: {
        const responder = actions.getEligibleChallengePlayers().find(
          (player) => player.isBot && !state.challengePasses.includes(player.id),
        );
        if (responder) {
          if (botIA.decideChallenge(state, responder.id)) {
            actions.challenge(responder.id);
          } else {
            actions.passChallenge(responder.id);
          }
        }
        break;
      }

      case GamePhase.BLOCK_WINDOW: {
        const responder = actions.getEligibleBlockPlayers().find(
          (player) => player.isBot && !state.blockPasses.includes(player.id),
        );
        if (responder) {
          const character = botIA.decideBlock(state, responder.id);
          if (character) {
            actions.declareBlock(responder.id, character);
          } else {
            actions.passBlock(responder.id);
          }
        }
        break;
      }

      case GamePhase.BLOCK_CHALLENGE_WINDOW: {
        const responder = actions.getEligibleBlockChallengePlayers().find(
          (player) => player.isBot && !state.blockChallengePasses.includes(player.id),
        );
        if (responder) {
          if (botIA.decideChallengeBlock(state, responder.id)) {
            actions.challengeBlock(responder.id);
          } else {
            actions.passBlockChallenge(responder.id);
          }
        }
        break;
      }

      case GamePhase.SELECTING_CARD_TO_REVEAL: {
        const player = state.playerToRevealId ? actions.getPlayerById(state.playerToRevealId) : undefined;
        const influence = player?.influences.find((item: any) => !item.revealed);
        if (player?.isBot && influence) {
          actions.revealInfluence(player.id, influence.id);
        }
        break;
      }

      case GamePhase.SELECTING_CARDS_TO_EXCHANGE: {
        if (currentPlayer.isBot) {
          const cardsToReturn = currentPlayer.influences
            .filter((influence: any) => !influence.revealed)
            .slice(0, 1)
            .map((influence: any) => influence.id);
          actions.exchangeCards(currentPlayer.id, cardsToReturn);
        }
        break;
      }
    }
  }
}
