import { botIA } from '../bot/BotPlayer';
import { BotOrchestrator } from './BotOrchestrator';
import { Action } from '../models/Action';
import { ActionResult } from '../models/ActionResult';
import { ACTIONS, ActionType } from '../models/ActionType';
import { ChallengeResult } from '../models/ChallengeResult';
import { CHARACTERS, CharacterType } from '../models/Character';
import { GameEventType } from '../models/GameEvent';
import { GamePhase } from '../models/GamePhase';
import { MatchState } from '../models/MatchState';
import { Player } from '../models/Player';
import { GameLogger } from './GameLogger';
import { ActionRules } from '../rules/ActionRules';
import { BlockClaims } from '../rules/BlockClaims';
import { CharacterClaims } from '../rules/CharacterClaims';
import { DeckBuilder } from '../rules/DeckBuilder';
import { GameRules } from '../rules/GameRules';
import { generateId } from '../utils/id';
import { shuffle } from '../utils/shuffle';
import { StateValidator } from './StateValidator';
import { GameMode } from '../models/GameMode';
import { TurnManager } from './TurnManager';
import { ActionResolver } from './ActionResolver';
export class GameEngine {
  private state: MatchState;

  /**
   * Inicializa uma nova engine de jogo Imperial.
   * 
   * @param playerNames - Lista de nomes dos jogadores.
   * @param humanPlayerIndex - Índice do jogador humano (se houver).
   * @param options - Configurações adicionais de IDs, bots e modo de jogo.
   */
  constructor(
    playerNames: string[],
    humanPlayerIndex: number | null = 0,
    options?: {
      playerIds?: string[];
      allHuman?: boolean;
      mode?: GameMode;
    },
  ) {
    // ...

    const players: Player[] = playerNames.map((name, index) => ({
      id: options?.playerIds?.[index] ?? generateId(),
      name,
      coins: 0,
      influences: [],
      alive: true,
      isBot: options?.allHuman
        ? false
        : humanPlayerIndex === null || index !== humanPlayerIndex,
    }));

    this.state = {
      config: {
        mode: options?.mode ?? GameMode.NORMAL,
      },
      players,
      deck: [],
      currentPlayerIndex: 0,
      phase: GamePhase.SETUP,
      turnNumber: 0,
      challengePasses: [],
      blockPasses: [],
      blockChallengePasses: [],
      events: [],
    };
  }

  /**
   * Inicia a partida, distribuindo moedas e influências iniciais.
   */
  public startGame(): void {
    const deck = DeckBuilder.buildDeck();

    this.state.players.forEach((player) => {
      player.coins = GameRules.STARTING_COINS;
      player.alive = true;
      player.influences = [];

      for (let i = 0; i < GameRules.STARTING_INFLUENCES; i++) {
        const character = deck.pop();
        if (character) {
          player.influences.push({ id: generateId(), character, revealed: false });
        }
      }
    });

    this.state.deck = deck;
    this.state.currentPlayerIndex = 0;
    this.state.phase = GamePhase.TURN_START;
    this.state.turnNumber = 1;
    this.state.pendingAction = undefined;
    this.state.pendingBlock = undefined;
    this.state.privatePeekedInfluence = undefined;
    this.resetResponsePasses();
    this.logEvent(GameEventType.GAME_STARTED, {
      description: 'Partida iniciada no Brasil Imperial!',
      players: this.state.players.map((player) => player.name),
      playerIds: this.state.players.map((player) => player.id),
    });
    this.validate();
  }

