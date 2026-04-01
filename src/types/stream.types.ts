export type Side = 'b' | 's'; // buy / sell
export type CandleInterval = '1m' | '5m' | '15m' | '1h' | '1D';

export interface TradeEvent {
  t: 'trade';
  sym: string;   // symbol e.g. "BTC-USD"
  px: number;    // price
  qty: number;   // quantity
  side: Side;
  ts: number;    // unix ms timestamp
}

export interface CandleEvent {
  t: 'candle';
  sym: string;
  interval: CandleInterval;
  o: number;     // open
  h: number;     // high
  l: number;     // low
  c: number;     // close
  v: number;     // volume
  ts: number;
}

export interface BookDeltaEvent {
  t: 'book';
  sym: string;
  bids: [number, number][]; // [price, size]
  asks: [number, number][];
  ts: number;
}

export interface HeatmapEvent {
  t: 'heatmap';
  cells: {
    sym: string;
    delta: number;
    vol: number;
  }[];
  ts: number;
}

export type StreamEvent = TradeEvent | CandleEvent | BookDeltaEvent | HeatmapEvent;

export interface NormalizedTrade extends TradeEvent {
  id: string;
  formattedTime: string;
}

export interface NormalizedCandle extends CandleEvent {
  isUp: boolean;
  changePercent: number;
}

export interface MarketHistory {
  symbol: string;
  candles: NormalizedCandle[];
}
