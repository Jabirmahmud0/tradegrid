import { CandleInterval, NormalizedCandle } from '../types';
import { toBinanceSymbol } from '../adapters/binance.adapter';
import type { DataSourceType } from './market-client';

const BINANCE_REST_BASE = 'https://api.binance.com/api/v3';
const BINANCE_TESTNET_REST_BASE = 'https://testnet.binance.vision/api/v3';

const INTERVAL_MAP: Record<CandleInterval, string> = {
  '1m': '1m',
  '5m': '5m',
  '15m': '15m',
  '1h': '1h',
  '1D': '1d',
};

export function toBinanceInterval(interval: CandleInterval): string {
  return INTERVAL_MAP[interval] ?? '1m';
}

function getRestBase(source: Extract<DataSourceType, 'binance' | 'binance-testnet'>): string {
  return source === 'binance-testnet' ? BINANCE_TESTNET_REST_BASE : BINANCE_REST_BASE;
}

export async function fetchBinanceCandles(
  source: Extract<DataSourceType, 'binance' | 'binance-testnet'>,
  symbol: string,
  interval: CandleInterval,
  limit = 300,
  signal?: AbortSignal
): Promise<NormalizedCandle[]> {
  const url = `${getRestBase(source)}/uiKlines?symbol=${toBinanceSymbol(symbol)}&interval=${toBinanceInterval(interval)}&limit=${limit}`;
  const res = await fetch(url, { signal });

  if (!res.ok) {
    throw new Error(`Failed to fetch Binance candles: ${res.status} ${res.statusText}`);
  }

  const rows = await res.json() as [
    number,
    string,
    string,
    string,
    string,
    string,
    number,
    string,
    number,
    string,
    string,
    string
  ][];

  return rows.map((row) => {
    const open = Number(row[1]);
    const high = Number(row[2]);
    const low = Number(row[3]);
    const close = Number(row[4]);

    return {
      t: 'candle',
      sym: symbol,
      interval,
      o: open,
      h: high,
      l: low,
      c: close,
      v: Number(row[5]),
      ts: row[0],
      isUp: close >= open,
      changePercent: open > 0 ? ((close - open) / open) * 100 : 0,
    };
  });
}
