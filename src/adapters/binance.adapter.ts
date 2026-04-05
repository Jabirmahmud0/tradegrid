/**
 * Binance Market Data Adapter
 * Connects to Binance WebSocket streams for real-time market data
 *
 * Public WebSocket endpoints (no API key required):
 * - Combined streams: wss://data-stream.binance.vision/stream?streams=...
 * - Alternative: wss://stream.binance.com:9443/stream?streams=...
 */

export const BINANCE_STREAM_ENDPOINTS = [
  'wss://stream.binance.com:9443',
  'wss://stream.binance.com:443',
  'wss://data-stream.binance.vision',
];

export const BINANCE_TESTNET_STREAM_ENDPOINTS = [
  'wss://stream.testnet.binance.vision',
  'wss://stream.testnet.binance.vision:9443',
];

/**
 * Build Binance WebSocket subscription URL using combined stream format
 * @param symbols - Array of symbols in TradeGrid format (e.g., ['BTC-USD', 'ETH-USD'])
 * @param endpointIndex - Which endpoint to use (0 = primary, 1+ = fallback)
 * @param isTestnet - Whether to use the testnet endpoints
 */
export function buildBinanceStreamUrl(
  symbols: string[],
  endpointIndex: number = 0,
  isTestnet: boolean = false
): string {
  const endpoints = isTestnet ? BINANCE_TESTNET_STREAM_ENDPOINTS : BINANCE_STREAM_ENDPOINTS;
  const baseUrl = endpoints[endpointIndex % endpoints.length];
  
  const streams = symbols.flatMap(sym => {
    const binanceSym = toBinanceSymbol(sym);
    return [
      `${binanceSym.toLowerCase()}@trade`,
      `${binanceSym.toLowerCase()}@kline_1m`,
      `${binanceSym.toLowerCase()}@depth20@100ms`
    ];
  });
  
  // Correct format: /stream?streams=... (not /ws/stream?streams=...)
  return `${baseUrl}/stream?streams=${streams.join('/')}`;
}

/**
 * Convert TradeGrid symbol format to Binance format
 * BTC-USD → BTCUSDT, ETH-USD → ETHUSDT
 */
export function toBinanceSymbol(symbol: string): string {
  return symbol.replace('-USD', 'USDT').replace('-', '');
}

/**
 * Convert Binance symbol format to TradeGrid format
 * BTCUSDT → BTC-USD, ETHUSDT → ETH-USD
 */
export function fromBinanceSymbol(symbol: string): string {
  if (symbol.endsWith('USDT')) {
    return symbol.replace('USDT', '-USD');
  }
  // Handle other quote currencies
  const match = symbol.match(/^([A-Z]+)([A-Z]{3})$/);
  if (match) {
    return `${match[1]}-${match[2]}`;
  }
  return symbol;
}

/**
 * Binance WebSocket message types
 */
export interface BinanceTrade {
  e: 'trade';
  E: number;  // event time
  s: string;  // symbol
  t: number;  // trade id
  p: string;  // price
  q: string;  // quantity
  b: number;  // buyer order id
  a: number;  // seller order id
  T: number;  // trade time
  m: boolean; // is buyer maker
}

export interface BinanceCandle {
  e: 'kline';
  E: number;  // event time
  s: string;  // symbol
  k: {
    t: number;  // kline start time
    T: number;  // kline close time
    s: string;  // symbol
    i: string;  // interval
    o: string;  // open
    c: string;  // close
    h: string;  // high
    l: string;  // low
    v: string;  // volume
    n: number;  // number of trades
    x: boolean; // is closed
  };
}

export interface BinanceOrderBook {
  lastUpdateId: number;
  bids: [string, string][];  // [price, quantity]
  asks: [string, string][];
}

/**
 * Normalize Binance trade to TradeGrid format
 */
export function normalizeBinanceTrade(raw: BinanceTrade) {
  return {
    t: 'trade' as const,
    sym: fromBinanceSymbol(raw.s),
    px: parseFloat(raw.p),
    qty: parseFloat(raw.q),
    side: raw.m ? 's' : 'b',
    ts: raw.T,
    id: `${raw.s}-${raw.t}`,
    formattedTime: new Date(raw.T).toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  };
}

/**
 * Normalize Binance candle to TradeGrid format
 */
export function normalizeBinanceCandle(raw: BinanceCandle) {
  const o = parseFloat(raw.k.o);
  const c = parseFloat(raw.k.c);
  
  return {
    t: 'candle' as const,
    sym: fromBinanceSymbol(raw.s),
    interval: mapBinanceInterval(raw.k.i),
    o,
    h: parseFloat(raw.k.h),
    l: parseFloat(raw.k.l),
    c,
    v: parseFloat(raw.k.v),
    ts: raw.k.T,
    isUp: c >= o,
    changePercent: ((c - o) / o) * 100
  };
}

/**
 * Normalize Binance order book to TradeGrid format
 */
export function normalizeBinanceOrderBook(raw: BinanceOrderBook, symbol: string) {
  return {
    t: 'book' as const,
    sym: fromBinanceSymbol(symbol),
    bids: raw.bids.map(([p, s]) => [parseFloat(p), parseFloat(s)] as [number, number]),
    asks: raw.asks.map(([p, s]) => [parseFloat(p), parseFloat(s)] as [number, number]),
    ts: Date.now()
  };
}

/**
 * Map Binance interval to TradeGrid interval
 */
function mapBinanceInterval(interval: string): '1m' | '5m' | '15m' | '1h' | '1D' {
  const map: Record<string, '1m' | '5m' | '15m' | '1h' | '1D'> = {
    '1m': '1m',
    '5m': '5m',
    '15m': '15m',
    '1h': '1h',
    '1d': '1D'
  };
  return map[interval] || '1m';
}
