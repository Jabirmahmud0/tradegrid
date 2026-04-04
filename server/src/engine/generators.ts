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
  k: {
    o: string; // open
    h: string; // high
    l: string; // low
    c: string; // close
    v: string; // volume
    x: boolean; // is closed
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
  private readonly CANDLE_DURATION_MS = 60000; // 1 minute candles

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

  public generateCandle(symbol: string): CandleEvent {
    const now = Date.now();
    const price = this.simulator.getPrice(symbol);
    
    // Check if we need to start a new candle
    const lastOpenTime = this.candleOpenTime.get(symbol) || 0;
    const isNewCandle = now - lastOpenTime >= this.CANDLE_DURATION_MS;
    
    let state = this.ohlcv.get(symbol);
    
    if (isNewCandle || !state) {
      // Start new candle
      state = { o: price, h: price, l: price, c: price, v: 0 };
      this.candleOpenTime.set(symbol, now);
    } else {
      // Update existing candle
      state.h = Math.max(state.h, price);
      state.l = Math.min(state.l, price);
      state.c = price;
    }
    
    state.v = (parseFloat(state.v) + Math.random() * 10).toFixed(2);
    this.ohlcv.set(symbol, state);

    return {
      e: 'candle',
      E: Date.now(),
      s: symbol,
      k: {
        o: state.o.toFixed(2),
        h: state.h.toFixed(2),
        l: state.l.toFixed(2),
        c: state.c.toFixed(2),
        v: state.v,
        x: false
      }
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