  /**
   * Executa um passo da engine de jogo.
   * Lida com transições automáticas de fase, resoluções de bots e validação de estado.
   */
  public step(): void {
    BotOrchestrator.executeBotStep(this.state, botIA, {
      declareAction: (a) => this.declareAction(a),
      challenge: (id) => this.challenge(id),
      passChallenge: (id) => this.passChallenge(id),
      declareBlock: (id, c) => this.declareBlock(id, c),
      passBlock: (id) => this.passBlock(id),
      challengeBlock: (id) => this.challengeBlock(id),
      passBlockChallenge: (id) => this.passBlockChallenge(id),
      revealInfluence: (id, infId) => this.revealInfluence(id, infId),
      exchangeCards: (id, ids) => this.exchangeCards(id, ids),
      getPlayerById: (id) => this.getPlayerById(id),
      getCurrentPlayer: () => this.getCurrentPlayer(),
      getEligibleChallengePlayers: () => this.getEligibleChallengePlayers(),
      getEligibleBlockPlayers: () => this.getEligibleBlockPlayers(),
      getEligibleBlockChallengePlayers: () => this.getEligibleBlockChallengePlayers(),
    });

    if (this.state.phase === GamePhase.ACTION_DECLARED) {
      this.resolvePendingAction();
    } else if (this.state.phase === GamePhase.TURN_END) {
      this.endTurn();
    }

    this.validate();
  }

  public playUntilFinished(maxSteps: number = 2000): void {
    let steps = 0;

    while (this.state.phase !== GamePhase.GAME_OVER && steps < maxSteps) {
      this.step();
      steps++;
    }

    if (this.state.phase !== GamePhase.GAME_OVER) {
      throw new Error(`Game did not finish within ${maxSteps} engine steps.`);
    }
  }

  public getState(): MatchState {
    return {
      ...this.state,
      config: {
        ...this.state.config,
      },
      players: this.state.players.map((player) => ({
        ...player,
        influences: player.influences.map((influence) => ({
          ...influence,
          character: { ...influence.character },
        })),
      })),
      deck: this.state.deck.map((card) => ({ ...card })),
      pendingAction: this.state.pendingAction
        ? {
            ...this.state.pendingAction,
            action: { ...this.state.pendingAction.action },
          }
        : undefined,
      pendingBlock: this.state.pendingBlock ? { ...this.state.pendingBlock } : undefined,
      privatePeekedInfluence: this.state.privatePeekedInfluence
        ? {
            viewerId: this.state.privatePeekedInfluence.viewerId,
            targetPlayerId: this.state.privatePeekedInfluence.targetPlayerId,
            influence: {
              ...this.state.privatePeekedInfluence.influence,
              character: { ...this.state.privatePeekedInfluence.influence.character },
            },
          }
        : undefined,
      challengePasses: [...this.state.challengePasses],
      blockPasses: [...this.state.blockPasses],
      blockChallengePasses: [...this.state.blockChallengePasses],
      events: this.state.events.map((event) => ({
        ...event,
        payload: { ...event.payload },
      })),
    };
  }

  /** Debug-only access for deterministic validation scripts. */
  public debugState(): MatchState {
    return this.state;
  }

  public getCurrentPlayer(): Player {
    return this.state.players[this.state.currentPlayerIndex];
  }

  public getEligibleChallengePlayerIds(): string[] {
    return this.getEligibleChallengePlayers().map((player) => player.id);
  }

  public getEligibleBlockPlayerIds(): string[] {
    return this.getEligibleBlockPlayers().map((player) => player.id);
  }

  public getEligibleBlockChallengePlayerIds(): string[] {
    return this.getEligibleBlockChallengePlayers().map((player) => player.id);
  }

