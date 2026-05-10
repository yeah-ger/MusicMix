import { create } from 'zustand';
import type { AppPhase } from '../types';

export interface AppState {
  phase: AppPhase;
  isTransitioning: boolean;
  beginEmergence: () => void;
  returnToVoid: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  phase: 'void',
  isTransitioning: false,

  beginEmergence: () => {
    const { phase, isTransitioning } = get();
    if (phase !== 'void' || isTransitioning) return;
    set({ phase: 'emerging', isTransitioning: true });
    setTimeout(() => {
      set({ phase: 'emerged', isTransitioning: false });
    }, 1000);
  },

  returnToVoid: () => {
    const { phase, isTransitioning } = get();
    if (phase === 'void' || isTransitioning) return;
    set({ phase: 'void', isTransitioning: false });
  },
}));
