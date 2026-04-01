import { StoreState } from '../live-store';

// Selectors are used locally for fine-grained subscriptions
// Exporting them facilitates reuse and testing

export const selectActiveSymbol = (s: StoreState) => s.activeSymbol;
export const selectActiveInterval = (s: StoreState) => s.activeInterval;
export const selectTheme = (s: StoreState) => s.theme;

export const selectCandlesForKey = (symbol: string, interval: string) => 
  (s: StoreState) => s.candles[`${symbol}-${interval}`] || [];

export const selectRecentTrades = (n: number) => 
  (s: StoreState) => s.trades.slice(0, n);

export const selectOrderBook = (symbol: string) => 
  (s: StoreState) => s.books[symbol] || { bids: [], asks: [], lastUpdateId: 0 };

export const selectMetrics = (s: StoreState) => s.metrics;
export const selectReplayState = (s: StoreState) => ({
  isReplaying: s.isReplaying,
  isPaused: s.isPaused,
  speed: s.speed,
  currentTime: s.currentTime,
  progress: s.progress,
});
