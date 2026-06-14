import { GameEngine } from '../engine/GameEngine';
import { ActionType } from '../models/ActionType';
import { GamePhase } from '../models/GamePhase';

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`Assertion Failed: ${message}`);
}

console.log('--- Running Sprint 2 Validation ---');

const engine = new GameEngine(['Gabriel', 'Bot 1', 'Bot 2']);
engine.startGame();
const [p1, p2, p3] = engine.debugState().players;

engine.declareAction({ actorId: p1.id, type: ActionType.COLETAR_IMPOSTOS_LOCAIS });
engine.resolvePendingAction();
assert(p1.coins === 3, 'Income should add 1 coin');
engine.endTurn();

engine.declareAction({ actorId: p2.id, type: ActionType.ARRECADACAO_PUBLICA });
engine.passBlock(p1.id);
engine.passBlock(p3.id);
engine.resolvePendingAction();
assert(p2.coins === 4, 'Foreign Aid should add 2 coins');
engine.endTurn();

engine.declareAction({ actorId: p3.id, type: ActionType.RECEBER_IMPOSTO });
engine.passChallenge(p1.id);
engine.passChallenge(p2.id);
engine.resolvePendingAction();
assert(p3.coins === 5, 'Tax should add 3 coins');
engine.endTurn();

engine.declareAction({ actorId: p1.id, type: ActionType.CONTRABANDO, targetId: p2.id });
engine.passChallenge(p2.id);
engine.passChallenge(p3.id);
engine.passBlock(p2.id);
engine.resolvePendingAction();
assert(p1.coins === 5, 'Steal should transfer 2 coins to actor');
assert(p2.coins === 2, 'Steal should remove 2 coins from target');

const coupEngine = new GameEngine(['Gabriel', 'Bot 1', 'Bot 2']);
coupEngine.startGame();
const [coupActor, coupTarget] = coupEngine.debugState().players;
coupActor.coins = 10;

const forcedResult = coupEngine.declareAction({
  actorId: coupActor.id,
  type: ActionType.COLETAR_IMPOSTOS_LOCAIS,
});
assert(!forcedResult.success, 'Income should be rejected with 10 coins');
assert(forcedResult.message.includes('obrigatório'), 'Error should mention mandatory coup');

coupEngine.declareAction({
  actorId: coupActor.id,
  type: ActionType.GOLPE_DE_ESTADO,
  targetId: coupTarget.id,
});
assert(coupActor.coins === 3, 'Coup cost should be paid when declared');
coupEngine.resolvePendingAction();
assert(coupEngine.getState().phase === GamePhase.SELECTING_CARD_TO_REVEAL, 'Target must choose an influence');
coupEngine.revealInfluence(coupTarget.id, coupTarget.influences[0].id);
assert(coupTarget.influences.filter((item) => item.revealed).length === 1, 'Coup removes one influence');

console.log('--- Sprint 2 Validation Successful ---');
