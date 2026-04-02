import { StreamEvent, NormalizedTrade, NormalizedCandle, BookDeltaEvent } from '../types/stream.types';

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

export function normalizeEvent(raw: any): StreamEvent | null {
  if (!raw || !raw.e) return null;

  switch (raw.e) {
    case 'trade': {
      const rawTrade = raw as RawTrade;
      const px = parseFloat(rawTrade.p);
      const qty = parseFloat(rawTrade.q);
      
      return {
        t: 'trade',
        sym: rawTrade.s,
        px,
        qty,
        side: rawTrade.m ? 's' : 'b',
        ts: rawTrade.E,
        id: `${rawTrade.s}-${rawTrade.E}-${Math.random().toString(36).substring(2, 7)}`,
        formattedTime: new Date(rawTrade.E).toLocaleTimeString('en-US', { 
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
        bids: rawBook.b.map(([p, s]) => [parseFloat(p), parseFloat(s)]),
        asks: rawBook.a.map(([p, s]) => [parseFloat(p), parseFloat(s)]),
        ts: rawBook.E,
      } as BookDeltaEvent;
    }
    case 'heatmap': {
      return {
        t: 'heatmap',
        cells: raw.cells,
        ts: raw.ts
      } as any;
    }
    default:
      return null;
  }
}
