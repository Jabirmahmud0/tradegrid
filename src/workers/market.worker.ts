import { normalizeEvent } from './normalization';
import { decodePayload } from './decode';
import { coalesceEvents } from './merge';
import { MainThreadMessage, WorkerMessage } from '../streams/protocols/worker-protocol';
import { WebSocketManager } from '../streams/socket/websocket-manager';
import { StreamEvent } from '../types/stream.types';

let wsManager: WebSocketManager | null = null;
const ctx: Worker = self as any;

let eventBuffer: StreamEvent[] = [];
let flushTimer: any = null;
const FLUSH_INTERVAL_MS = 16; // ~60fps coalescing

// Track current connection type and symbols
let currentSourceType: 'mock' | 'binance' | 'custom' = 'mock';
let currentSymbols: string[] = [];
let currentUrl: string | null = null;

ctx.onmessage = (event: MessageEvent<MainThreadMessage>) => {
  const msg = event.data;

  switch (msg.type) {
    case 'CONNECT':
      // Prevent redundant connections to the same URL
      if (wsManager && currentUrl === msg.payload.url) {
        console.log('[Worker] Already connected to this URL - skipping redundant connection');
        return;
      }

      if (wsManager) wsManager.disconnect();

      // Detect source type from URL
      const url = msg.payload.url;
      if (url.includes('binance')) {
        currentSourceType = 'binance';
        console.log('[Worker] Detected Binance connection (includes testnet):', url);
      } else if (url.includes('localhost')) {
        currentSourceType = 'mock';
      } else {
        currentSourceType = 'custom';
      }

      // Update current URL before creating new connection
      currentUrl = url;

      wsManager = new WebSocketManager({
        url: url,
        onStatusChange: (status) => {
          if (status === 'open') {
            ctx.postMessage({ type: 'CONNECTED', payload: { sourceType: currentSourceType } } as WorkerMessage);
            startFlushLoop();
          } else if (status === 'closed') {
            currentUrl = null; // Reset URL on disconnect
            ctx.postMessage({ type: 'DISCONNECTED' } as WorkerMessage);
            stopFlushLoop();
          }
        },
        onMessage: (data) => {
          handleData(data);
        },
        onError: (err) => {
          ctx.postMessage({
            type: 'ERROR',
            payload: { 
              message: 'WebSocket encountered an error',
              url: msg.payload.url,
              errorType: err.type,
              isTrusted: err.isTrusted
            }
          } as WorkerMessage);
        },
        reconnectOptions: msg.payload.reconnectOptions
      });
      wsManager.connect();
      break;

    case 'SUBSCRIBE':
      currentSymbols = msg.payload.symbols;

      if (currentSourceType === 'binance') {
        // For Binance with /stream endpoint, no subscription needed - streams are in URL
        // Just log the symbols for reference
        console.log('[Worker] Binance streams active for:', currentSymbols);
      } else {
        // Mock server subscription
        wsManager?.send(JSON.stringify({ type: 'subscribe', symbols: msg.payload.symbols }));
      }
      break;

    case 'UNSUBSCRIBE':
      if (currentSourceType === 'binance') {
        // Binance /stream endpoint doesn't support unsubscribe - reconnect needed
        console.log('[Worker] Binance: unsubscribe not supported, reconnect to change streams');
      } else {
        wsManager?.send(JSON.stringify({ type: 'unsubscribe', symbols: msg.payload.symbols }));
      }
      break;

    case 'CONTROL_COMMAND':
      // Don't send control commands (ping, etc.) to Binance - it doesn't understand them
      if (currentSourceType !== 'binance') {
        wsManager?.send(JSON.stringify(msg.payload));
      } else {
        // For Binance, just respond with pong locally without sending to server
        if (msg.payload.type === 'ping') {
          ctx.postMessage({ type: 'CONTROL', payload: { type: 'pong' } } as any);
        }
      }
      break;

    case 'DISCONNECT':
      if (wsManager) {
        wsManager.disconnect();
        currentUrl = null;
      }
      break;
  }
};

let metrics = {
  decodeTime: 0,
  ingestionTime: 0,
  eventCount: 0
};

function handleData(data: ArrayBuffer | string) {
  const start = performance.now();
  const parsed = decodePayload(data, currentSourceType);
  const decoded = performance.now();
  metrics.decodeTime += (decoded - start);
  
  if (!parsed) return;

  if (currentSourceType === 'binance' || (typeof data === 'string' && parsed.type)) {
    // Check if it's a Binance market data event (unwrapped format)
    if (parsed.e === 'trade' || parsed.e === 'kline') {
      const normalized = normalizeEvent(parsed);
      if (normalized) eventBuffer.push(normalized);
    } else if (parsed.stream && parsed.data) {
      // Binance stream wrapper format
      const streamName = parsed.stream as string;
      const symbol = streamName.split('@')[0].toUpperCase().replace('USDT', '-USD');
      
      if (parsed.data.lastUpdateId && parsed.data.bids && parsed.data.asks) {
        const normalized = normalizeEvent({...parsed.data, sym: symbol});
        if (normalized) eventBuffer.push(normalized);
      } else if (parsed.data.e === 'trade' || parsed.data.e === 'kline') {
        const normalized = normalizeEvent(parsed.data);
        if (normalized) eventBuffer.push(normalized);
      }
    } else if (parsed.lastUpdateId && parsed.bids && parsed.asks) {
      const normalized = normalizeEvent(parsed);
      if (normalized) eventBuffer.push(normalized);
    } else if (parsed.type === 'pong' || parsed.type === 'welcome') {
      return;
    } else {
      ctx.postMessage({ type: 'CONTROL', payload: parsed } as any);
    }
  } else {
    // Mock server: forward control messages (pong/welcome), normalize market events
    if (parsed.type === 'pong' || parsed.type === 'welcome') {
      ctx.postMessage({ type: 'CONTROL', payload: parsed } as any);
      return;
    }
    const normalized = normalizeEvent(parsed);
    if (normalized) eventBuffer.push(normalized);
  }
  metrics.ingestionTime += (performance.now() - decoded);
  metrics.eventCount++;
}

function startFlushLoop() {
  if (flushTimer) return;
  flushTimer = setInterval(() => {
    if (eventBuffer.length > 0) {
      const avgDecode = metrics.eventCount > 0 ? metrics.decodeTime / metrics.eventCount : 0;
      const avgIngest = metrics.eventCount > 0 ? metrics.ingestionTime / metrics.eventCount : 0;

      ctx.postMessage({
        type: 'BATCH_DATA',
        payload: coalesceEvents(eventBuffer),
        metrics: {
          decodeTime: avgDecode,
          ingestionTime: avgIngest
        }
      } as WorkerMessage);

      eventBuffer = [];
      metrics = { decodeTime: 0, ingestionTime: 0, eventCount: 0 };
    }
  }, FLUSH_INTERVAL_MS);
}

function stopFlushLoop() {
  if (flushTimer) {
    clearInterval(flushTimer);
    flushTimer = null;
  }
}
