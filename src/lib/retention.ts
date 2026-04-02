/**
 * Codified retention policies for different stream event types.
 * Defines the maximum number of items to keep in memory for RingBuffers.
 */
export const RETENTION_POLICIES = {
  /** Trade events (overall maximum) */
  TRADES: 500,

  /** Candle events per symbol */
  CANDLES: {
    /** 1 minute candles */
    MIN_1: 500,
    /** 1 hour or higher candles */
    HOUR_1_PLUS: 200,
  },

  /** Order book retention limits */
  ORDER_BOOK: {
    /** The number of deltas to retain along with the current snapshot */
    DELTAS: 100,
  },

  /** Heatmap history (keep the latest snapshot only) */
  HEATMAP: 1,

  /** Debug log panel events */
  DEBUG_LOG: 1000,
} as const;

export type RetentionPolicies = typeof RETENTION_POLICIES;
