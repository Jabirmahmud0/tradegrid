import { decode } from '@msgpack/msgpack';
import { normalizeEvent } from './normalization';
import { StreamEvent } from '../types/stream.types';

let socket: WebSocket | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

// COALESCING STATE
let eventBuffer: StreamEvent[] = [];
const FLUSH_INTERVAL_MS = 16; // ~60fps coalescing
let flushTimer: any = null;

self.onmessage = (event: MessageEvent) => {
  const { type, payload } = event.data;

  switch (type) {
    case 'CONNECT':
      connect(payload.url);
      break;
    case 'SUBSCRIBE':
      send({ type: 'subscribe', symbols: payload.symbols });
      break;
    case 'UNSUBSCRIBE':
      send({ type: 'unsubscribe', symbols: payload.symbols });
      break;
    case 'DISCONNECT':
      disconnect();
      break;
    case 'CONTROL_COMMAND':
      send(payload);
      break;
  }
};

function connect(url: string) {
  if (socket) socket.close();

  console.log(`[Worker] Connecting to ${url}...`);
  socket = new WebSocket(url);
  socket.binaryType = 'arraybuffer';

  socket.onopen = () => {
    console.log('[Worker] WebSocket Connected');
    reconnectAttempts = 0;
    self.postMessage({ type: 'CONNECTED' });
    startFlushLoop();
  };

  socket.onmessage = (event: MessageEvent) => {
    if (event.data instanceof ArrayBuffer) {
        try {
            const rawData = decode(event.data) as any;
            const normalized = normalizeEvent(rawData);
            if (normalized) {
                eventBuffer.push(normalized);
            }
        } catch (err) {
            console.error('[Worker] MessagePack decode failed:', err);
        }
    } else {
        // Control messages (JSON)
        try {
            const data = JSON.parse(event.data);
            self.postMessage({ type: 'CONTROL', payload: data });
        } catch (err) {
            // Ignored if not JSON
        }
    }
  };

  socket.onclose = () => {
    console.log('[Worker] WebSocket Closed');
    self.postMessage({ type: 'DISCONNECTED' });
    stopFlushLoop();
    
    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts++;
        setTimeout(() => connect(url), 2000 * reconnectAttempts);
    }
  };

  socket.onerror = (error) => {
    console.error('[Worker] WebSocket Error:', error);
  };
}

function disconnect() {
    if (socket) {
        socket.close();
        socket = null;
    }
}

function send(data: any) {
  if (socket?.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(data));
  }
}

function startFlushLoop() {
  if (flushTimer) return;
  flushTimer = setInterval(() => {
    if (eventBuffer.length > 0) {
      self.postMessage({ type: 'BATCH_DATA', payload: eventBuffer });
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
