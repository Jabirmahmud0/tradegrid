import { describe, it, expect } from 'vitest';
import { MarketSimulator } from './simulation.js';

describe('MarketSimulator', () => {
  const symbols = ['BTC-USD', 'ETH-USD', 'SOL-USD'];

  it('initializes with correct base prices', () => {
    const sim = new MarketSimulator(symbols);

    // BTC should start around 50000
    const btcPrice = sim.getPrice('BTC-USD');
    expect(btcPrice).toBeGreaterThan(40000);
    expect(btcPrice).toBeLessThan(60000);

    // ETH should start around 2500
    const ethPrice = sim.getPrice('ETH-USD');
    expect(ethPrice).toBeGreaterThan(2000);
    expect(ethPrice).toBeLessThan(3000);
  });

  it('produces price ticks that change price', () => {
    const sim = new MarketSimulator(symbols);
    const initialPrice = sim.getPrice('BTC-USD');

    // Generate 100 ticks and verify price has moved
    for (let i = 0; i < 100; i++) {
      sim.tick('BTC-USD');
    }

    const newPrice = sim.getPrice('BTC-USD');
    expect(newPrice).not.toBe(initialPrice);
  });

  it('never produces negative prices', () => {
    const sim = new MarketSimulator(symbols);

    // Generate many ticks and verify price stays positive
    for (let i = 0; i < 1000; i++) {
      const tick = sim.tick('BTC-USD');
      expect(tick.price).toBeGreaterThan(0);
      expect(sim.getPrice('BTC-USD')).toBeGreaterThan(0);
    }
  });

  it('returns valid tick structure', () => {
    const sim = new MarketSimulator(symbols);
    const tick = sim.tick('BTC-USD');

    expect(tick.symbol).toBe('BTC-USD');
    expect(typeof tick.price).toBe('number');
    expect(typeof tick.timestamp).toBe('number');
    expect(typeof tick.lastClose).toBe('number');
    expect(tick.timestamp).toBeGreaterThanOrEqual(tick.lastClose);
  });

  it('handles unknown symbol gracefully', () => {
    const sim = new MarketSimulator(symbols);
    const tick = sim.tick('UNKNOWN-USD');

    expect(tick).toBeDefined();
    expect(tick.price).toBeGreaterThan(0);
  });
});
