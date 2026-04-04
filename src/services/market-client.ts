import { useLiveStore } from '../store/live-store';
import { StreamEvent, NormalizedTrade, NormalizedCandle, BookDeltaEvent, HeatmapEvent } from '../types/stream.types';
import { buildBinanceStreamUrl, BINANCE_STREAM_ENDPOINTS, BINANCE_TESTNET_STREAM_ENDPOINTS } from '../adapters/binance.adapter';
import { rafFlushController } from '../streams/buffering/raf-flush-controller';

export type DataSourceType = 'mock' | 'binance' | 'binance-testnet' | 'custom';

export interface ConnectOptions {
  type?: DataSourceType;
  url?: string;
  symbols?: string[];
}

class MarketClient {
  private worker: Worker | null = null;
  private currentSourceType: DataSourceType = 'mock';
  private currentSymbols: string[] = [];
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
      const { type, payload, metrics } = event.data;

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
          this.handleBatchData(payload as StreamEvent[], metrics);
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
          break;
      }
    };
  }

  /**
   * Connect to a data source
   */
  public connect(options: ConnectOptions = {}) {
    const { type = 'mock', url, symbols = [] } = options;

    const symbolsMatch = this.currentSymbols.join(',') === symbols.join(',');
    if (this.isConnected && this.currentSourceType === type && symbolsMatch) {
      console.log('[MarketClient] Already connected to', type, '- skipping redundant connection');
      return;
    }

    // Prevent multiple simultaneous connection attempts unless changing symbols
    if (this.isConnecting && symbolsMatch) {
      console.log('[MarketClient] Connection already in progress - skipping redundant request');
      return;
    }

    // Disconnect from current source first
    this.disconnect();

    this.currentSourceType = type;
    this.currentSymbols = symbols;
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
        connectionUrl = buildBinanceStreamUrl(symbols, 0, true);
        endpoints = BINANCE_TESTNET_STREAM_ENDPOINTS;
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

  private handleBatchData(events: StreamEvent[], workerMetrics?: { decodeTime: number; ingestionTime: number }) {
    const store = useLiveStore.getState();

    // Group events (worker already coalesced, but we accumulate across batches until RAF flush)
    const trades: NormalizedTrade[] = [];
    const candles: Record<string, NormalizedCandle> = {};
    const books: BookDeltaEvent[] = [];
    let latestHeatmap: HeatmapEvent | null = null;

    for (const event of events) {
      switch (event.t) {
        case 'trade': trades.push(event as NormalizedTrade); break;
        case 'candle': {
          const candle = event as NormalizedCandle;
          candles[`${candle.sym}-${candle.interval}`] = candle;
          break;
        }
        case 'book': books.push(event as BookDeltaEvent); break;
        case 'heatmap': latestHeatmap = event as HeatmapEvent; break;
      }
    }

    // Mark system ready on first data
    if (!store.systemReady && events.length > 0) store.setSystemReady(true);

    // Update worker decode metric
    if (workerMetrics) {
      store.setMetrics({ workerDecodeTime: workerMetrics.decodeTime });
    }

    // Route through RAF flush controller — dispatches are frame-synced
    rafFlushController.enqueue({
      trades,
      candles: Object.values(candles),
      orderbooks: books,
      heatmap: latestHeatmap,
    });
  }
}

export const marketClient = new MarketClient();
