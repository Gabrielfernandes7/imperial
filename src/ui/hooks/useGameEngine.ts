import { useCallback, useRef } from 'react';
import { GameEngine } from '../../game/engine/GameEngine';
import { Action } from '../../game/models/Action';
import { CharacterType } from '../../game/models/Character';
import { GameMode } from '../../game/models/GameMode';
import { useGameStore } from '../../store/gameStore';

export const useGameEngine = (playerNames: string[], mode: GameMode) => {
  const engineRef = useRef<GameEngine | null>(null);
  const { state, setState } = useGameStore();

  const syncState = useCallback(() => {
    if (engineRef.current) {
      setState(engineRef.current.getState());
    }
  }, [setState]);

  const initGame = useCallback(() => {
    const engine = new GameEngine(playerNames, 0, { mode });
    engine.startGame();
    engineRef.current = engine;
    syncState();
  }, [mode, playerNames, syncState]);

  const declareAction = useCallback((action: Action) => {
    if (!engineRef.current) return;
    engineRef.current.declareAction(action);
    syncState();
  }, [syncState]);

  const challenge = useCallback((challengerId: string) => {
    if (!engineRef.current) return;
    engineRef.current.challenge(challengerId);
    syncState();
  }, [syncState]);

  const passChallenge = useCallback((playerId: string) => {
    if (!engineRef.current) return;
    engineRef.current.passChallenge(playerId);
    syncState();
  }, [syncState]);

  const declareBlock = useCallback((blockerId: string, charType: CharacterType) => {
    if (!engineRef.current) return;
    engineRef.current.declareBlock(blockerId, charType);
    syncState();
  }, [syncState]);

  const challengeBlock = useCallback((challengerId: string) => {
    if (!engineRef.current) return;
    engineRef.current.challengeBlock(challengerId);
    syncState();
  }, [syncState]);

  const passBlock = useCallback((playerId: string) => {
    if (!engineRef.current) return;
    engineRef.current.passBlock(playerId);
    syncState();
  }, [syncState]);

  const passBlockChallenge = useCallback((playerId: string) => {
    if (!engineRef.current) return;
    engineRef.current.passBlockChallenge(playerId);
    syncState();
  }, [syncState]);

  const resolveAction = useCallback(() => {
    if (!engineRef.current) return;
    const result = engineRef.current.resolvePendingAction();
    syncState();
    return result;
  }, [syncState]);

  const revealInfluence = useCallback((playerId: string, influenceId: string) => {
    if (!engineRef.current) return;
    engineRef.current.revealInfluence(playerId, influenceId);
    syncState();
  }, [syncState]);

  const exchangeCards = useCallback((playerId: string, influenceIds: string[]) => {
    if (!engineRef.current) return;
    engineRef.current.exchangeCards(playerId, influenceIds);
    syncState();
  }, [syncState]);

  const endTurn = useCallback(() => {
    if (!engineRef.current) return;
    engineRef.current.endTurn();
    syncState();
  }, [syncState]);

  const step = useCallback(() => {
    if (!engineRef.current) return;
    engineRef.current.step();
    syncState();
  }, [syncState]);

  return {
    state,
    initGame,
    declareAction,
    challenge,
    passChallenge,
    declareBlock,
    challengeBlock,
    passBlock,
    passBlockChallenge,
    resolveAction,
    revealInfluence,
    exchangeCards,
    endTurn,
    step
  };
};
