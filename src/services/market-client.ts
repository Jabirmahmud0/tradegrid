import { useLiveStore } from '../store/live-store';
import { IngestionQueue, IngestionEvent } from '../streams/ingestion/ingestion-queue';
import { RafFlushLoop } from '../streams/buffering/raf-flush';

class MarketClient {
  private worker: Worker | null = null;
  private isConnected = false;
  
  private queue: IngestionQueue;
  private flushLoop: RafFlushLoop;
  
  // Latency tracking (RTT)
  private pingInterval: any = null;
  private lastPingSent = 0;

  constructor() {
    this.queue = new IngestionQueue(20000); // 20k events max depth
    this.flushLoop = new RafFlushLoop(this.queue);

    if (typeof window !== 'undefined') {
      this.initWorker();
      this.flushLoop.start();
      this.startLatencyMonitor();
    }
  }

  private initWorker() {
    this.worker = new Worker(new URL('../workers/market.worker.ts', import.meta.url), {
      type: 'module'
    });

    this.worker.onmessage = (event) => {
      const { type, payload } = event.data;
      switch (type) {
        case 'CONNECTED': 
            this.isConnected = true; 
            break;
        case 'DISCONNECTED': 
            this.isConnected = false; 
            break;
        case 'BATCH_DATA': 
            this.handleIncomingBatch(payload); 
            break;
        case 'CONTROL':
            if (payload.type === 'pong') {
                const rtt = Date.now() - this.lastPingSent;
                useLiveStore.getState().setMetrics({ dispatchLatency: rtt });
            }
            break;
      }
    };
  }

  private handleIncomingBatch(payload: any[]) {
    // Map raw worker events to IngestionEvents
    const events: IngestionEvent[] = payload.map(p => {
      if (p.t === 'trade') return { type: 'trade', data: p };
      if (p.t === 'candle') return { type: 'candle', data: p };
      if (p.t === 'book') return { type: 'orderbook', data: p };
      if (p.t === 'heatmap') return { type: 'heatmap', data: p };
      return null;
    }).filter(e => e !== null) as IngestionEvent[];

    this.queue.enqueueBatch(events);
    
    // Basic EPS estimate: real tracking will happen in Phase A4 with PerformanceTracker
  }

  private startLatencyMonitor() {
    if (this.pingInterval) clearInterval(this.pingInterval);
    this.pingInterval = setInterval(() => {
        if (this.isConnected) {
            this.lastPingSent = Date.now();
            this.worker?.postMessage({ type: 'CONTROL_COMMAND', payload: { type: 'ping' } });
        }
    }, 5000); // Ping every 5s
  }

  public connect(url: string = 'ws://localhost:4000') {
    this.worker?.postMessage({ type: 'CONNECT', payload: { url } });
  }

  public subscribe(symbols: string[]) {
    this.worker?.postMessage({ type: 'SUBSCRIBE', payload: { symbols } });
  }

  public unsubscribe(symbols: string[]) {
    this.worker?.postMessage({ type: 'UNSUBSCRIBE', payload: { symbols } });
  }

  public setScenario(mode: 'NORMAL' | 'BURST' | 'FAILURE') {
    this.worker?.postMessage({ type: 'CONTROL_COMMAND', payload: { type: 'set-scenario', mode } });
  }

  public startReplay(speed: number = 1) {
    this.worker?.postMessage({ type: 'CONTROL_COMMAND', payload: { type: 'replay-start', speed } });
  }

  public stopReplay() {
    this.worker?.postMessage({ type: 'CONTROL_COMMAND', payload: { type: 'replay-stop' } });
  }

  public seekReplay(index: number) {
    this.worker?.postMessage({ type: 'CONTROL_COMMAND', payload: { type: 'replay-seek', index } });
  }
}

export const marketClient = new MarketClient();
