import { useLiveStore } from '../store/live-store';
import { StreamEvent, NormalizedTrade, NormalizedCandle, BookDeltaEvent } from '../types/stream.types';

class MarketClient {
  private worker: Worker | null = null;
  private isConnected = false;

  constructor() {
    // Only initialize in browser environment
    if (typeof window !== 'undefined') {
      this.initWorker();
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
          console.log('[MarketClient] Connected to server');
          break;
        case 'DISCONNECTED':
          this.isConnected = false;
          console.log('[MarketClient] Disconnected from server');
          break;
        case 'BATCH_DATA':
          this.handleBatchData(payload as StreamEvent[]);
          break;
        case 'CONTROL':
          console.log('[MarketClient] Control Event:', payload);
          break;
      }
    };
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

  private handleBatchData(events: StreamEvent[]) {
    const store = useLiveStore.getState();
    
    // Group events by type to use batch dispatchers
    const trades: NormalizedTrade[] = [];
    const candles: Record<string, NormalizedCandle> = {}; // Keep only latest candle per symbol in batch
    const books: BookDeltaEvent[] = [];

    events.forEach(event => {
      switch (event.t) {
        case 'trade':
          trades.push(event as NormalizedTrade);
          break;
        case 'candle':
          const candle = event as NormalizedCandle;
          candles[candle.sym] = candle;
          break;
        case 'book':
          books.push(event as BookDeltaEvent);
          break;
      }
    });

    // Atomic dispatches to Zustand slices
    if (trades.length > 0) store.addTrades(trades);
    
    Object.values(candles).forEach(candle => {
        store.setCandle(candle.sym, candle);
    });

    // For book deltas, we take the latest per symbol in this frame
    const latestBooks: Record<string, BookDeltaEvent> = {};
    books.forEach(b => latestBooks[b.sym] = b);
    Object.values(latestBooks).forEach(book => {
        store.updateOrderBook(book.sym, book.bids, book.asks);
    });
  }
}

export const marketClient = new MarketClient();
