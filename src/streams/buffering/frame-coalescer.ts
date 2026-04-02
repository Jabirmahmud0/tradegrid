import { NormalizedTrade, NormalizedCandle, BookDeltaEvent, HeatmapEvent } from '../../types';

export interface CoalescedFrame {
  trades: NormalizedTrade[];
  candles: Map<string, NormalizedCandle>;
  orderbooks: Map<string, BookDeltaEvent[]>;
  heatmap: HeatmapEvent | null;
}

export class FrameCoalescer {
  /**
   * Coalesces a batch of raw queued events into a single, optimized frame update.
   */
  static coalesce(raw: {
    trade: NormalizedTrade[];
    trades: NormalizedTrade[][];
    candle: NormalizedCandle[];
    orderbook: BookDeltaEvent[];
    heatmap: HeatmapEvent[];
  }): CoalescedFrame {
    const frame: CoalescedFrame = {
      trades: [],
      candles: new Map(),
      orderbooks: new Map(),
      heatmap: null
    };

    // 1. Trades: Coalesce all into a single list
    frame.trades = [...raw.trade, ...raw.trades.flat()];

    // 2. Candles: Keep the latest record for symbol-interval
    for (const candle of raw.candle) {
      const key = `${candle.sym}-${candle.interval}`;
      frame.candles.set(key, candle);
    }

    // 3. Order Book: Group deltas per symbol to be applied in bulk
    for (const delta of raw.orderbook) {
      const key = delta.sym;
      if (!frame.orderbooks.has(key)) {
        frame.orderbooks.set(key, []);
      }
      frame.orderbooks.get(key)!.push(delta);
    }

    // 4. Heatmap: Latest snapshot wins
    if (raw.heatmap.length > 0) {
      frame.heatmap = raw.heatmap[raw.heatmap.length - 1];
    }

    return frame;
  }
}
