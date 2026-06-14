export enum GameMode {
  INICIANTE = 'INICIANTE',
  NORMAL = 'NORMAL',
  AVANCADO = 'AVANCADO',
}

export interface GameConfig {
  mode: GameMode;
}
