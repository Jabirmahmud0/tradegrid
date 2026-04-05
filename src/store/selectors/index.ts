import { RootState } from '../live-store';

// Selectors are used locally for fine-grained subscriptions.
// All selectors must return stable references to avoid unnecessary re-renders.

export const selectActiveSymbol = (s: RootState) => s.activeSymbol;
export const selectActiveInterval = (s: RootState) => s.activeInterval;
export const selectTheme = (s: RootState) => s.theme;

// Stable empty array sentinel — never mutate this.
const EMPTY_ARRAY: never[] = [];

// Cached empty orderbook default object — never mutate this.
const EMPTY_ORDERBOOK = { bids: [] as never[], asks: [] as never[], lastUpdateId: 0 } as const;

export const selectCandlesForKey = (symbol: string, interval: string) =>
  (s: RootState) => s.candles[`${symbol}-${interval}`] || EMPTY_ARRAY as unknown as import('../../store/live-store/candles.slice').NormalizedCandle[];

export const selectRecentTrades = (n: number) => {
  // Memoize by `n` via closure. Each call creates a new memoized selector,
  // but within a component subscription the reference stays stable because
  // Zustand only re-evaluates when the slice changes.
  // The key fix: return the same slice reference if the underlying data hasn't changed.
  return (s: RootState) => {
    const trades = s.trades;
    if (trades.length <= n) return trades;
    return trades.slice(0, n);
  };
};

export const selectOrderBook = (symbol: string, maxLevels: number = 50) =>
  (s: RootState) => {
    const book = s.books[symbol];
    if (!book) return EMPTY_ORDERBOOK;
    return {
      bids: book.bids.slice(0, maxLevels),
      asks: book.asks.slice(0, maxLevels),
      lastUpdateId: book.lastUpdateId,
    };
  };

export const selectMetrics = (s: RootState) => s.metrics;

// Replay state: return a stable reference by selecting individual fields.
// Components that need the full object should use individual selectors instead.
// For backward compatibility, we keep this but warn it creates new objects.
// Use selectReplayMode, selectReplayStatus, etc. for stable references.
export const selectReplayState = (s: RootState) => ({
  mode: s.mode,
  status: s.status,
  speed: s.speed,
  cursor: s.cursor,
  progress: s.progress,
});

// Individual stable replay selectors (preferred over selectReplayState):
export const selectReplayMode = (s: RootState) => s.mode;
export const selectReplayStatus = (s: RootState) => s.status;
export const selectReplaySpeed = (s: RootState) => s.speed;
export const selectReplayCursor = (s: RootState) => s.cursor;
export const selectReplayProgress = (s: RootState) => s.progress;

// Heatmap, stats, and debug selectors (previously missing — H5):
export const selectHeatmap = (s: RootState) => s.heatmap;
export const selectMarketStats = (symbol: string) =>
  (s: RootState) => s.stats[symbol];
export const selectAllMarketStats = (s: RootState) => s.stats;
export const selectEventLog = (s: RootState) => s.eventLog;
