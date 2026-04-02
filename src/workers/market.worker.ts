import { decode } from '@msgpack/msgpack';
import { normalizeEvent } from './normalization';
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

function handleData(data: ArrayBuffer | string) {
  // Binance sends JSON, mock server sends MessagePack
  if (currentSourceType === 'binance' || !(data instanceof ArrayBuffer)) {
    // Handle JSON (Binance or control messages)
    try {
      const json = typeof data === 'string' ? JSON.parse(data) : JSON.parse(new TextDecoder().decode(data));

      // Check if it's a Binance market data event (unwrapped format)
      if (json.e === 'trade' || json.e === 'kline') {
        const normalized = normalizeEvent(json);
        if (normalized) {
          eventBuffer.push(normalized);
        }
      } else if (json.stream && json.data) {
        // Binance stream wrapper format: {stream: "btcusdt@depth20@100ms", data: {...}}
        const streamName = json.stream as string;
        const symbol = streamName.split('@')[0].toUpperCase().replace('USDT', '-USD');
        
        if (json.data.lastUpdateId && json.data.bids && json.data.asks) {
          // Binance depth update
          const normalized = normalizeEvent({...json.data, sym: symbol});
          if (normalized) {
            eventBuffer.push(normalized);
          }
        } else if (json.data.e === 'trade' || json.data.e === 'kline') {
          // Wrapped trade/candle
          const normalized = normalizeEvent(json.data);
          if (normalized) {
            eventBuffer.push(normalized);
          }
        }
      } else if (json.lastUpdateId && json.bids && json.asks) {
        // Binance depth update (unwrapped)
        const normalized = normalizeEvent(json);
        if (normalized) {
          eventBuffer.push(normalized);
        }
      } else if (json.type === 'pong' || json.type === 'welcome') {
        // Control/latency messages - ignore
        return;
      } else {
        // Control message or unknown format
        ctx.postMessage({ type: 'CONTROL', payload: json } as any);
      }
    } catch (e) {
      // Not JSON or parse error
      console.warn('[Worker] JSON parse error:', e);
    }
  } else if (data instanceof ArrayBuffer) {
    // Handle MessagePack (mock server)
    try {
      const raw = decode(data) as any;
      const normalized = normalizeEvent(raw);
      if (normalized) {
        eventBuffer.push(normalized);
      }
    } catch (err) {
      console.error('[Worker] Decode error:', err);
    }
  }
}

function startFlushLoop() {
  if (flushTimer) return;
  flushTimer = setInterval(() => {
    if (eventBuffer.length > 0) {
      ctx.postMessage({
        type: 'BATCH_DATA',
        payload: eventBuffer
      } as WorkerMessage);
      eventBuffer = [];
    }
  }, FLUSH_INTERVAL_MS);
}

function stopFlushLoop() {
  if (flushTimer) {
    clearInterval(flushTimer);
    flushTimer = null;
  }
}
