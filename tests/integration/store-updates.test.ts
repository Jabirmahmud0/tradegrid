import { describe, it, expect, beforeEach } from 'vitest';
import { useLiveStore } from '../../src/store/live-store';
import { NormalizedTrade, NormalizedCandle } from '../../src/types';

describe('Store Integration - Updates & Retention', () => {
    beforeEach(() => {
        const state = useLiveStore.getState();
        // Clear all state (simplified reset)
        state.trades = [];
        state.candles = {};
        state.books = {};
    });

    it('should add multiple trades and maintain max retention', () => {
        const state = useLiveStore.getState();

        // Add 1100 trades in batches
        const trades: NormalizedTrade[] = [];
        for (let i = 0; i < 1100; i++) {
            trades.push({
                id: `${i}`,
                px: 100 + i,
                qty: 1,
                side: 'buy',
                sym: 'BTC-USD',
                ts: Date.now()
            });
        }
        state.addTrades(trades);

        const finalTrades = useLiveStore.getState().trades;
        // Retention policy is 500 trades
        expect(finalTrades.length).toBe(500);
        // Trades are stored newest first, so last item is oldest retained
        expect(finalTrades[finalTrades.length - 1].id).toBe('600');
    });

    it('should update candle aggregates correctly', () => {
        const state = useLiveStore.getState();
        const symbol = 'BTC-USD';

        const candle: NormalizedCandle = {
            sym: symbol,
            interval: '1m',
            ts: 1000,
            o: 10, h: 15, l: 5, c: 12, v: 100
        };
        state.setCandle(candle);

        const candles = useLiveStore.getState().candles[`${symbol}-1m`];
        expect(candles.length).toBe(1);
        expect(candles[0].c).toBe(12);

        // Update same candle (streaming partial candle)
        const updatedCandle: NormalizedCandle = {
            ...candle,
            c: 13,
            h: 16
        };
        state.setCandle(updatedCandle);
        const updated = useLiveStore.getState().candles[`${symbol}-1m`];
        expect(updated[0].c).toBe(13);
        expect(updated[0].h).toBe(16);
    });
});
