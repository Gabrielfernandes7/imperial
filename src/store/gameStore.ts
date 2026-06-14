import { create } from 'zustand';
import { MatchState } from '../game/models/MatchState';

interface GameStore {
  state: MatchState | null;
  setState: (state: MatchState) => void;
  reset: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
  state: null,
  setState: (state) => set({ state }),
  reset: () => set({ state: null }),
}));
