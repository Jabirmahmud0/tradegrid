import { useLiveStore } from '../store/live-store';
import { StreamEvent, NormalizedTrade, NormalizedCandle, BookDeltaEvent } from '../types/stream.types';

class MarketClient {
  private worker: Worker | null = null;
  private isConnected = false;
  
  // Stats tracking
  private eventCount = 0;
  private lastStatTime = Date.now();
  private eps = 0;
  
  // FPS tracking
  private frameCount = 0;
  private lastFrameTime = Date.now();
  private fps = 0;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initWorker();
      this.startFPSMonitor();
    }
  }

  private initWorker() {
    this.worker = new Worker(new URL('../workers/market.worker.ts', import.meta.url), {
      type: 'module'
    });

    this.worker.onmessage = (event) => {
      const { type, payload } = event.data;
      switch (type) {
        case 'CONNECTED': this.isConnected = true; break;
        case 'DISCONNECTED': this.isConnected = false; break;
        case 'BATCH_DATA': this.handleBatchData(payload as StreamEvent[]); break;
      }
    };
  }

  private startFPSMonitor() {
    const tick = () => {
        this.frameCount++;
        const now = Date.now();
        if (now - this.lastFrameTime >= 1000) {
            this.fps = Math.round((this.frameCount * 1000) / (now - this.lastFrameTime));
            this.frameCount = 0;
            this.lastFrameTime = now;
            useLiveStore.getState().setMetrics({ fps: this.fps });
        }
        requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
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

  private handleBatchData(events: StreamEvent[]) {
    this.eventCount += events.length;
    const now = Date.now();
    if (now - this.lastStatTime >= 1000) {
        this.eps = Math.round((this.eventCount * 1000) / (now - this.lastStatTime));
        this.eventCount = 0;
        this.lastStatTime = now;
        useLiveStore.getState().setMetrics({ eventsPerSec: this.eps });
    }

    const store = useLiveStore.getState();
    const trades: NormalizedTrade[] = [];
    const candles: Record<string, NormalizedCandle> = {};
    const books: BookDeltaEvent[] = [];

    events.forEach(event => {
      if (event.t === 'trade') trades.push(event as NormalizedTrade);
      else if (event.t === 'candle') {
        const c = event as NormalizedCandle;
        candles[c.sym] = c;
      }
      else if (event.t === 'book') books.push(event as BookDeltaEvent);
    });

    if (trades.length > 0) store.addTrades(trades);
    Object.values(candles).forEach(c => store.setCandle(c));
    
    const latestBooks: Record<string, BookDeltaEvent> = {};
    books.forEach(b => latestBooks[b.sym] = b);
    Object.values(latestBooks).forEach(b => store.applyOrderBookDelta(b));
  }
}

export const marketClient = new MarketClient();
