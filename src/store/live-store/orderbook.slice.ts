import { StateCreator } from 'zustand';
import { BookDeltaEvent } from '../../types';

export interface OrderBookLevel {
  price: number;
  size: number;
  total: number;
}

export interface OrderBookSlice {
  books: Record<string, {
    bids: OrderBookLevel[];
    asks: OrderBookLevel[];
    lastUpdateId: number;
  }>;
  setOrderBookSnapshot: (symbol: string, bids: [number, number][], asks: [number, number][], updateId: number) => void;
  applyOrderBookDelta: (delta: BookDeltaEvent) => void;
}

function buildLevels(levels: [number, number][], side: 'bid' | 'ask'): OrderBookLevel[] {
  const priceMap = new Map<number, number>();

  for (const [price, size] of levels) {
    if (size === 0) {
      priceMap.delete(price);
    } else {
      priceMap.set(price, size);
    }
  }

  const sorted = Array.from(priceMap.entries()).sort((a, b) =>
    side === 'bid' ? b[0] - a[0] : a[0] - b[0]
  );

  let total = 0;
  return sorted.map(([price, size]) => {
    total += size;
    return { price, size, total };
  });
}

export const createOrderBookSlice: StateCreator<OrderBookSlice, [], [], OrderBookSlice> = (set) => ({
  books: {},
  setOrderBookSnapshot: (symbol: string, bids: [number, number][], asks: [number, number][], updateId: number) =>
    set((state: OrderBookSlice) => ({
      books: {
        ...state.books,
        [symbol]: {
          bids: buildLevels(bids, 'bid'),
          asks: buildLevels(asks, 'ask'),
          lastUpdateId: updateId,
        },
      },
    })),
  applyOrderBookDelta: (delta: BookDeltaEvent) =>
    set((state: OrderBookSlice) => ({
      books: {
        ...state.books,
        [delta.sym]: {
          bids: buildLevels(delta.bids, 'bid'),
          asks: buildLevels(delta.asks, 'ask'),
          lastUpdateId: delta.ts,
        },
      },
    })),
});
