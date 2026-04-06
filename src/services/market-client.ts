import { useLiveStore } from '../store/live-store';
import { StreamEvent, NormalizedTrade, NormalizedCandle, BookDeltaEvent, HeatmapEvent } from '../types/stream.types';
import { buildBinanceStreamUrl, BINANCE_STREAM_ENDPOINTS, BINANCE_TESTNET_STREAM_ENDPOINTS } from '../adapters/binance.adapter';
import { rafFlushController } from '../streams/buffering/raf-flush-controller';
import { CandleInterval } from '../types';
import { toBinanceInterval } from './binance-market-data';

export type DataSourceType = 'mock' | 'binance' | 'binance-testnet' | 'custom';

export interface ConnectOptions {
  type?: DataSourceType;
  url?: string;
  symbols?: string[];
  interval?: CandleInterval;
  focusSymbol?: string;
}

class MarketClient {
  private worker: Worker | null = null;
  private currentSourceType: DataSourceType = 'mock';
  private pendingSourceType: DataSourceType | null = null; // Tracks in-flight connection
  private previousSourceType: DataSourceType | null = null; // For rollback on failure
  private currentSymbols: string[] = [];
  private isConnected = false;
  private isConnecting = false;
  private connectTimer: ReturnType<typeof setTimeout> | null = null;

  // Latency tracking (RTT)
  private pingInterval: any = null;
  private lastPingSent = 0;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initWorker();
      this.startLatencyMonitor();
      // Initialize from store on mount
      this.currentSourceType = useLiveStore.getState().dataSource;
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
          // Sync the actual source type from worker back to store
          const actualSource = (payload?.sourceType || this.pendingSourceType || this.currentSourceType) as DataSourceType;
          this.currentSourceType = actualSource;
          this.pendingSourceType = null;
          this.previousSourceType = null;
          useLiveStore.getState().setDataSource(actualSource);
          console.log('[MarketClient] Connected to', this.currentSourceType);
          break;
        case 'DISCONNECTED':
          this.isConnected = false;
          this.isConnecting = false;
          rafFlushController.stop();
          console.log('[MarketClient] Disconnected');
          break;
        case 'CONNECTION_ERROR':
          // Connection failed — revert to previous source
          console.error('[MarketClient] Connection error, reverting to previous source');
          this.isConnected = false;
          this.isConnecting = false;
          rafFlushController.stop();
          if (this.previousSourceType) {
            this.currentSourceType = this.previousSourceType;
            useLiveStore.getState().setDataSource(this.previousSourceType);
            console.log('[MarketClient] Reverted to', this.previousSourceType);
          }
          this.pendingSourceType = null;
          this.previousSourceType = null;
          break;
        case 'BATCH_DATA':
          if (this.isConnecting) {
            return;
          }
          this.handleBatchData(payload as StreamEvent[], metrics);
          break;
        case 'CONTROL':
          if (payload.type === 'pong') {
            const rtt = Date.now() - this.lastPingSent;
            useLiveStore.getState().setMetrics({ dispatchLatency: rtt });
          } else if (payload.type === 'replay-state') {
            const store = useLiveStore.getState();
            const total = Math.max(0, Number(payload.total ?? 0));
            const cursor = Math.max(0, Number(payload.cursor ?? 0));
            store.setReplayTotalEvents(total);
            store.setReplayCursor(cursor);

            if (payload.mode === 'LIVE') {
              store.setReplayMode('LIVE');
              store.setReplayStatus('IDLE');
            } else {
              store.setReplayMode('REPLAY');
              if (payload.completed) {
                store.setReplayCompleted();
              } else {
                store.setReplayStatus(payload.playing ? 'PLAYING' : 'PAUSED');
              }
            }
          }
          break;
        case 'ERROR':
          this.isConnecting = false;
          rafFlushController.stop();
          console.error('[MarketClient] Error:', payload);
          // On error, revert to previous source if pending
          if (this.pendingSourceType && this.previousSourceType) {
            this.currentSourceType = this.previousSourceType;
            useLiveStore.getState().setDataSource(this.previousSourceType);
          }
          this.pendingSourceType = null;
          this.previousSourceType = null;
          break;
      }
    };
  }

  /**
   * Connect to a data source.
   * Does NOT update the store optimistically — only after CONNECTED confirmation.
   * On failure, automatically reverts to the previous source.
   */
  public connect(options: ConnectOptions = {}) {
    const { type = 'mock', url, symbols = [], interval = '1m', focusSymbol } = options;

    const symbolsMatch = this.currentSymbols.join(',') === symbols.join(',');
    const sourceChanged = this.currentSourceType !== type;
    if (this.isConnected && this.currentSourceType === type && symbolsMatch) {
      console.log('[MarketClient] Already connected to', type, '- skipping redundant connection');
      return;
    }

    // Prevent multiple simultaneous connection attempts unless changing symbols
    if (this.isConnecting && this.pendingSourceType === type && symbolsMatch) {
      console.log('[MarketClient] Connection already in progress - skipping redundant request');
      return;
    }

    // Save previous source for rollback on failure
    this.previousSourceType = this.currentSourceType;

    if (this.connectTimer) {
      clearTimeout(this.connectTimer);
      this.connectTimer = null;
    }

    // Disconnect from current source first
    this.disconnect();

    this.currentSymbols = symbols;
    this.isConnecting = true;
    this.pendingSourceType = type;

    if (sourceChanged) {
      this.resetLiveMarketState();
    }

    let connectionUrl: string;
    let endpoints: string[] | undefined;

    switch (type) {
      case 'binance':
        connectionUrl = buildBinanceStreamUrl(symbols, 0, false, toBinanceInterval(interval), focusSymbol);
        endpoints = BINANCE_STREAM_ENDPOINTS;
        console.log('[MarketClient] Connecting to Binance:', connectionUrl);
        break;
      case 'binance-testnet':
        connectionUrl = buildBinanceStreamUrl(symbols, 0, true, toBinanceInterval(interval), focusSymbol);
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

    // Note: currentSourceType is NOT updated here — only after CONNECTED confirms.
    // This prevents optimistic UI that shows connected when it's actually failing.

    // Small delay to ensure disconnect completes
    this.connectTimer = setTimeout(() => {
      this.worker?.postMessage({
        type: 'CONNECT',
        payload: {
          url: connectionUrl,
          sourceType: type, // Explicit source type for worker
          reconnectOptions: { endpoints },
          symbols,
        }
      });
      this.connectTimer = null;
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

  public startReplay(speed: number = 1, index?: number) {
    this.worker?.postMessage({ type: 'CONTROL_COMMAND', payload: { type: 'replay-start', speed, index } });
  }

  public stopReplay() {
    this.worker?.postMessage({ type: 'CONTROL_COMMAND', payload: { type: 'replay-stop' } });
  }

  public seekReplay(index: number) {
    this.worker?.postMessage({ type: 'CONTROL_COMMAND', payload: { type: 'replay-seek', index } });
  }

  public disconnect() {
    if (this.connectTimer) {
      clearTimeout(this.connectTimer);
      this.connectTimer = null;
    }
    this.isConnecting = false;
    this.pendingSourceType = null;
    this.worker?.postMessage({ type: 'DISCONNECT' });
  }

  public get sourceType(): DataSourceType {
    return this.currentSourceType;
  }

  public get connected(): boolean {
    return this.isConnected;
  }

  private resetLiveMarketState() {
    const store = useLiveStore.getState();
    store.clearTrades();
    store.clearAllCandles();
    rafFlushController.stop();
    useLiveStore.setState({
      books: {},
      heatmap: null,
      stats: {},
      systemReady: false,
    });
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
