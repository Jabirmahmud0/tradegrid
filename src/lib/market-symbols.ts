export const DEFAULT_STREAM_SYMBOLS = ['BTC-USD', 'ETH-USD', 'SOL-USD', 'ARB-USD', 'OP-USD'] as const;

const SECTORS: Record<string, string> = {
  'BTC-USD': 'Core',
  'ETH-USD': 'Core',
  'SOL-USD': 'L1',
  'ADA-USD': 'L1',
  'DOT-USD': 'L1',
  'AVAX-USD': 'L1',
  'ARB-USD': 'L2',
  'OP-USD': 'L2',
  'MATIC-USD': 'L2',
  'LINK-USD': 'DeFi',
  'UNI-USD': 'DeFi',
  'AAVE-USD': 'DeFi',
};

export function buildStreamSymbols(activeSymbol: string): string[] {
  return Array.from(new Set([activeSymbol, ...DEFAULT_STREAM_SYMBOLS]));
}

export function getMarketSector(symbol: string): string {
  return SECTORS[symbol] || 'Misc';
}