  public declareAction(action: Action): ActionResult {
    const validation = ActionRules.validate(this.state, action);
    if (!validation.valid) {
      return { success: false, message: validation.error!, stateChanged: false };
    }

    const actor = this.getPlayerById(action.actorId)!;
    const target = action.targetId ? this.getPlayerById(action.targetId) : undefined;
    const actionData = ACTIONS[action.type];

    actor.coins -= actionData.cost;
    this.state.privatePeekedInfluence = undefined;
    this.state.pendingAction = {
      action,
      declaredAtTurn: this.state.turnNumber,
      requiredCharacter: CharacterClaims[action.type],
      costPaid: actionData.cost,
    };
    this.state.pendingBlock = undefined;
    this.resetResponsePasses();

    let description = `${actor.name} declarou ${actionData.name}`;
    if (target) {
      description += ` contra ${target.name}`;
    }

    this.logEvent(GameEventType.ACTION_DECLARED, {
      description,
      actorId: action.actorId,
      targetId: action.targetId,
      type: action.type,
      costPaid: actionData.cost,
    });

    this.state.phase = actionData.isChallengeable
      ? GamePhase.CHALLENGE_WINDOW
      : actionData.isBlockable
        ? GamePhase.BLOCK_WINDOW
        : GamePhase.ACTION_DECLARED;

    return { success: true, message: 'OK', stateChanged: true };
  }

  public passChallenge(playerId: string): ActionResult {
    if (this.state.phase !== GamePhase.CHALLENGE_WINDOW) {
      return this.failure('Não há uma ação aguardando desafio.');
    }
    if (!this.getEligibleChallengePlayerIds().includes(playerId)) {
      return this.failure('Este jogador não pode responder ao desafio.');
    }
    if (!this.state.challengePasses.includes(playerId)) {
      this.state.challengePasses.push(playerId);
    }

    if (this.allPlayersPassed(this.getEligibleChallengePlayerIds(), this.state.challengePasses)) {
      this.moveAfterActionChallenge();
    }
    return { success: true, message: 'Ação aceita.', stateChanged: true };
  }

  public challenge(challengerId: string): ChallengeResult | ActionResult {
    if (this.state.phase !== GamePhase.CHALLENGE_WINDOW) {
      return this.failure('Desafio só pode ser declarado durante a janela de desafio.');
    }
    if (!this.getEligibleChallengePlayerIds().includes(challengerId)) {
      return this.failure('Este jogador não pode desafiar a ação.');
    }

    const pending = this.state.pendingAction!;
    const actor = this.getPlayerById(pending.action.actorId)!;
    const challenger = this.getPlayerById(challengerId)!;
    const requiredCharacter = pending.requiredCharacter!;
    const actorHasCharacter = actor.influences.some(
      (influence) => !influence.revealed && influence.character.type === requiredCharacter,
    );

    this.logEvent(GameEventType.ACTION_CHALLENGED, {
      description: `${challenger.name} desafiou a alegação de ${actor.name}!`,
      challengerId,
      actorId: actor.id,
    });

    if (actorHasCharacter) {
      this.replaceInfluence(actor.id, requiredCharacter);
      const nextPhase = ACTIONS[pending.action.type].isBlockable
        ? GamePhase.BLOCK_WINDOW
        : GamePhase.ACTION_DECLARED;
      this.requestInfluenceLoss(challengerId, nextPhase);
      return { success: true, challengedPlayerWon: true, lostInfluencePlayerId: challengerId };
    }

    actor.coins += pending.costPaid;
    this.state.pendingAction = undefined;
    this.requestInfluenceLoss(actor.id, GamePhase.TURN_END);
    return { success: true, challengedPlayerWon: false, lostInfluencePlayerId: actor.id };
  }

  public passBlock(playerId: string): ActionResult {
    if (this.state.phase !== GamePhase.BLOCK_WINDOW) {
      return this.failure('Não há uma ação aguardando bloqueio.');
    }
    if (!this.getEligibleBlockPlayerIds().includes(playerId)) {
      return this.failure('Este jogador não pode bloquear esta ação.');
    }
    if (!this.state.blockPasses.includes(playerId)) {
      this.state.blockPasses.push(playerId);
    }

    if (this.allPlayersPassed(this.getEligibleBlockPlayerIds(), this.state.blockPasses)) {
      this.state.phase = GamePhase.ACTION_DECLARED;
    }
    return { success: true, message: 'Jogador não bloqueou.', stateChanged: true };
  }

