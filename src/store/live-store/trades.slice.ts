import { StateCreator } from 'zustand';
import { NormalizedTrade } from '../../types';
import { RingBuffer } from '../../lib/ring-buffer';
import { RETENTION_POLICIES } from '../../lib/retention';

export interface TradesSlice {
  trades: NormalizedTrade[];
  addTrades: (newTrades: NormalizedTrade[]) => void;
  clearTrades: () => void;
}

export const createTradesSlice: StateCreator<TradesSlice, [], [], TradesSlice> = (set) => {
  const buffer = new RingBuffer<NormalizedTrade>(RETENTION_POLICIES.TRADES);

  return {
    trades: [],
    addTrades: (newTrades: NormalizedTrade[]) => {
      // Push new trades to buffer
      buffer.pushMany(newTrades);
      
      set({
        // Extract to array and reverse to keep newest items first, matching the old behavior
        trades: buffer.toArray().reverse(),
      });
    },
    clearTrades: () => {
      buffer.clear();
      set({ trades: [] });
    },
  };
};
