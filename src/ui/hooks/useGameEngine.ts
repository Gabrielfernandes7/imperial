import { useState, useCallback, useRef } from 'react';
import { GameEngine } from '../../game/engine/GameEngine';
import { MatchState } from '../../game/models/MatchState';
import { Action } from '../../game/models/Action';
import { CharacterType } from '../../game/models/Character';
import { GameMode } from '../../game/models/GameMode';

export const useGameEngine = (playerNames: string[], mode: GameMode) => {
  const engineRef = useRef<GameEngine | null>(null);
  const [state, setState] = useState<MatchState | null>(null);

  const initGame = useCallback(() => {
    const engine = new GameEngine(playerNames, 0, { mode });
    engine.startGame();
    engineRef.current = engine;
    setState(engine.getState());
  }, [mode, playerNames]);

  const declareAction = useCallback((action: Action) => {
    if (!engineRef.current) return;
    engineRef.current.declareAction(action);
    setState(engineRef.current.getState());
  }, []);

  const challenge = useCallback((challengerId: string) => {
    if (!engineRef.current) return;
    engineRef.current.challenge(challengerId);
    setState(engineRef.current.getState());
  }, []);

  const passChallenge = useCallback((playerId: string) => {
    if (!engineRef.current) return;
    engineRef.current.passChallenge(playerId);
    setState(engineRef.current.getState());
  }, []);

  const declareBlock = useCallback((blockerId: string, charType: CharacterType) => {
    if (!engineRef.current) return;
    engineRef.current.declareBlock(blockerId, charType);
    setState(engineRef.current.getState());
  }, []);

  const challengeBlock = useCallback((challengerId: string) => {
    if (!engineRef.current) return;
    engineRef.current.challengeBlock(challengerId);
    setState(engineRef.current.getState());
  }, []);

  const passBlock = useCallback((playerId: string) => {
    if (!engineRef.current) return;
    engineRef.current.passBlock(playerId);
    setState(engineRef.current.getState());
  }, []);

  const passBlockChallenge = useCallback((playerId: string) => {
    if (!engineRef.current) return;
    engineRef.current.passBlockChallenge(playerId);
    setState(engineRef.current.getState());
  }, []);

  const resolveAction = useCallback(() => {
    if (!engineRef.current) return;
    const result = engineRef.current.resolvePendingAction();
    setState(engineRef.current.getState());
    return result;
  }, []);

  const revealInfluence = useCallback((playerId: string, influenceId: string) => {
    if (!engineRef.current) return;
    engineRef.current.revealInfluence(playerId, influenceId);
    setState(engineRef.current.getState());
  }, []);

  const exchangeCards = useCallback((playerId: string, influenceIds: string[]) => {
    if (!engineRef.current) return;
    engineRef.current.exchangeCards(playerId, influenceIds);
    setState(engineRef.current.getState());
  }, []);

  const endTurn = useCallback(() => {
    if (!engineRef.current) return;
    engineRef.current.endTurn();
    setState(engineRef.current.getState());
  }, []);

  const step = useCallback(() => {
    if (!engineRef.current) return;
    engineRef.current.step();
    setState(engineRef.current.getState());
  }, []);

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
