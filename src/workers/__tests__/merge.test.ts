import { describe, it, expect } from 'vitest';
import { coalesceEvents } from '../merge';
import { NormalizedTrade, BookDeltaEvent } from '../../types/stream.types';

describe('Worker Event Coalescing', () => {
  it('should coalesce multiple book updates for the same symbol', () => {
    const events: BookDeltaEvent[] = [
      { t: 'book', sym: 'BTC-USD', ts: 100, bids: [[100, 1]], asks: [[101, 1]] },
      { t: 'book', sym: 'BTC-USD', ts: 101, bids: [[100, 2]], asks: [[101, 2]] },
      { t: 'book', sym: 'ETH-USD', ts: 100, bids: [[1000, 1]], asks: [[1001, 1]] },
    ];

    const coalesced = coalesceEvents(events) as BookDeltaEvent[];
    
    // We expect 2 events: one for BTC (the latest one) and one for ETH
    expect(coalesced.length).toBe(2);
    const btcEvent = coalesced.find(e => e.sym === 'BTC-USD');
    expect(btcEvent?.ts).toBe(101);
    expect(btcEvent?.bids[0][1]).toBe(2);
  });

  it('should not coalesce trade events (must preserve history)', () => {
    const events: NormalizedTrade[] = [
      { t: 'trade', sym: 'BTC-USD', ts: 100, px: 100, qty: 1, side: 'b', id: '1', formattedTime: '00:00:00.100' },
      { t: 'trade', sym: 'BTC-USD', ts: 101, px: 101, qty: 2, side: 's', id: '2', formattedTime: '00:00:00.101' },
    ];

    const coalesced = coalesceEvents(events);
    expect(coalesced.length).toBe(2);
  });

  it('should handle empty event lists', () => {
    expect(coalesceEvents([])).toEqual([]);
  });
});
