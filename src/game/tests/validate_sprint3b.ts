import { GameEngine } from '../engine/GameEngine';
import { ActionType } from '../models/ActionType';
import { CharacterType } from '../models/Character';
import { GamePhase } from '../models/GamePhase';

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`Assertion Failed: ${message}`);
}

console.log('--- Running Sprint 3B Validation ---');

const acceptedEngine = new GameEngine(['Gabriel', 'Bot 1', 'Bot 2']);
acceptedEngine.startGame();
const [actor, blocker, observer] = acceptedEngine.debugState().players;
acceptedEngine.declareAction({ actorId: actor.id, type: ActionType.ARRECADACAO_PUBLICA });
acceptedEngine.declareBlock(blocker.id, CharacterType.DUQUE);
acceptedEngine.passBlockChallenge(actor.id);
acceptedEngine.passBlockChallenge(observer.id);
assert(acceptedEngine.getState().phase === GamePhase.TURN_END, 'Accepted block cancels action');
assert(actor.coins === 2, 'Blocked Foreign Aid awards no coins');

const trueBlockEngine = new GameEngine(['Gabriel', 'Bot 1', 'Bot 2']);
trueBlockEngine.startGame();
const [trueActor, trueBlocker] = trueBlockEngine.debugState().players;
trueBlocker.influences[0].character.type = CharacterType.DUQUE;
trueBlockEngine.declareAction({ actorId: trueActor.id, type: ActionType.ARRECADACAO_PUBLICA });
trueBlockEngine.declareBlock(trueBlocker.id, CharacterType.DUQUE);
trueBlockEngine.challengeBlock(trueActor.id);
trueBlockEngine.revealInfluence(trueActor.id, trueActor.influences[0].id);
assert(trueBlockEngine.getState().phase === GamePhase.TURN_END, 'Truthful block cancels action');

const falseBlockEngine = new GameEngine(['Gabriel', 'Bot 1', 'Bot 2']);
falseBlockEngine.startGame();
const [falseActor, falseBlocker] = falseBlockEngine.debugState().players;
falseBlocker.influences.forEach((item) => {
  item.character.type = CharacterType.CONDESSA;
});
falseBlockEngine.declareAction({ actorId: falseActor.id, type: ActionType.ARRECADACAO_PUBLICA });
falseBlockEngine.declareBlock(falseBlocker.id, CharacterType.DUQUE);
falseBlockEngine.challengeBlock(falseActor.id);
falseBlockEngine.revealInfluence(falseBlocker.id, falseBlocker.influences[0].id);
assert(falseBlockEngine.getState().phase === GamePhase.ACTION_DECLARED, 'False block should be removed');
falseBlockEngine.resolvePendingAction();
assert(falseActor.coins === 4, 'Action should resolve after false block');

console.log('--- Sprint 3B Validation Successful ---');
