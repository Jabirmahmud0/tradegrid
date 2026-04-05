import { MarketSimulator, PriceTick } from './simulation.js';

export type EventType = 'trade' | 'candle' | 'book' | 'quote' | 'heatmap';

export interface BaseEvent {
  e: EventType; // event type
  E: number;    // event time
  s: string;    // symbol
}

export interface TradeEvent extends BaseEvent {
  e: 'trade';
  p: string;    // price
  q: string;    // quantity
  m: boolean;   // is buyer maker
}

export interface CandleEvent extends BaseEvent {
  e: 'candle';
  interval: string; // '1m', '5m', '15m', '1h', '1D'
  k: {
    o: string; // open
    h: string; // high
    l: string; // low
    c: string; // close
    v: string; // volume
    x: boolean; // is closed
    T: number;  // candle close/open time (canonical candle timestamp)
  }
}

export interface OrderBookEvent extends BaseEvent {
  e: 'book';
  b: [string, string][]; // bids [price, size][]
  a: [string, string][]; // asks [price, size][]
}

export class DataGenerator {
  private simulator: MarketSimulator;
  private ohlcv: Map<string, any> = new Map();
  private candleOpenTime: Map<string, number> = new Map();
  // Multi-interval candle aggregation: store per-interval state
  private intervalCandles: Map<string, Map<string, any>> = new Map(); // symbol -> interval -> state
  private intervalOpenTime: Map<string, Map<string, number>> = new Map();
  private readonly INTERVALS: { key: string; durationMs: number }[] = [
    { key: '1m', durationMs: 60000 },
    { key: '5m', durationMs: 5 * 60000 },
    { key: '15m', durationMs: 15 * 60000 },
    { key: '1h', durationMs: 60 * 60000 },
    { key: '1D', durationMs: 24 * 60 * 60000 },
  ];

  constructor(simulator: MarketSimulator) {
    this.simulator = simulator;
  }

  public generateTrade(symbol: string): TradeEvent {
    const tick = this.simulator.tick(symbol);
    const quantity = (Math.random() * 2).toFixed(4);

    return {
      e: 'trade',
      E: Date.now(),
      s: symbol,
      p: tick.price.toFixed(2),
      q: quantity,
      m: Math.random() > 0.5
    };
  }

  /**
   * Generate candles for ALL intervals. Returns array of CandleEvent that need closing
   * (when interval boundary is crossed) plus the current updating candle.
   */
  public generateCandlesForSymbol(symbol: string): CandleEvent[] {
    const now = Date.now();
    const price = this.simulator.getPrice(symbol);
    const events: CandleEvent[] = [];

    for (const interval of this.INTERVALS) {
      const lastOpenTime = this.intervalOpenTime.get(symbol)?.get(interval.key) || 0;
      const isNewCandle = now - lastOpenTime >= interval.durationMs;

      let state = this.intervalCandles.get(symbol)?.get(interval.key);

      // If crossing interval boundary: close previous candle and start new one
      if (isNewCandle && state) {
        const closedEvent: CandleEvent = {
          e: 'candle',
          E: lastOpenTime,
          s: symbol,
          interval: interval.key,
          k: {
            o: state.o.toFixed(2),
            h: state.h.toFixed(2),
            l: state.l.toFixed(2),
            c: state.c.toFixed(2),
            v: Number(state.v).toFixed(4),
            x: true,
            T: lastOpenTime
          }
        };
        events.push(closedEvent);

        // Start new candle with open = previous close
        state = { o: state.c, h: price, l: price, c: price, v: 0 };
        this.intervalOpenTime.get(symbol)!.set(interval.key, now);
        this.intervalCandles.get(symbol)!.set(interval.key, state);
      }

      if (!state) {
        // First candle for this symbol/interval
        state = { o: price, h: price, l: price, c: price, v: 0 };
        if (!this.intervalCandles.has(symbol)) this.intervalCandles.set(symbol, new Map());
        if (!this.intervalOpenTime.has(symbol)) this.intervalOpenTime.set(symbol, new Map());
        this.intervalCandles.get(symbol)!.set(interval.key, state);
        this.intervalOpenTime.get(symbol)!.set(interval.key, now);
      } else {
        // Update existing candle
        state.h = Math.max(state.h, price);
        state.l = Math.min(state.l, price);
        state.c = price;
      }

      state.v = Number(state.v) + Math.random() * 10;
      const currentOpenTime = this.intervalOpenTime.get(symbol)?.get(interval.key) || now;
      const updatingCandle: CandleEvent = {
        e: 'candle',
        E: now,
        s: symbol,
        interval: interval.key,
        k: {
          o: state.o.toFixed(2),
          h: state.h.toFixed(2),
          l: state.l.toFixed(2),
          c: state.c.toFixed(2),
          v: Number(state.v).toFixed(4),
          x: false,
          T: currentOpenTime
        }
      };

      const existingIdx = events.findIndex(e => e.interval === interval.key && !e.k.x);
      if (existingIdx >= 0) {
        events[existingIdx] = updatingCandle;
      } else {
        events.push(updatingCandle);
      }
    }

    return events;
  }

  /** @deprecated Use generateCandlesForSymbol instead */
  public generateCandle(symbol: string): CandleEvent {
    // Backward-compatible: generates the 1m candle only
    const events = this.generateCandlesForSymbol(symbol);
    const now = Date.now();
    const oneMEvent = events.find(e => e.interval === '1m' && !e.k.x);
    return oneMEvent || {
      e: 'candle',
      E: now,
      s: symbol,
      interval: '1m',
      k: { o: '0', h: '0', l: '0', c: '0', v: '0', x: false, T: now }
    };
  }

  public generateOrderBook(symbol: string, depth: number = 20): OrderBookEvent {
    const midPrice = this.simulator.getPrice(symbol);
    const bids: [string, string][] = [];
    const asks: [string, string][] = [];
    
    const spread = midPrice * 0.0001; // 0.01% spread

    for (let i = 0; i < depth; i++) {
        const bidPrice = midPrice - spread - (i * spread * 2);
        const askPrice = midPrice + spread + (i * spread * 2);
        
        bids.push([bidPrice.toFixed(2), (Math.random() * 5 + 1).toFixed(2)]);
        asks.push([askPrice.toFixed(2), (Math.random() * 5 + 1).toFixed(2)]);
    }

    return {
      e: 'book',
      E: Date.now(),
      s: symbol,
      b: bids,
      a: asks
    };
  }
}
