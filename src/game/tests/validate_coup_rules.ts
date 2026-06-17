import { GameEngine } from '../engine/GameEngine';
import { ActionType } from '../models/ActionType';
import { CharacterType } from '../models/Character';
import { GamePhase } from '../models/GamePhase';

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`Assertion Failed: ${message}`);
}

console.log('--- Running Coup Rules Validation ---');

const assassinationEngine = new GameEngine(['Gabriel', 'Bot 1', 'Bot 2']);
assassinationEngine.startGame();
const [assassin, target, observer] = assassinationEngine.debugState().players;
assassin.coins = 3;
target.influences[0].character.type = CharacterType.CONDESSA;

assassinationEngine.declareAction({
  actorId: assassin.id,
  type: ActionType.CONSPIRACAO,
  targetId: target.id,
});
assert(assassin.coins === 0, 'Assassination cost must be paid on declaration');
assassinationEngine.passChallenge(target.id);
assassinationEngine.passChallenge(observer.id);
assassinationEngine.declareBlock(target.id, CharacterType.CONDESSA);
assassinationEngine.passBlockChallenge(assassin.id);
assassinationEngine.passBlockChallenge(observer.id);
assert(assassin.coins === 0, 'Blocked assassination must still cost 3 coins');

const challengeThenBlock = new GameEngine(['Gabriel', 'Bot 1', 'Bot 2']);
challengeThenBlock.startGame();
const [truthfulAssassin, challengedTarget, thirdPlayer] = challengeThenBlock.debugState().players;
truthfulAssassin.coins = 3;
truthfulAssassin.influences[0].character.type = CharacterType.ASSASSINO;
challengedTarget.influences[0].character.type = CharacterType.CONDESSA;
challengeThenBlock.declareAction({
  actorId: truthfulAssassin.id,
  type: ActionType.CONSPIRACAO,
  targetId: challengedTarget.id,
});
challengeThenBlock.challenge(challengedTarget.id);
challengeThenBlock.revealInfluence(challengedTarget.id, challengedTarget.influences[1].id);
assert(challengeThenBlock.getState().phase === GamePhase.BLOCK_WINDOW, 'Blocking remains possible after a failed challenge');
challengeThenBlock.declareBlock(challengedTarget.id, CharacterType.CONDESSA);
challengeThenBlock.passBlockChallenge(truthfulAssassin.id);
challengeThenBlock.passBlockChallenge(thirdPlayer.id);
assert(challengeThenBlock.getState().phase === GamePhase.TURN_END, 'Condessa should cancel assassination');

const finalChallengeEngine = new GameEngine(['Gabriel', 'Bot 1'], 0);
finalChallengeEngine.startGame();
const [finalActor, finalChallenger] = finalChallengeEngine.debugState().players;
finalActor.influences[0].character.type = CharacterType.DUQUE;
finalChallenger.influences[0].revealed = true;
finalChallengeEngine.declareAction({
  actorId: finalActor.id,
  type: ActionType.RECEBER_IMPOSTO,
});
finalChallengeEngine.challenge(finalChallenger.id);
finalChallengeEngine.revealInfluence(finalChallenger.id, finalChallenger.influences[1].id);
assert(
  finalChallengeEngine.getState().phase === GamePhase.GAME_OVER,
  'A failed final challenge must finish the game immediately',
);

const invalidEngine = new GameEngine(['Gabriel', 'Bot 1', 'Bot 2']);
invalidEngine.startGame();
const [invalidActor, invalidOpponent] = invalidEngine.debugState().players;
invalidEngine.declareAction({ actorId: invalidActor.id, type: ActionType.RECEBER_IMPOSTO });
assert(!invalidEngine.challenge(invalidActor.id).success, 'Actor cannot challenge own claim');

invalidEngine.passChallenge(invalidOpponent.id);
invalidEngine.passChallenge(invalidEngine.debugState().players[2].id);
invalidEngine.resolvePendingAction();
invalidEngine.endTurn();

const peekEngine = new GameEngine(['Gabriel', 'Bot 1', 'Bot 2']);
peekEngine.startGame();
const [diplomat, peekTarget, peekObserver] = peekEngine.debugState().players;
const targetInfluence = peekTarget.influences.find((influence) => !influence.revealed);
assert(Boolean(targetInfluence), 'Target must have a hidden influence to be spied');

peekEngine.declareAction({
  actorId: diplomat.id,
  type: ActionType.NEGOCIACAO,
  targetId: peekTarget.id,
  targetInfluenceId: targetInfluence!.id,
});
peekEngine.passChallenge(peekTarget.id);
peekEngine.passChallenge(peekObserver.id);

const peekResult = peekEngine.resolvePendingAction();
assert(Boolean(peekResult.peekedInfluence), 'Negotiation spy should return the peeked influence');
assert(peekEngine.getState().phase === GamePhase.TURN_END, 'Spy negotiation should wait at turn end');
assert(
  peekEngine.getState().privatePeekedInfluence?.targetPlayerId === peekTarget.id,
  'Spied influence should remain private until the turn ends',
);
assert(
  peekEngine.getState().privatePeekedInfluence?.influence.id === targetInfluence!.id,
  'The selected hidden influence should be the one shown privately',
);
peekEngine.endTurn();
assert(
  !peekEngine.getState().privatePeekedInfluence,
  'Private spy information should be cleared on the next turn',
);

console.log('--- Coup Rules Validation Successful ---');
