export interface MetricsSnapshot {
  eps: number;
  avgLatency: number;
  frameTime: number;
  droppedFrames: number;
  queueDepth: number;
}

export class PerformanceTracker {
  private eventTimes: number[] = [];
  private latencyHistory: { ts: number; val: number }[] = [];
  private frameHistory: { ts: number; duration: number }[] = [];
  private absoluteDroppedCount = 0;
  
  private readonly WINDOW_MS = 3000; // 3 sec window

  public recordEvent(timestamp?: number) {
    const now = performance.now();
    this.eventTimes.push(now);
    
    if (timestamp) {
      this.latencyHistory.push({ ts: now, val: now - timestamp });
    }
  }

  public recordFrame(duration: number, wasDropped: boolean) {
    const now = performance.now();
    this.frameHistory.push({ ts: now, duration });
    if (wasDropped) this.absoluteDroppedCount++;
  }

  public getSnapshot(currentQueueDepth: number): MetricsSnapshot {
    const now = performance.now();
    this.cleanupOldData(now);

    const eps = this.calculateEps(now);
    const avgLatency = this.calculateAvg(this.latencyHistory.map(l => l.val));
    const avgFrameTime = this.calculateAvg(this.frameHistory.map(f => f.duration));

    return {
      eps,
      avgLatency,
      frameTime: avgFrameTime,
      droppedFrames: this.absoluteDroppedCount,
      queueDepth: currentQueueDepth
    };
  }

  private calculateEps(now: number): number {
    const windowStart = now - 1000;
    return this.eventTimes.filter(t => t >= windowStart).length;
  }

  private calculateAvg(arr: number[]): number {
    if (arr.length === 0) return 0;
    const sum = arr.reduce((a, b) => a + b, 0);
    return sum / arr.length;
  }

  private cleanupOldData(now: number) {
    const threshold = now - this.WINDOW_MS;
    
    this.eventTimes = this.eventTimes.filter(t => t >= threshold);
    this.latencyHistory = this.latencyHistory.filter(l => l.ts >= threshold);
    this.frameHistory = this.frameHistory.filter(f => f.ts >= threshold);
  }
}
