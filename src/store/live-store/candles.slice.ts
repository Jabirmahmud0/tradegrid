import { StateCreator } from 'zustand';
import { NormalizedCandle, CandleInterval } from '../../types';
import { RingBuffer } from '../../lib/ring-buffer';
import { RETENTION_POLICIES } from '../../lib/retention';

export interface CandlesSlice {
  // Key: symbol-interval
  candles: Record<string, NormalizedCandle[]>;
  setCandle: (candle: NormalizedCandle) => void;
  setCandles: (symbol: string, interval: CandleInterval, candles: NormalizedCandle[]) => void;
}

export const createCandlesSlice: StateCreator<CandlesSlice, [], [], CandlesSlice> = (set) => {
  const buffers = new Map<string, RingBuffer<NormalizedCandle>>();

  const getBuffer = (key: string, interval: CandleInterval) => {
    if (!buffers.has(key)) {
      const retention = interval === '1m' ? RETENTION_POLICIES.CANDLES.MIN_1 : RETENTION_POLICIES.CANDLES.HOUR_1_PLUS;
      buffers.set(key, new RingBuffer<NormalizedCandle>(retention));
    }
    return buffers.get(key)!;
  };

  return {
    candles: {},
    setCandle: (candle: NormalizedCandle) =>
      set((state: CandlesSlice) => {
        const key = `${candle.sym}-${candle.interval}`;
        const buffer = getBuffer(key, candle.interval);

        const latest = buffer.latest(1);
        if (latest.length > 0 && latest[0].ts === candle.ts) {
          buffer.replaceLast(candle);
        } else {
          buffer.push(candle);
        }

        return {
          candles: {
            ...state.candles,
            [key]: buffer.toArray().reverse(), // Store newest first
          },
        };
      }),
    setCandles: (symbol: string, interval: CandleInterval, candles: NormalizedCandle[]) =>
      set((state: CandlesSlice) => {
        const key = `${symbol}-${interval}`;
        const buffer = getBuffer(key, interval);
        buffer.clear();
        // Assuming incoming block is newest-first, pushing in reverse to store chronological
        buffer.pushMany([...candles].reverse());

        return {
          candles: {
            ...state.candles,
            [key]: buffer.toArray().reverse(),
          },
        };
      }),
  };
};
