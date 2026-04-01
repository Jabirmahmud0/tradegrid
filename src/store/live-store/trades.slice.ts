import { StateCreator } from 'zustand';
import { NormalizedTrade } from '../../types';

export interface TradesSlice {
  trades: NormalizedTrade[];
  addTrades: (newTrades: NormalizedTrade[]) => void;
  clearTrades: () => void;
}

export const createTradesSlice: StateCreator<TradesSlice> = (set) => ({
  trades: [],
  addTrades: (newTrades) =>
    set((state) => ({
      // Ring buffer logic: keep last 500
      trades: [...newTrades, ...state.trades].slice(0, 500),
    })),
  clearTrades: () => set({ trades: [] }),
});
