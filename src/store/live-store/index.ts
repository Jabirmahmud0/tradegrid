import { create } from 'zustand';
import { createTradesSlice, TradesSlice } from './trades.slice';
import { createCandlesSlice, CandlesSlice } from './candles.slice';
import { createOrderBookSlice, OrderBookSlice } from './orderbook.slice';
import { createHeatmapSlice, HeatmapSlice } from './heatmap.slice';
import { createLayoutSlice, LayoutSlice } from '../ui-store/layout.slice';
import { createThemeSlice, ThemeSlice } from '../ui-store/theme.slice';
import { createReplaySlice, ReplaySlice } from './replay.slice';
import { createDebugSlice, DebugSlice } from './debug.slice';

export interface RootState 
  extends TradesSlice, 
          CandlesSlice, 
          OrderBookSlice, 
          HeatmapSlice, 
          LayoutSlice, 
          ThemeSlice, 
          ReplaySlice, 
          DebugSlice {}

export const useLiveStore = create<RootState>()((...a) => ({
  ...createTradesSlice(...a),
  ...createCandlesSlice(...a),
  ...createOrderBookSlice(...a),
  ...createHeatmapSlice(...a),
  ...createLayoutSlice(...a),
  ...createThemeSlice(...a),
  ...createReplaySlice(...a),
  ...createDebugSlice(...a),
}));
