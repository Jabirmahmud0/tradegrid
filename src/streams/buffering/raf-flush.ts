import { IngestionQueue } from '../ingestion/ingestion-queue';
import { FrameCoalescer } from './frame-coalescer';
import { useLiveStore } from '../../store/live-store';
import { PerformanceTracker } from '../../lib/perf/performance-tracker';

export class RafFlushLoop {
  private queue: IngestionQueue;
  private running: boolean = false;
  private rafId: number | null = null;
  private lastFrameTime: number = 0;
  private tracker: PerformanceTracker;

  constructor(queue: IngestionQueue) {
    this.queue = queue;
    this.tracker = new PerformanceTracker();
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastFrameTime = performance.now();
    this.rafId = requestAnimationFrame(this.loop);
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

    const frameDuration = now - this.lastFrameTime;
    this.lastFrameTime = now;

    // Handle performance tracking
    const wasDropped = frameDuration > 33.4; // missed 2 frames @ 60fps
    this.tracker.recordFrame(frameDuration, wasDropped);

    // Drain and coalesce
    const rawEvents = this.queue.drain();
    
    // Track each raw event for EPS in the tracker
    // (This ensures EPS corresponds to truth events passed from worker)
    this.recordEventsInTracker(rawEvents);

    const frame = FrameCoalescer.coalesce(rawEvents);

    // Batch updates to state
    this.flushToStore(frame);

    // Periodically update debug metrics in store (every frame or damped)
    this.updateMetrics();

    this.rafId = requestAnimationFrame(this.loop);
  };

  private recordEventsInTracker(raw: any) {
    // Record each event in our tracker for EPS window
    raw.trade.forEach((e: any) => this.tracker.recordEvent(e.ts));
    raw.trades.forEach((batch: any) => batch.forEach((e: any) => this.tracker.recordEvent(e.ts)));
    raw.candle.forEach((e: any) => this.tracker.recordEvent(e.ts));
    raw.orderbook.forEach((e: any) => this.tracker.recordEvent(e.ts));
    raw.heatmap.forEach((e: any) => this.tracker.recordEvent(e.ts));
  }

  private flushToStore(frame: ReturnType<typeof FrameCoalescer.coalesce>): void {
    const store = useLiveStore.getState();

    if (frame.trades.length > 0) {
      store.addTrades(frame.trades);
    }

    frame.candles.forEach((candle) => {
      store.setCandle(candle);
    });

    frame.orderbooks.forEach((deltas) => {
      deltas.forEach(d => store.applyOrderBookDelta(d));
    });

    if (frame.heatmap) {
      store.updateHeatmap(frame.heatmap);
    }
  }

  private updateMetrics(): void {
    const store = useLiveStore.getState();
    const snapshot = this.tracker.getSnapshot(this.queue.size);

    store.setMetrics({
      fps: 1000 / (snapshot.frameTime || 16.6),
      eventsPerSec: snapshot.eps,
      dispatchLatency: snapshot.avgLatency,
      queueDepth: snapshot.queueDepth,
      droppedFrames: snapshot.droppedFrames,
      frameTime: snapshot.frameTime
    });
  }
}
