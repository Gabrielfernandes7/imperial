import { Character, CHARACTERS, CharacterType } from '../models/Character';
import { GameRules } from './GameRules';
import { shuffle } from '../utils/shuffle';

export class DeckBuilder {
  static buildDeck(): Character[] {
    const deck: Character[] = [];
    const characterTypes = Object.values(CharacterType);

    characterTypes.forEach((type) => {
      const character = CHARACTERS[type];
      for (let i = 0; i < GameRules.CARDS_PER_CHARACTER; i++) {
        deck.push({ ...character });
      }
    });

    return shuffle(deck);
  }
}
