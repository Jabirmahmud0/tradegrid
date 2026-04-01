import { RootState } from '../live-store';

// Selectors are used locally for fine-grained subscriptions
// Exporting them facilitates reuse and testing

export const selectActiveSymbol = (s: RootState) => s.activeSymbol;
export const selectActiveInterval = (s: RootState) => s.activeInterval;
export const selectTheme = (s: RootState) => s.theme;

export const selectCandlesForKey = (symbol: string, interval: string) => 
  (s: RootState) => s.candles[`${symbol}-${interval}`] || [];

export const selectRecentTrades = (n: number) => 
  (s: RootState) => s.trades.slice(0, n);

export const selectOrderBook = (symbol: string) => 
  (s: RootState) => s.books[symbol] || { bids: [], asks: [], lastUpdateId: 0 };

export const selectMetrics = (s: RootState) => s.metrics;
export const selectReplayState = (s: RootState) => ({
  isReplaying: s.isReplaying,
  isPaused: s.isPaused,
  speed: s.speed,
  currentTime: s.currentTime,
  progress: s.progress,
});
