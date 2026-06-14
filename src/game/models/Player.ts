import { Influence } from './Influence';

export interface Player {
  id: string;
  name: string;
  coins: number;
  influences: Influence[];
  alive: boolean;
  isBot: boolean;
}
