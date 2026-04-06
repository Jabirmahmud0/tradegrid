import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { createTradesSlice, TradesSlice } from './trades.slice';
import { createCandlesSlice, CandlesSlice } from './candles.slice';
import { createOrderBookSlice, OrderBookSlice } from './orderbook.slice';
import { createHeatmapSlice, HeatmapSlice } from './heatmap.slice';
import { createLayoutSlice, LayoutSlice } from '../ui-store/layout.slice';
import { createThemeSlice, ThemeSlice } from '../ui-store/theme.slice';
import { createReplaySlice, ReplaySlice } from './replay.slice';
import { createDebugSlice, DebugSlice } from './debug.slice';
import { createMarketStatsSlice, MarketStatsSlice } from './market-stats.slice';

export interface RootState
  extends TradesSlice,
          CandlesSlice,
          OrderBookSlice,
          HeatmapSlice,
          LayoutSlice,
          ThemeSlice,
          ReplaySlice,
          MarketStatsSlice,
          DebugSlice {
  /** Clear all market data (trades, candles, orderbook, heatmap, stats) */
  clearAllData: () => void;
}

export const useLiveStore = create<RootState>()(
  devtools(
    (...a) => ({
      ...createTradesSlice(...a),
      ...createCandlesSlice(...a),
      ...createOrderBookSlice(...a),
      ...createHeatmapSlice(...a),
      ...createLayoutSlice(...a),
      ...createThemeSlice(...a),
      ...createReplaySlice(...a),
      ...createDebugSlice(...a),
      ...createMarketStatsSlice(...a),
      clearAllData: () => {
        const tradesSlice = createTradesSlice(...a);
        const candlesSlice = createCandlesSlice(...a);
        tradesSlice.clearTrades();
        candlesSlice.clearAllCandles();
        a[0]({
          trades: [],
          candles: {},
          books: {},
          heatmap: null,
          stats: {},
        });
      },
    }),
    {
      name: 'TradeGrid Store',
      // Only enable devtools in development
      enabled: import.meta.env.DEV,
    }
  )
);
