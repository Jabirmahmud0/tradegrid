import { StreamEvent, NormalizedTrade, NormalizedCandle, BookDeltaEvent } from '../types/stream.types';
import { fromBinanceSymbol } from '../adapters/binance.adapter';

export interface RawTrade {
  e: 'trade';
  E: number;
  s: string;
  p: string;
  q: string;
  m: boolean;
}

export interface RawCandle {
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

export interface RawOrderBook {
  e: 'book';
  E: number;
  s: string;
  b: [string, string][];
  a: [string, string][];
}

/**
 * Binance-specific raw types
 */
export interface BinanceTradeEvent {
  e: 'trade';
  E: number;
  s: string;
  t: number;
  p: string;
  q: string;
  m: boolean;
}

export interface BinanceKlineEvent {
  e: 'kline';
  E: number;
  s: string;
  k: {
    t: number;
    T: number;
    s: string;
    i: string;
    o: string;
    c: string;
    h: string;
    l: string;
    v: string;
    n: number;
    x: boolean;
  };
}

export interface BinanceDepthEvent {
  lastUpdateId: number;
  bids: [string, string][];
  asks: [string, string][];
}

export function normalizeEvent(raw: any): StreamEvent | null {
  if (!raw) return null;

  // Handle heatmap events (uses 't' instead of 'e')
  if (raw.t === 'heatmap') {
    return {
      t: 'heatmap',
      cells: raw.cells,
      ts: raw.ts
    } as any;
  }

  // Handle Binance kline event (different event type)
  if (raw.e === 'kline') {
    const rawCandle = raw as BinanceKlineEvent;
    const o = parseFloat(rawCandle.k.o);
    const c = parseFloat(rawCandle.k.c);

    return {
      t: 'candle',
      sym: fromBinanceSymbol(rawCandle.s),
      interval: mapBinanceInterval(rawCandle.k.i),
      o,
      h: parseFloat(rawCandle.k.h),
      l: parseFloat(rawCandle.k.l),
      c,
      v: parseFloat(rawCandle.k.v),
      ts: rawCandle.k.T,
      isUp: c >= o,
      changePercent: ((c - o) / o) * 100
    } as NormalizedCandle;
  }

  // Handle Binance depth update (no 'e' field, has lastUpdateId)
  if (raw.lastUpdateId && raw.bids && raw.asks) {
    const depth = raw as BinanceDepthEvent;
    // Extract symbol from stream info or use default
    return {
      t: 'book',
      sym: 'BTC-USD', // Will be set by worker based on subscription
      bids: depth.bids.map(([p, s]) => [parseFloat(p), parseFloat(s)] as [number, number]),
      asks: depth.asks.map(([p, s]) => [parseFloat(p), parseFloat(s)] as [number, number]),
      ts: Date.now()
    } as BookDeltaEvent;
  }

  // Support both 'e' (Binance) and 't' (mock server) for event type
  const eventType = raw.e || raw.t;
  if (!eventType) return null;

  switch (eventType) {
    case 'trade': {
      const rawTrade = raw as RawTrade | BinanceTradeEvent;
      const px = parseFloat(rawTrade.p);
      const qty = parseFloat(rawTrade.q);
      const symbol = 't' in rawTrade && 's' in rawTrade ? fromBinanceSymbol(rawTrade.s) : rawTrade.s;
      const timestamp = ('T' in rawTrade ? rawTrade.T : rawTrade.E) as number;

      return {
        t: 'trade',
        sym: symbol,
        px,
        qty,
        side: rawTrade.m ? 's' : 'b',
        ts: timestamp,
        id: 't' in rawTrade ? `${rawTrade.s}-${rawTrade.t}` : `${rawTrade.s}-${rawTrade.E}-${Math.random().toString(36).substring(2, 7)}`,
        formattedTime: new Date(timestamp).toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        })
      } as NormalizedTrade;
    }
    case 'candle': {
      const rawCandle = raw as RawCandle;
      const o = parseFloat(rawCandle.k.o);
      const c = parseFloat(rawCandle.k.c);

      return {
        t: 'candle',
        sym: rawCandle.s,
        interval: '1m',
        o,
        h: parseFloat(rawCandle.k.h),
        l: parseFloat(rawCandle.k.l),
        c,
        v: parseFloat(rawCandle.k.v),
        ts: rawCandle.E,
        isUp: c >= o,
        changePercent: ((c - o) / o) * 100
      } as NormalizedCandle;
    }
    case 'book': {
      const rawBook = raw as RawOrderBook;
      return {
        t: 'book',
        sym: rawBook.s,
        bids: rawBook.b.map(([p, s]) => [parseFloat(p), parseFloat(s)] as [number, number]),
        asks: rawBook.a.map(([p, s]) => [parseFloat(p), parseFloat(s)] as [number, number]),
        ts: rawBook.E,
      } as BookDeltaEvent;
    }
    default:
      return null;
  }
}

function mapBinanceInterval(interval: string): '1m' | '5m' | '15m' | '1h' | '1D' {
  const map: Record<string, '1m' | '5m' | '15m' | '1h' | '1D'> = {
    '1m': '1m',
    '5m': '5m',
    '15m': '15m',
    '1h': '1h',
    '1d': '1D'
  };
  return map[interval] || '1m';
}
