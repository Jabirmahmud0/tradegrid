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

export function getSector(sym: string): string {
  return SECTORS[sym] || 'Misc';
}
