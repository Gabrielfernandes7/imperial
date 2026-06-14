export enum CharacterType {
  DUQUE = 'DUQUE',
  ASSASSINO = 'ASSASSINO',
  CAPITAO = 'CAPITAO',
  EMBAIXADOR = 'EMBAIXADOR',
  CONDESSA = 'CONDESSA',
}

export interface Character {
  type: CharacterType;
  name: string;
  description: string;
}

export const CHARACTERS: Record<CharacterType, Character> = {
  [CharacterType.DUQUE]: {
    type: CharacterType.DUQUE,
    name: 'Barão do Café',
    description: 'Recebe 3 moedas. Bloqueia Arrecadação Pública.',
  },
  [CharacterType.ASSASSINO]: {
    type: CharacterType.ASSASSINO,
    name: 'Capanga',
    description: 'Paga 3 moedas para remover uma influência. Bloqueável pela Marquesa.',
  },
  [CharacterType.CAPITAO]: {
    type: CharacterType.CAPITAO,
    name: 'Corsário',
    description: 'Rouba até 2 moedas. Bloqueável por Corsário ou Diplomata.',
  },
  [CharacterType.EMBAIXADOR]: {
    type: CharacterType.EMBAIXADOR,
    name: 'Diplomata',
    description: 'Troca cartas com o baralho. Bloqueia Contrabando.',
  },
  [CharacterType.CONDESSA]: {
    type: CharacterType.CONDESSA,
    name: 'Marquesa',
    description: 'Bloqueia Conspiração (Assassinato).',
  },
};