  public declareBlock(blockerId: string, characterType: CharacterType): ActionResult {
    if (this.state.phase !== GamePhase.BLOCK_WINDOW || !this.state.pendingAction) {
      return this.failure('Bloqueio só pode ser declarado durante a janela de bloqueio.');
    }
    if (!this.getEligibleBlockPlayerIds().includes(blockerId)) {
      return this.failure('Este jogador não pode bloquear esta ação.');
    }

    const validCharacters = BlockClaims[this.state.pendingAction.action.type] ?? [];
    if (!validCharacters.includes(characterType)) {
      return this.failure('Este personagem não bloqueia a ação declarada.');
    }

    const blocker = this.getPlayerById(blockerId)!;
    this.state.pendingBlock = {
      blockerId,
      targetAction: this.state.pendingAction.action.type,
      requiredCharacter: characterType,
    };
    this.state.blockChallengePasses = [];
    this.state.phase = GamePhase.BLOCK_CHALLENGE_WINDOW;
    this.logEvent(GameEventType.ACTION_BLOCKED, {
      description: `${blocker.name} bloqueou alegando ser ${CHARACTERS[characterType].name}.`,
      blockerId,
      characterType,
    });
    return { success: true, message: 'Bloqueio declarado.', stateChanged: true };
  }

  public passBlockChallenge(playerId: string): ActionResult {
    if (this.state.phase !== GamePhase.BLOCK_CHALLENGE_WINDOW) {
      return this.failure('Não há bloqueio aguardando desafio.');
    }
    if (!this.getEligibleBlockChallengePlayerIds().includes(playerId)) {
      return this.failure('Este jogador não pode responder ao bloqueio.');
    }
    if (!this.state.blockChallengePasses.includes(playerId)) {
      this.state.blockChallengePasses.push(playerId);
    }

    if (
      this.allPlayersPassed(
        this.getEligibleBlockChallengePlayerIds(),
        this.state.blockChallengePasses,
      )
    ) {
      this.acceptBlock();
    }
    return { success: true, message: 'Bloqueio aceito.', stateChanged: true };
  }

  public challengeBlock(challengerId: string): ChallengeResult | ActionResult {
    if (this.state.phase !== GamePhase.BLOCK_CHALLENGE_WINDOW || !this.state.pendingBlock) {
      return this.failure('Desafio de bloqueio só pode ocorrer na janela correta.');
    }
    if (!this.getEligibleBlockChallengePlayerIds().includes(challengerId)) {
      return this.failure('Este jogador não pode desafiar o bloqueio.');
    }

    const block = this.state.pendingBlock;
    const blocker = this.getPlayerById(block.blockerId)!;
    const challenger = this.getPlayerById(challengerId)!;
    const blockerHasCharacter = blocker.influences.some(
      (influence) =>
        !influence.revealed && influence.character.type === block.requiredCharacter,
    );

    this.logEvent(GameEventType.BLOCK_CHALLENGED, {
      description: `${challenger.name} desafiou o bloqueio de ${blocker.name}!`,
      challengerId,
      blockerId: blocker.id,
    });

    if (blockerHasCharacter) {
      this.replaceInfluence(blocker.id, block.requiredCharacter);
      this.state.pendingAction = undefined;
      this.state.pendingBlock = undefined;
      this.requestInfluenceLoss(challengerId, GamePhase.TURN_END);
      return { success: true, challengedPlayerWon: true, lostInfluencePlayerId: challengerId };
    }

    this.state.pendingBlock = undefined;
    this.requestInfluenceLoss(blocker.id, GamePhase.ACTION_DECLARED);
    return { success: true, challengedPlayerWon: false, lostInfluencePlayerId: blocker.id };
  }

  public resolvePendingAction(): ActionResult {
    return ActionResolver.resolve(
      this.state,
      (id) => this.getPlayerById(id),
      (playerId, nextPhase) => this.requestInfluenceLoss(playerId, nextPhase),
      () => this.checkWinner()
    );
  }


