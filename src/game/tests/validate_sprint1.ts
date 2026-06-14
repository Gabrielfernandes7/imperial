import { GameEngine } from '../engine/GameEngine';
import { DeckBuilder } from '../rules/DeckBuilder';
import { shuffle } from '../utils/shuffle';
import { GameRules } from '../rules/GameRules';
import { GamePhase } from '../models/GamePhase';
import { CharacterType } from '../models/Character';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
}

console.log('--- Running Sprint 1 Validation ---');

// 1. Shuffle Test
console.log('Testing Shuffle...');
const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const shuffled = shuffle(items);
assert(shuffled.length === items.length, 'Shuffled length should be the same');
assert(shuffled.every(i => items.includes(i)), 'Shuffled items should be the same');
console.log('Shuffle OK');

// 2. DeckBuilder Test
console.log('Testing DeckBuilder...');
const deck = DeckBuilder.buildDeck();
assert(deck.length === 15, 'Deck should have 15 cards');
const counts: Record<string, number> = {};
deck.forEach(card => {
  counts[card.type] = (counts[card.type] || 0) + 1;
});
Object.values(CharacterType).forEach(type => {
  assert(counts[type] === 3, `Each character should have 3 cards, ${type} has ${counts[type]}`);
});
console.log('DeckBuilder OK');

// 3. GameEngine Test
console.log('Testing GameEngine...');
const engine = new GameEngine(['Gabriel', 'Bot 1', 'Bot 2']);
assert(engine.getState().phase === GamePhase.SETUP, 'Should start in SETUP phase');
assert(engine.getState().players.length === 3, 'Should have 3 players');

engine.startGame();
const state = engine.getState();
assert(state.phase === GamePhase.TURN_START, 'Should be in TURN_START phase after startGame');
assert(state.turnNumber === 1, 'Should be turn 1');
assert(state.deck.length === 15 - (3 * 2), 'Deck should have 9 cards left (15 - 3 players * 2 cards)');

state.players.forEach(player => {
  assert(player.coins === GameRules.STARTING_COINS, `${player.name} should have 2 coins`);
  assert(player.influences.length === GameRules.STARTING_INFLUENCES, `${player.name} should have 2 influences`);
  assert(player.influences.every(inf => !inf.revealed), 'Influences should be hidden');
});

assert(engine.getCurrentPlayer().name === 'Gabriel', 'First player should be Gabriel');
console.log('GameEngine OK');

console.log('--- Sprint 1 Validation Successful ---');
console.log(JSON.stringify(engine.getState(), null, 2));
