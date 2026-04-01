import { StateCreator } from 'zustand';
import { BookDeltaEvent } from '../../types';

export interface OrderBookLevel {
  price: number;
  size: number;
  total: number;
}

export interface OrderBookSlice {
  // Keyed by symbol
  books: Record<string, {
    bids: OrderBookLevel[];
    asks: OrderBookLevel[];
    lastUpdateId: number;
  }>;
  applyOrderBookDelta: (delta: BookDeltaEvent) => void;
}

export const createOrderBookSlice: StateCreator<OrderBookSlice, [], [], OrderBookSlice> = (set) => ({
  books: {},
  applyOrderBookDelta: (delta: BookDeltaEvent) =>
    set((state: OrderBookSlice) => {
      // In a real app we'd maintain the full book. 
      // For the mock stream, we expect the worker to handle complex normalization.
      // This is the slice mapping the normalized worker output to the store.
      
      const transform = (levels: [number, number][]): OrderBookLevel[] => {
        let total = 0;
        return levels.map(([price, size]) => {
          total += size;
          return { price, size, total };
        });
      };

      return {
        books: {
          ...state.books,
          [delta.sym]: {
            bids: transform(delta.bids),
            asks: transform(delta.asks),
            lastUpdateId: delta.ts,
          },
        },
      };
    }),
});
