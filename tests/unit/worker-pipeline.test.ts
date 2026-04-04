import { decodePayload } from '../../src/workers/decode';
import { coalesceEvents } from '../../src/workers/merge';
import { StreamEvent, CandleEvent } from '../../src/types/stream.types';
import { encode } from '@msgpack/msgpack';
import { describe, it, expect } from 'vitest';

describe('Worker Pipeline', () => {
  describe('decodePayload', () => {
    it('should decode MessagePack mock data correctly', () => {
      const payload = { t: 'trade', px: 65000, qty: 1.5, side: 'b' };
      const encoded = encode(payload);

      // Properly slice the Uint8Array into an ArrayBuffer
      const buffer = encoded.buffer.slice(encoded.byteOffset, encoded.byteOffset + encoded.byteLength);
      const result = decodePayload(buffer, 'mock');
      expect(result).toBeDefined();
      expect(result.t).toBe('trade');
      expect(result.px).toBe(65000);
    });

    it('should decode Binance JSON correctly', () => {
      const payload = JSON.stringify({ e: 'trade', p: '65000', q: '1.5' });
      const result = decodePayload(payload, 'binance');
      expect(result.e).toBe('trade');
      expect(result.p).toBe('65000');
    });
  });

  describe('coalesceEvents', () => {
    it('should keep the latest candle per symbol-interval', () => {
      const events: StreamEvent[] = [
        { t: 'candle', sym: 'BTC-USD', interval: '1m', o: 1, c: 2, h: 3, l: 0, v: 100, ts: 1000 } as CandleEvent,
        { t: 'candle', sym: 'BTC-USD', interval: '1m', o: 1, c: 3, h: 4, l: 0, v: 200, ts: 1500 } as CandleEvent,
        { t: 'candle', sym: 'ETH-USD', interval: '1m', o: 1, c: 2, h: 3, l: 0, v: 50, ts: 1000 } as CandleEvent
      ];

      const coalesced = coalesceEvents(events);
      
      const btcCandles = coalesced.filter(e => e.t === 'candle' && e.sym === 'BTC-USD');
      expect(btcCandles.length).toBe(1);
      expect((btcCandles[0] as CandleEvent).c).toBe(3); 
      expect((btcCandles[0] as CandleEvent).v).toBe(200); 

      const ethCandles = coalesced.filter(e => e.t === 'candle' && e.sym === 'ETH-USD');
      expect(ethCandles.length).toBe(1);
    });

    it('should keep all trades untouched', () => {
      const events: StreamEvent[] = [
        { t: 'trade', sym: 'BTC-USD', px: 1, qty: 1, side: 'b', ts: 100 },
        { t: 'trade', sym: 'BTC-USD', px: 2, qty: 1, side: 's', ts: 200 }
      ];

      const coalesced = coalesceEvents(events);
      expect(coalesced.length).toBe(2);
    });
  });
});
