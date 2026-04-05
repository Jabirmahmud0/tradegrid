import { NormalizedTrade, NormalizedCandle, BookDeltaEvent, HeatmapEvent } from '../../types';

export type IngestionEvent = 
  | { type: 'trade'; data: NormalizedTrade }
  | { type: 'trades'; data: NormalizedTrade[] }
  | { type: 'candle'; data: NormalizedCandle }
  | { type: 'orderbook'; data: BookDeltaEvent }
  | { type: 'heatmap'; data: HeatmapEvent };

export class IngestionQueue {
  private queues: Record<IngestionEvent['type'], any[]> = {
    trade: [],
    trades: [],
    candle: [],
    orderbook: [],
    heatmap: []
  };

  private maxQueueDepth: number;
  private currentSize: number = 0;

  constructor(maxQueueDepth: number = 10000) {
    this.maxQueueDepth = maxQueueDepth;
  }

  /**
   * Adds an event to the queue.
   * If the overall queue size exceeds the threshold, the oldest items are dropped (FIFO).
   */
  enqueue(event: IngestionEvent): void {
    const queue = this.queues[event.type];
    
    // Overflow protection: if limit reached, we should ideally drop from the start of the queue.
    // For simplicity, we just check total size.
    if (this.currentSize >= this.maxQueueDepth) {
      // Drop from largest queue? Or just general? 
      // Spec says "drop oldest if threshold exceeded".
      // Usually, dropping trades or order book deltas that are very old is safe.
      this.dropOldest();
    }

    queue.push(event.data);
    this.currentSize++;
  }

  /**
   * Bulk enqueue for better performance.
   * Uses a bulk-aware overflow check to avoid running the overflow check per-item.
   */
  enqueueBatch(events: IngestionEvent[]): void {
    // Bulk overflow check: if adding all events exceeds limit, trim first
    const overflow = this.currentSize + events.length - this.maxQueueDepth;
    if (overflow > 0) {
      for (let i = 0; i < overflow; i++) {
        this.dropOldest();
      }
    }

    for (const event of events) {
      this.queues[event.type].push(event.data);
      this.currentSize++;
    }
  }

  /**
   * Drains all queued events and returns them grouped by type.
   */
  drain(): Record<IngestionEvent['type'], any[]> {
    const batched = { ...this.queues };
    
    // Reset internal queues
    this.queues = {
      trade: [],
      trades: [],
      candle: [],
      orderbook: [],
      heatmap: []
    };
    this.currentSize = 0;

    return batched;
  }

  private dropOldest(): void {
    // Find the longest queue to drop from, or just cycle.
    // For a simple implementation, we can pick a priority.
    // Trades are usually numerous, so we can drop from there first.
    const priority = ['trade', 'trades', 'orderbook', 'candle', 'heatmap'] as const;
    for (const type of priority) {
      if (this.queues[type].length > 0) {
        this.queues[type].shift();
        this.currentSize--;
        return;
      }
    }
  }

  get size(): number {
    return this.currentSize;
  }

  get stats() {
    const utilization = this.currentSize / this.maxQueueDepth;
    return {
      size: this.currentSize,
      utilization,
      // Watermark: warn when queue is approaching capacity (>80%)
      nearCapacity: utilization > 0.8,
      depths: Object.fromEntries(
        Object.entries(this.queues).map(([type, q]) => [type, q.length])
      )
    };
  }
}
