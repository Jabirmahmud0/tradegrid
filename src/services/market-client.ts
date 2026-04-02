import { useLiveStore } from '../store/live-store';
import { StreamEvent, NormalizedTrade, NormalizedCandle, BookDeltaEvent, HeatmapEvent } from '../types/stream.types';
import { buildBinanceStreamUrl, BINANCE_STREAM_ENDPOINTS } from '../adapters/binance.adapter';

export type DataSourceType = 'mock' | 'binance' | 'binance-testnet' | 'custom';

export interface ConnectOptions {
  type?: DataSourceType;
  url?: string;
  symbols?: string[];
}

class MarketClient {
  private worker: Worker | null = null;
  private currentSourceType: DataSourceType = 'mock';
  private isConnected = false;
  private isConnecting = false;

  // Latency tracking (RTT)
  private pingInterval: any = null;
  private lastPingSent = 0;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initWorker();
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
          this.isConnecting = false;
          console.log('[MarketClient] Connected to', this.currentSourceType);
          break;
        case 'DISCONNECTED':
          this.isConnected = false;
          this.isConnecting = false;
          console.log('[MarketClient] Disconnected');
          break;
        case 'BATCH_DATA':
          this.handleBatchData(payload as StreamEvent[]);
          break;
        case 'CONTROL':
          if (payload.type === 'pong') {
            const rtt = Date.now() - this.lastPingSent;
            useLiveStore.getState().setMetrics({ dispatchLatency: rtt });
          }
          break;
        case 'ERROR':
          this.isConnecting = false;
          console.error('[MarketClient] Error:', payload);
          console.error('[MarketClient] Source type:', this.currentSourceType);
          console.error('[MarketClient] Connected:', this.isConnected);
          break;
      }
    };
  }

  /**
   * Connect to a data source
   */
  public connect(options: ConnectOptions = {}) {
    const { type = 'mock', url, symbols = [] } = options;

    if (this.isConnected && this.currentSourceType === type) {
      console.log('[MarketClient] Already connected to', type, '- skipping redundant connection');
      return;
    }

    // Prevent multiple simultaneous connection attempts
    if (this.isConnecting) {
      console.log('[MarketClient] Connection already in progress - skipping redundant request');
      return;
    }

    // Disconnect from current source first
    this.disconnect();

    this.currentSourceType = type;
    this.isConnecting = true;

    let connectionUrl: string;
    let endpoints: string[] | undefined;

    switch (type) {
      case 'binance':
        connectionUrl = buildBinanceStreamUrl(symbols, 0);
        endpoints = BINANCE_STREAM_ENDPOINTS;
        console.log('[MarketClient] Connecting to Binance:', connectionUrl);
        break;
      case 'binance-testnet':
        // Testnet uses different format - fall back to mainnet endpoints if failing
        connectionUrl = buildBinanceStreamUrl(symbols, 0);
        endpoints = BINANCE_STREAM_ENDPOINTS;
        console.log('[MarketClient] Connecting to Binance (testnet mode):', connectionUrl);
        break;
      case 'custom':
        if (!url) throw new Error('URL is required for custom data source');
        connectionUrl = url;
        break;
      case 'mock':
      default:
        connectionUrl = url || 'ws://localhost:4000';
        console.log('[MarketClient] Connecting to Mock:', connectionUrl);
        break;
    }

    // Small delay to ensure disconnect completes
    setTimeout(() => {
      this.worker?.postMessage({
        type: 'CONNECT',
        payload: {
          url: connectionUrl,
          reconnectOptions: { endpoints }
        }
      });
    }, 100);
  }

  /**
   * Quick connect to Binance mainnet
   */
  public connectToBinance(symbols: string[] = ['BTC-USD', 'ETH-USD', 'SOL-USD']) {
    this.connect({ type: 'binance', symbols });
  }

  /**
   * Quick connect to Binance testnet
   */
  public connectToBinanceTestnet(symbols: string[] = ['BTC-USD', 'ETH-USD']) {
    this.connect({ type: 'binance-testnet', symbols });
  }

  /**
   * Connect to mock server (default)
   */
  public connectToMock(url: string = 'ws://localhost:4000') {
    this.connect({ type: 'mock', url });
  }

  public subscribe(symbols: string[]) {
    this.worker?.postMessage({ type: 'SUBSCRIBE', payload: { symbols } });
  }

  public unsubscribe(symbols: string[]) {
    this.worker?.postMessage({ type: 'UNSUBSCRIBE', payload: { symbols } });
  }

  public setScenario(mode: 'NORMAL' | 'BURST' | 'FAILURE') {
    if (this.currentSourceType === 'mock') {
      this.worker?.postMessage({ type: 'CONTROL_COMMAND', payload: { type: 'set-scenario', mode } });
    }
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

  public disconnect() {
    this.worker?.postMessage({ type: 'DISCONNECT' });
  }

  public get sourceType(): DataSourceType {
    return this.currentSourceType;
  }

  public get connected(): boolean {
    return this.isConnected;
  }

  private startLatencyMonitor() {
    if (this.pingInterval) clearInterval(this.pingInterval);
    this.pingInterval = setInterval(() => {
      if (this.isConnected) {
        this.lastPingSent = Date.now();
        this.worker?.postMessage({ type: 'CONTROL_COMMAND', payload: { type: 'ping' } });
      }
    }, 5000);
  }

  private handleBatchData(events: StreamEvent[]) {
    const store = useLiveStore.getState();

    // Group events by type to use batch dispatchers
    const trades: NormalizedTrade[] = [];
    const candles: Record<string, NormalizedCandle> = {};
    const books: BookDeltaEvent[] = [];
    let latestHeatmap: HeatmapEvent | null = null;

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
        case 'heatmap':
          latestHeatmap = event as HeatmapEvent;
          break;
      }
    });

    // Atomic dispatches to Zustand slices
    if (trades.length > 0) store.addTrades(trades);

    Object.values(candles).forEach(candle => {
      store.setCandle(candle);
    });

    // For book deltas, we take the latest per symbol in this frame
    const latestBooks: Record<string, BookDeltaEvent> = {};
    books.forEach(b => latestBooks[b.sym] = b);
    Object.values(latestBooks).forEach(book => {
      store.applyOrderBookDelta(book);
    });

    // Heatmap: only take the latest in this frame
    if (latestHeatmap) store.updateHeatmap(latestHeatmap);
  }
}

export const marketClient = new MarketClient();
