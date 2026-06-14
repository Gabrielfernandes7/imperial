import { GameEngine } from '../engine/GameEngine';
import { ActionType } from '../models/ActionType';
import { CharacterType } from '../models/Character';
import { GamePhase } from '../models/GamePhase';

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`Assertion Failed: ${message}`);
}

console.log('--- Running Sprint 3A Validation ---');

const truthfulEngine = new GameEngine(['Gabriel', 'Bot 1', 'Bot 2']);
truthfulEngine.startGame();
const [truthfulActor, truthfulChallenger] = truthfulEngine.debugState().players;
truthfulActor.influences[0].character.type = CharacterType.DUQUE;

truthfulEngine.declareAction({ actorId: truthfulActor.id, type: ActionType.RECEBER_IMPOSTO });
truthfulEngine.challenge(truthfulChallenger.id);
assert(
  truthfulEngine.getState().phase === GamePhase.SELECTING_CARD_TO_REVEAL,
  'Losing challenger must select an influence',
);
truthfulEngine.revealInfluence(truthfulChallenger.id, truthfulChallenger.influences[0].id);
assert(truthfulEngine.getState().phase === GamePhase.ACTION_DECLARED, 'Truthful action should continue');
truthfulEngine.resolvePendingAction();
assert(truthfulActor.coins === 5, 'Truthful Tax should resolve');

const bluffEngine = new GameEngine(['Gabriel', 'Bot 1', 'Bot 2']);
bluffEngine.startGame();
const [bluffer, bluffChallenger] = bluffEngine.debugState().players;
bluffer.influences.forEach((item) => {
  item.character.type = CharacterType.CONDESSA;
});

bluffEngine.declareAction({ actorId: bluffer.id, type: ActionType.RECEBER_IMPOSTO });
bluffEngine.challenge(bluffChallenger.id);
bluffEngine.revealInfluence(bluffer.id, bluffer.influences[0].id);
assert(bluffEngine.getState().phase === GamePhase.TURN_END, 'Bluffed action should be cancelled');
assert(bluffer.coins === 2, 'Cancelled Tax should not award coins');

console.log('--- Sprint 3A Validation Successful ---');
