import { describe, it, expect } from 'vitest';
import { getSector } from '../utils/sectors.js';

describe('getSector', () => {
  it('returns correct sector for Core assets', () => {
    expect(getSector('BTC-USD')).toBe('Core');
    expect(getSector('ETH-USD')).toBe('Core');
  });

  it('returns correct sector for L1 assets', () => {
    expect(getSector('SOL-USD')).toBe('L1');
    expect(getSector('ADA-USD')).toBe('L1');
    expect(getSector('DOT-USD')).toBe('L1');
    expect(getSector('AVAX-USD')).toBe('L1');
  });

  it('returns correct sector for L2 assets', () => {
    expect(getSector('ARB-USD')).toBe('L2');
    expect(getSector('OP-USD')).toBe('L2');
    expect(getSector('MATIC-USD')).toBe('L2');
  });

  it('returns correct sector for DeFi assets', () => {
    expect(getSector('LINK-USD')).toBe('DeFi');
    expect(getSector('UNI-USD')).toBe('DeFi');
    expect(getSector('AAVE-USD')).toBe('DeFi');
  });

  it('returns Misc for unknown symbols', () => {
    expect(getSector('RANDOM-USD')).toBe('Misc');
    expect(getSector('DOGE-USD')).toBe('Misc');
  });
});
