import { describe, it, expect } from 'vitest';
import { normalizeEvent, RawTrade, RawCandle, RawOrderBook } from '../normalization';

describe('TradeGrid Normalization', () => {
  it('should correctly normalize trade events', () => {
    const raw: RawTrade = {
      e: 'trade',
      E: 1672531200000,
      s: 'BTCUSDT',
      p: '16500.50',
      q: '0.1',
      m: true // seller is maker -> sell side
    };

    const normalized = normalizeEvent(raw) as any;
    expect(normalized.t).toBe('trade');
    expect(normalized.px).toBe(16500.50);
    expect(normalized.qty).toBe(0.1);
    expect(normalized.side).toBe('s');
    expect(normalized.ts).toBe(1672531200000);
  });

  it('should correctly normalize candle events', () => {
    const raw: RawCandle = {
      e: 'candle',
      E: 1672531200000,
      s: 'ETHUSDT',
      k: {
        o: '1200',
        h: '1250',
        l: '1180',
        c: '1220',
        v: '5000',
        x: true
      }
    };

    const normalized = normalizeEvent(raw) as any;
    expect(normalized.t).toBe('candle');
    expect(normalized.o).toBe(1200);
    expect(normalized.c).toBe(1220);
    expect(normalized.isUp).toBe(true);
    expect(normalized.changePercent).toBeCloseTo(1.666, 2);
  });

  it('should correctly normalize order book events', () => {
    const raw: RawOrderBook = {
      e: 'book',
      E: 1672531200000,
      s: 'SOLUSDT',
      b: [['10.5', '100'], ['10.4', '200']],
      a: [['10.6', '150']]
    };

    const normalized = normalizeEvent(raw) as any;
    expect(normalized.t).toBe('book');
    expect(normalized.bids[0][0]).toBe(10.5);
    expect(normalized.bids[0][1]).toBe(100);
    expect(normalized.asks[0][0]).toBe(10.6);
  });

  it('should return null for invalid events', () => {
    expect(normalizeEvent(null)).toBeNull();
    expect(normalizeEvent({})).toBeNull();
    expect(normalizeEvent({ e: 'unknown' })).toBeNull();
  });
});
