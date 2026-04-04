import { StateCreator } from 'zustand';

export interface MarketStats {
  price: number;
  prevPrice: number;
  change24h: number;
  changePercent24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
}

export interface MarketStatsSlice {
  stats: Record<string, MarketStats>;
  updateMarketStats: (symbol: string, stats: MarketStats) => void;
}

export const createMarketStatsSlice: StateCreator<MarketStatsSlice, [], [], MarketStatsSlice> = (set) => ({
  stats: {},
  updateMarketStats: (symbol, stats) => set((state) => ({
    stats: {
      ...state.stats,
      [symbol]: stats
    }
  })),
});
