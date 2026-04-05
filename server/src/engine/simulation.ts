export interface PriceTick {
  symbol: string;
  price: number;
  timestamp: number;
  lastClose: number;
}

const BASE_PRICES: Record<string, number> = {
  'BTC-USD': 50000,
  'ETH-USD': 2500,
  'SOL-USD': 150,
  'ARB-USD': 1.2,
  'OP-USD': 2.5,
  'LINK-USD': 15,
  'ADA-USD': 0.5,
  'DOT-USD': 7,
  'MATIC-USD': 0.8,
  'AVAX-USD': 35,
};

const VOLATILITIES: Record<string, number> = {
  'BTC-USD': 0.001,
  'ETH-USD': 0.002,
  'SOL-USD': 0.003,
  'ARB-USD': 0.004,
  'OP-USD': 0.004,
  'LINK-USD': 0.003,
  'ADA-USD': 0.004,
  'DOT-USD': 0.003,
  'MATIC-USD': 0.004,
  'AVAX-USD': 0.003,
};

export class MarketSimulator {
  private prices: Map<string, number> = new Map();
  private volatility: Map<string, number> = new Map();
  private minPrices: Map<string, number> = new Map();
  private lastUpdate: number = Date.now();

  constructor(symbols: string[]) {
    symbols.forEach(symbol => {
      const basePrice = BASE_PRICES[symbol] ?? 100;
      const vol = VOLATILITIES[symbol] ?? 0.001;

      this.prices.set(symbol, basePrice);
      this.volatility.set(symbol, vol);
      this.minPrices.set(symbol, basePrice);
    });
  }

  public tick(symbol: string): PriceTick {
    const currentPrice = this.prices.get(symbol) || 100;
    const vol = this.volatility.get(symbol) || 0.0001;
    const minPrice = this.minPrices.get(symbol) || currentPrice;

    // Brownian Motion: nextPrice = currentPrice * exp((drift - 0.5 * vol^2) * dt + vol * sqrt(dt) * Z)
    // Simplified for fast simulation:
    const change = (Math.random() - 0.5) * 2 * vol * currentPrice;
    let nextPrice = currentPrice + change;

    // Price floor: prevent negative or unreasonably low prices
    nextPrice = Math.max(nextPrice, minPrice * 0.1);

    this.prices.set(symbol, nextPrice);

    return {
      symbol,
      price: nextPrice,
      timestamp: Date.now(),
      lastClose: currentPrice
    };
  }

  public getPrice(symbol: string): number {
    return this.prices.get(symbol) || 0;
  }
}