  public exchangeCards(playerId: string, influenceIdsToReturn: string[]): ActionResult {
    const player = this.getPlayerById(playerId);
    const uniqueIds = new Set(influenceIdsToReturn);

    if (
      !player ||
      !player.alive ||
      this.state.phase !== GamePhase.SELECTING_CARDS_TO_EXCHANGE ||
      this.getCurrentPlayer().id !== playerId
    ) {
      return this.failure('Troca de cartas inválida.');
    }
    if (influenceIdsToReturn.length !== 1 || uniqueIds.size !== 1) {
      return this.failure('Deve devolver exatamente uma carta.');
    }

    const selectedCards = influenceIdsToReturn.map((id) =>
      player.influences.find((influence) => influence.id === id),
    );
    if (selectedCards.some((card) => !card || card.revealed)) {
      return this.failure('As cartas escolhidas não podem ser devolvidas.');
    }

    influenceIdsToReturn.forEach((id) => {
      const index = player.influences.findIndex((influence) => influence.id === id);
      const [removed] = player.influences.splice(index, 1);
      this.state.deck.push(removed.character);
    });

    this.state.deck = shuffle(this.state.deck);
    this.state.pendingAction = undefined;
    this.state.phase = GamePhase.TURN_END;
    this.logEvent(GameEventType.ACTION_RESOLVED, {
      description: `${player.name} completou a troca de influências.`,
      type: ActionType.NEGOCIACAO,
      actorId: player.id,
    });
    return { success: true, message: 'Troca concluída.', stateChanged: true };
  }

  public revealInfluence(playerId: string, influenceId: string): ActionResult {
    if (
      this.state.phase !== GamePhase.SELECTING_CARD_TO_REVEAL ||
      this.state.playerToRevealId !== playerId
    ) {
      return this.failure('Não é a vez deste jogador revelar uma influência.');
    }

    const player = this.getPlayerById(playerId)!;
    const influence = player.influences.find((item) => item.id === influenceId);
    if (!influence || influence.revealed) {
      return this.failure('Influência inválida.');
    }

    influence.revealed = true;
    this.logEvent(GameEventType.INFLUENCE_LOST, {
      description: `${player.name} perdeu sua influência de ${influence.character.name}.`,
      playerId,
      character: influence.character.type,
    });

    if (player.influences.every((item) => item.revealed)) {
      player.alive = false;
      player.coins = 0;
      this.logEvent(GameEventType.PLAYER_ELIMINATED, {
        description: `${player.name} foi eliminado da corte!`,
        playerId,
      });
    }

    const nextPhase = this.state.nextPhaseAfterReveal ?? GamePhase.TURN_END;
    this.state.phase = nextPhase;
    this.state.playerToRevealId = undefined;
    this.state.nextPhaseAfterReveal = undefined;

    this.checkWinner();
    if (this.state.phase === GamePhase.GAME_OVER) {
      return { success: true, message: 'Influência revelada.', stateChanged: true };
    }

    if (
      !player.alive &&
      this.state.pendingAction?.action.targetId === player.id &&
      [GamePhase.BLOCK_WINDOW, GamePhase.ACTION_DECLARED].includes(this.state.phase)
    ) {
      this.state.pendingAction = undefined;
      this.state.pendingBlock = undefined;
      this.state.phase = GamePhase.TURN_END;
    }

    return { success: true, message: 'Influência revelada.', stateChanged: true };
  }

  public endTurn(): ActionResult {
    try {
      TurnManager.endTurn(this.state);
      return { success: true, message: 'Próximo turno.', stateChanged: true };
    } catch (error) {
      return this.failure(error instanceof Error ? error.message : 'Erro ao encerrar turno.');
    }
  }


  private moveAfterActionChallenge(): void {
    const actionType = this.state.pendingAction!.action.type;
    this.state.phase = ACTIONS[actionType].isBlockable
      ? GamePhase.BLOCK_WINDOW
      : GamePhase.ACTION_DECLARED;
  }

