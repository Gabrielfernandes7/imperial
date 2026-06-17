import { Influence } from './Influence';
import { BotPersonalityType } from './BotPersonality';

export interface Player {
  id: string;
  name: string;
  coins: number;
  influences: Influence[];
  alive: boolean;
  isBot: boolean;
  botPersonality?: BotPersonalityType;
}
