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

import { StreamEvent, NormalizedTrade, NormalizedCandle } from '../types/stream.types.js';

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
            normalizeAndBuffer(rawData);
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

/**
 * Normalization & Coalescing Logic
 */
function normalizeAndBuffer(raw: any) {
  let event: StreamEvent | null = null;

  switch (raw.e) {
    case 'trade': {
      const rawTrade = raw as RawTrade;
      event = {
        t: 'trade',
        sym: rawTrade.s,
        px: parseFloat(rawTrade.p),
        qty: parseFloat(rawTrade.q),
        side: rawTrade.m ? 's' : 'b',
        ts: rawTrade.E,
      };
      break;
    }
    case 'candle': {
      const rawCandle = raw as RawCandle;
      event = {
        t: 'candle',
        sym: rawCandle.s,
        interval: '1m', // Default to 1m for this demo
        o: parseFloat(rawCandle.k.o),
        h: parseFloat(rawCandle.k.h),
        l: parseFloat(rawCandle.k.l),
        c: parseFloat(rawCandle.k.c),
        v: parseFloat(rawCandle.k.v),
        ts: rawCandle.E,
      };
      break;
    }
    case 'book': {
      const rawBook = raw as RawOrderBook;
      event = {
        t: 'book',
        sym: rawBook.s,
        bids: rawBook.b.map(([p, s]) => [parseFloat(p), parseFloat(s)]),
        asks: rawBook.a.map(([p, s]) => [parseFloat(p), parseFloat(s)]),
        ts: rawBook.E,
      };
      break;
    }
  }

  if (event) {
    eventBuffer.push(event);
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
