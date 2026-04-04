import { MainThreadIngestionQueue, BatchedIngestionEvent } from './main-thread-queue';
import { FrameCoalescer } from './frame-coalescer';
import { useLiveStore } from '../../store/live-store';
import { PerformanceTracker } from '../../lib/perf/performance-tracker';

/**
 * Main-thread RAF flush loop.
 * Receives batched events from the worker via the ingestion queue,
 * coalesces them per-frame, and dispatches a single batched update to Zustand.
 *
 * Workers can't use requestAnimationFrame, so the 16ms flush on the worker side
 * is the worker-equivalent. The main thread then uses rAF for frame-synced dispatch.
 */
class RafFlushController {
  private queue: MainThreadIngestionQueue;
  private tracker: PerformanceTracker;
  private running = false;
  private rafId: number | null = null;
  private lastFrameTime = 0;
  private lastEnqueueTime = 0; // For dispatch latency measurement
  private lastHeatmapUpdate = 0; // Throttle heatmap to avoid flicker
  private readonly HEATMAP_THROTTLE_MS = 2000;

  constructor() {
    this.queue = new MainThreadIngestionQueue(10000);
    this.tracker = new PerformanceTracker();
  }

  /** Enqueue a batch from the worker (called by market-client on BATCH_DATA) */
  enqueue(batch: BatchedIngestionEvent): void {
    this.lastEnqueueTime = performance.now();
    this.queue.enqueueBatch(batch);
    // Count events for EPS tracking (don't use unix timestamps — mixes clocks)
    const totalEvents = batch.trades.length + batch.candles.length + batch.orderbooks.length + (batch.heatmap ? 1 : 0);
    for (let i = 0; i < totalEvents; i++) {
      this.tracker.recordEvent();
    }

    // Auto-start on first enqueue if not running
    if (!this.running) this.start();
  }

  private start(): void {
    if (this.running) return;
    this.running = true;
    this.lastFrameTime = performance.now();
    this.rafId = requestAnimationFrame(this.loop);
  }

  /** Stop the flush loop (called on disconnect) */
  stop(): void {
    this.running = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    // Clear queue on stop
    this.queue = new MainThreadIngestionQueue(10000);
  }

  private loop = (now: number): void => {
    if (!this.running) return;

    const frameDuration = now - this.lastFrameTime;
    this.lastFrameTime = now;

    const wasDropped = frameDuration > 33.4;
    this.tracker.recordFrame(frameDuration, wasDropped);

    // Drain and coalesce into a single frame
    const rawEvents = this.queue.drain();
    const frame = FrameCoalescer.coalesce(rawEvents);

    // Flush to Zustand
    this.flushToStore(frame);

    // Update debug metrics
    this.updateMetrics();

    // Keep running if there's activity, or stop to save resources
    if (this.queue.currentSize > 0) {
      this.rafId = requestAnimationFrame(this.loop);
    } else {
      // No more events — stop. Will restart on next enqueue.
      this.running = false;
      this.rafId = null;
    }
  };

  private flushToStore(frame: ReturnType<typeof FrameCoalescer.coalesce>): void {
    if (frame.trades.length === 0 && frame.candles.size === 0 && frame.orderbooks.size === 0 && !frame.heatmap) {
      return;
    }

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
      const now = performance.now();
      if (now - this.lastHeatmapUpdate >= this.HEATMAP_THROTTLE_MS) {
        store.updateHeatmap(frame.heatmap);
        this.lastHeatmapUpdate = now;
      }
    }
  }

  private updateMetrics(): void {
    const store = useLiveStore.getState();
    const snapshot = this.tracker.getSnapshot(this.queue.currentSize);

    // Actual dispatch latency: time from enqueue to flush
    const dispatchLatency = this.lastEnqueueTime > 0 ? performance.now() - this.lastEnqueueTime : 0;

    store.setMetrics({
      fps: snapshot.frameTime > 0 ? Math.round(1000 / snapshot.frameTime) : 60,
      eventsPerSec: snapshot.eps,
      dispatchLatency: Math.max(0, dispatchLatency),
      queueDepth: snapshot.queueDepth,
      droppedFrames: snapshot.droppedFrames,
      frameTime: snapshot.frameTime,
    });
  }
}

/** Singleton instance for the main thread */
export const rafFlushController = new RafFlushController();
