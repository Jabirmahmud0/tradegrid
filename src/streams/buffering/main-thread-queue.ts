import { NormalizedTrade, NormalizedCandle, BookDeltaEvent, HeatmapEvent } from '../../types';

export interface BatchedIngestionEvent {
  trades: NormalizedTrade[];
  candles: NormalizedCandle[];
  orderbooks: BookDeltaEvent[];
  heatmap: HeatmapEvent | null;
}

/**
 * Main-thread ingestion queue that accepts pre-coalesced batches from the worker.
 * Accumulates batches between RAF flush cycles.
 */
export class MainThreadIngestionQueue {
  private trades: NormalizedTrade[] = [];
  private candles: NormalizedCandle[] = [];
  private orderbooks: BookDeltaEvent[] = [];
  private heatmap: HeatmapEvent | null = null;
  private maxDepth: number;
  private size = 0;

  constructor(maxDepth = 10000) {
    this.maxDepth = maxDepth;
  }

  /** Accept a pre-coalesced batch from the worker */
  enqueueBatch(batch: BatchedIngestionEvent): void {
    if (this.size + batch.trades.length + batch.candles.length + batch.orderbooks.length >= this.maxDepth) {
      // Drop oldest to make room
      this.dropOldest(batch.trades.length + batch.candles.length + batch.orderbooks.length);
    }

    this.trades.push(...batch.trades);
    this.candles.push(...batch.candles);
    this.orderbooks.push(...batch.orderbooks);
    // Latest heatmap wins
    if (batch.heatmap) this.heatmap = batch.heatmap;
    this.size += batch.trades.length + batch.candles.length + batch.orderbooks.length + (batch.heatmap ? 1 : 0);
  }

  /** Drain all accumulated events into a raw format for FrameCoalescer */
  drain(): {
    trade: NormalizedTrade[];
    trades: NormalizedTrade[][];
    candle: NormalizedCandle[];
    orderbook: BookDeltaEvent[];
    heatmap: HeatmapEvent[];
  } {
    const result = {
      trade: this.trades,
      trades: [],
      candle: this.candles,
      orderbook: this.orderbooks,
      heatmap: this.heatmap ? [this.heatmap] : []
    };

    this.trades = [];
    this.candles = [];
    this.orderbooks = [];
    this.heatmap = null;
    this.size = 0;

    return result;
  }

  private dropOldest(incomingCount: number): void {
    const overflow = this.size + incomingCount - this.maxDepth;
    let dropped = 0;

    // Drop oldest trades first
    while (dropped < overflow && this.trades.length > 0) {
      this.trades.shift();
      this.size--;
      dropped++;
    }
    // Then orderbook deltas
    while (dropped < overflow && this.orderbooks.length > 0) {
      this.orderbooks.shift();
      this.size--;
      dropped++;
    }
    // Then candles
    while (dropped < overflow && this.candles.length > 0) {
      this.candles.shift();
      this.size--;
      dropped++;
    }
  }

  get currentSize(): number {
    return this.size;
  }
}
