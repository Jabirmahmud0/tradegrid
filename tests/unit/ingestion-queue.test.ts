import { describe, it, expect, vi } from 'vitest';
import { IngestionQueue } from '../../src/streams/ingestion/ingestion-queue';
import { NormalizedTrade } from '../../src/types';

describe('IngestionQueue', () => {
    it('should queue and drain events by type', () => {
        const queue = new IngestionQueue();
        const trade = { sym: 'BTC-USD', px: 100, qty: 1 } as any;
        
        queue.enqueue({ type: 'trade', data: trade });
        expect(queue.size).toBe(1);
        
        const drained = queue.drain();
        expect(drained.trade).toEqual([trade]);
        expect(queue.size).toBe(0);
    });

    it('should drop oldest events when exceeding threshold', () => {
        const queue = new IngestionQueue(10);
        for (let i = 0; i < 15; i++) {
            queue.enqueue({ type: 'trade', data: { i } as any });
        }
        expect(queue.size).toBe(10);
        const drained = queue.drain();
        expect(drained.trade[0]).toEqual({ i: 5 }); // 0-4 should be dropped
    });

    it('should report correct stats', () => {
        const queue = new IngestionQueue();
        queue.enqueue({ type: 'trade', data: {} as any });
        queue.enqueue({ type: 'candle', data: {} as any });
        
        const stats = queue.stats;
        expect(stats.size).toBe(2);
        expect(stats.depths.trade).toBe(1);
        expect(stats.depths.candle).toBe(1);
    });
});
