import { decode } from '@msgpack/msgpack';

// We define raw types matching the mock server's output
interface RawTrade {
  e: 'trade';
  E: number;
  s: string;
  p: string;
  q: string;
  m: boolean;
}

interface RawCandle {
  e: 'candle';
  E: number;
  s: string;
  k: {
    o: string;
    h: string;
    l: string;
    c: string;
    v: string;
    x: boolean;
  };
}

interface RawOrderBook {
  e: 'book';
  E: number;
  s: string;
  b: [string, string][];
  a: [string, string][];
}

let socket: WebSocket | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

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
  };

  socket.onmessage = (event: MessageEvent) => {
    if (event.data instanceof ArrayBuffer) {
        try {
            const rawData = decode(event.data) as any;
            normalizeAndDispatch(rawData);
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

/**
 * Normalization logic (Phase 3.2 placeholder)
 * We transform raw server types to our shared stream types here.
 */
function normalizeAndDispatch(raw: any) {
    // Current simple dispatch back to main thread
    // In Phase 3.2/3.3 we will add high-performance normalization and batching
    self.postMessage({ type: 'DATA', payload: raw });
}
