import { CandleInterval, NormalizedCandle } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

interface MockHistoryCandle {
  e: 'candle';
  s: string;
  interval: CandleInterval;
  k: {
    o: string;
    h: string;
    l: string;
    c: string;
    v: string;
    x: boolean;
    T: number;
  };
}

export async function fetchMockCandles(
  symbol: string,
  interval: CandleInterval,
  signal?: AbortSignal
): Promise<NormalizedCandle[]> {
  const res = await fetch(`${API_BASE}/history/${symbol}?interval=${interval}`, { signal });

  if (!res.ok) {
    throw new Error(`Failed to fetch mock candles: ${res.status} ${res.statusText}`);
  }

  const rows = await res.json() as MockHistoryCandle[];
  const latestByTimestamp = new Map<number, MockHistoryCandle>();

  for (const row of rows) {
    latestByTimestamp.set(row.k.T, row);
  }

  return Array.from(latestByTimestamp.values())
    .sort((a, b) => a.k.T - b.k.T)
    .map((row) => {
      const open = Number(row.k.o);
      const close = Number(row.k.c);

      return {
        t: 'candle',
        sym: row.s,
        interval: row.interval,
        o: open,
        h: Number(row.k.h),
        l: Number(row.k.l),
        c: close,
        v: Number(row.k.v),
        ts: row.k.T,
        isUp: close >= open,
        changePercent: open > 0 ? ((close - open) / open) * 100 : 0,
      };
    });
}
