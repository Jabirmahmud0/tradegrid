import { IngestionQueue } from '../ingestion/ingestion-queue';
import { FrameCoalescer } from './frame-coalescer';
import { useLiveStore } from '../../store/live-store';

export class RafFlushLoop {
  private queue: IngestionQueue;
  private running: boolean = false;
  private rafId: number | null = null;
  private lastFrameTime: number = 0;

  constructor(queue: IngestionQueue) {
    this.queue = queue;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.loop(performance.now());
  }

  stop(): void {
    this.running = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  private loop = (now: number): void => {
    if (!this.running) return;

    // Measure frame interval
    const delta = now - this.lastFrameTime;
    this.lastFrameTime = now;

    // Drain and coalesce
    const rawEvents = this.queue.drain();
    const frame = FrameCoalescer.coalesce(rawEvents);

    // Batch updates to state
    this.flushToStore(frame);

    // Track performance metrics (optional here, but we can update debug slice)
    this.updateMetrics(delta, this.queue.size);

    this.rafId = requestAnimationFrame(this.loop);
  };

  private flushToStore(frame: ReturnType<typeof FrameCoalescer.coalesce>): void {
    const store = useLiveStore.getState();

    // 1. Trades: Single dispatch for all
    if (frame.trades.length > 0) {
      store.addTrades(frame.trades);
    }

    // 2. Candles: Map iteration
    frame.candles.forEach((candle) => {
      store.setCandle(candle);
    });

    // 3. Orderbooks: Symbols' multiple deltas applied at once
    frame.orderbooks.forEach((deltas) => {
      // Assuming existing slice can handle array of deltas or just iterate
      // Current spec asks to coalesce, if the slice supports applyOrderBookBatch it's better.
      // For now, iterate if it's not batch-capable.
      deltas.forEach(d => store.applyOrderBookDelta(d));
    });

    // 4. Heatmap
    if (frame.heatmap) {
      store.updateHeatmap(frame.heatmap);
    }
  }

  private updateMetrics(frameTime: number, queueDepth: number): void {
    const store = useLiveStore.getState();
    const fps = frameTime > 0 ? 1000 / frameTime : 0;
    
    store.setMetrics({
      fps,
      frameTime,
      queueDepth,
      // Dropped frames check (if > 33ms, we missed a frame budget)
      droppedFrames: frameTime > 33 ? 1 : 0
    });
  }
}
