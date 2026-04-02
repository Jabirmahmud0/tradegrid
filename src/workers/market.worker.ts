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

ctx.onmessage = (event: MessageEvent<MainThreadMessage>) => {
  const msg = event.data;

  switch (msg.type) {
    case 'CONNECT':
      if (wsManager) wsManager.disconnect();
      
      wsManager = new WebSocketManager({
        url: msg.payload.url,
        onStatusChange: (status) => {
          if (status === 'open') {
            ctx.postMessage({ type: 'CONNECTED' } as WorkerMessage);
            startFlushLoop();
          } else if (status === 'closed') {
            ctx.postMessage({ type: 'DISCONNECTED' } as WorkerMessage);
            stopFlushLoop();
          }
        },
        onMessage: (data) => {
          handleData(data);
        },
        onError: (_err) => {
          ctx.postMessage({
            type: 'ERROR',
            payload: { message: 'WebSocket encountered an error' }
          } as WorkerMessage);
        }
      });
      wsManager.connect();
      break;

    case 'SUBSCRIBE':
      wsManager?.send(JSON.stringify({ type: 'subscribe', symbols: msg.payload.symbols }));
      break;

    case 'UNSUBSCRIBE':
      wsManager?.send(JSON.stringify({ type: 'unsubscribe', symbols: msg.payload.symbols }));
      break;

    case 'CONTROL_COMMAND':
      wsManager?.send(JSON.stringify(msg.payload));
      break;
  }
};

function handleData(data: ArrayBuffer | string) {
  if (data instanceof ArrayBuffer) {
    try {
      const raw = decode(data);
      const normalized = normalizeEvent(raw);
      if (normalized) {
        eventBuffer.push(normalized);
      }
    } catch (err) {
      console.error('[Worker] Decode error:', err);
    }
  } else {
    try {
      const json = JSON.parse(data);
      ctx.postMessage({ type: 'CONTROL', payload: json } as any);
    } catch (e) {
      // Not JSON or other control message
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
