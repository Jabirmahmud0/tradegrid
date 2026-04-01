import { StateCreator } from 'zustand';
import { NormalizedCandle, CandleInterval } from '../../types';

export interface CandlesSlice {
  // Key: symbol-interval
  candles: Record<string, NormalizedCandle[]>;
  updateCandle: (candle: NormalizedCandle) => void;
  setCandles: (symbol: string, interval: CandleInterval, candles: NormalizedCandle[]) => void;
}

export const createCandlesSlice: StateCreator<CandlesSlice, [], [], CandlesSlice> = (set) => ({
  candles: {},
  updateCandle: (candle: NormalizedCandle) =>
    set((state: CandlesSlice) => {
      const key = `${candle.sym}-${candle.interval}`;
      const existing = state.candles[key] || [];
      const retention = candle.interval === '1m' ? 500 : 200;

      // If timestamp matches existing, update; else prepend
      const lastIndex = existing.findIndex((c: NormalizedCandle) => c.ts === candle.ts);
      let next;
      if (lastIndex !== -1) {
        next = [...existing];
        next[lastIndex] = candle;
      } else {
        next = [candle, ...existing].slice(0, retention);
      }

      return {
        candles: {
          ...state.candles,
          [key]: next,
        },
      };
    }),
  setCandles: (symbol: string, interval: CandleInterval, candles: NormalizedCandle[]) =>
    set((state: CandlesSlice) => ({
      candles: {
        ...state.candles,
        [`${symbol}-${interval}`]: candles,
      },
    })),
});