  private acceptBlock(): void {
    this.logEvent(GameEventType.BLOCK_ACCEPTED, {
      description: 'O bloqueio foi aceito. A ação foi cancelada.',
    });
    this.state.pendingAction = undefined;
    this.state.pendingBlock = undefined;
    this.state.phase = GamePhase.TURN_END;
  }

  private getEligibleChallengePlayers(): Player[] {
    const actorId = this.state.pendingAction?.action.actorId;
    if (!actorId) {
      return [];
    }
    return this.state.players.filter((player) => player.alive && player.id !== actorId);
  }

  private getEligibleBlockPlayers(): Player[] {
    const action = this.state.pendingAction?.action;
    if (!action) {
      return [];
    }

    if (action.type === ActionType.ARRECADACAO_PUBLICA) {
      return this.state.players.filter(
        (player) => player.alive && player.id !== action.actorId,
      );
    }

    if (
      [ActionType.CONTRABANDO, ActionType.CONSPIRACAO].includes(action.type) &&
      action.targetId
    ) {
      const target = this.getPlayerById(action.targetId);
      return target?.alive ? [target] : [];
    }

    return [];
  }

  private getEligibleBlockChallengePlayers(): Player[] {
    const blockerId = this.state.pendingBlock?.blockerId;
    if (!blockerId) {
      return [];
    }
    return this.state.players.filter((player) => player.alive && player.id !== blockerId);
  }

  private requestInfluenceLoss(playerId: string, nextPhase: GamePhase): void {
    const player = this.getPlayerById(playerId);
    if (!player?.alive) {
      this.state.phase = nextPhase;
      return;
    }
    this.state.playerToRevealId = playerId;
    this.state.nextPhaseAfterReveal = nextPhase;
    this.state.phase = GamePhase.SELECTING_CARD_TO_REVEAL;
  }

  private replaceInfluence(playerId: string, characterType: CharacterType): void {
    const player = this.getPlayerById(playerId)!;
    const index = player.influences.findIndex(
      (influence) =>
        !influence.revealed && influence.character.type === characterType,
    );
    if (index === -1) {
      return;
    }

    const [revealedCard] = player.influences.splice(index, 1);
    this.state.deck.push(revealedCard.character);
    this.state.deck = shuffle(this.state.deck);
    const replacement = this.state.deck.pop()!;
    player.influences.push({
      id: generateId(),
      character: replacement,
      revealed: false,
    });
  }

  private checkWinner(): void {
    const alivePlayers = this.state.players.filter((player) => player.alive);
    if (alivePlayers.length !== 1 || this.state.phase === GamePhase.GAME_OVER) {
      return;
    }

    const [winner] = alivePlayers;
    this.state.winnerId = winner.id;
    this.state.phase = GamePhase.GAME_OVER;
    this.logEvent(GameEventType.GAME_FINISHED, {
      description: `FIM DE JOGO! ${winner.name} é o novo Imperador!`,
      winnerId: winner.id,
      winnerName: winner.name,
    });
  }

  private allPlayersPassed(eligibleIds: string[], passedIds: string[]): boolean {
    return eligibleIds.length === 0 || eligibleIds.every((id) => passedIds.includes(id));
  }

  private resetResponsePasses(): void {
    this.state.challengePasses = [];
    this.state.blockPasses = [];
    this.state.blockChallengePasses = [];
  }

  private logEvent(type: GameEventType, payload: Record<string, unknown>): void {
    GameLogger.logEvent(this.state, type, payload);
  }

  private getPlayerById(id: string): Player | undefined {
    return this.state.players.find((player) => player.id === id);
  }

  private failure(message: string): ActionResult {
    return { success: false, message, stateChanged: false };
  }

  private validate(): void {
    StateValidator.validate(this.state);
  }
}
