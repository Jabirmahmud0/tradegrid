export interface PriceTick {
  symbol: string;
  price: number;
  timestamp: number;
  lastClose: number;
}

export class MarketSimulator {
  private prices: Map<string, number> = new Map();
  private volatility: Map<string, number> = new Map();
  private lastUpdate: number = Date.now();

  constructor(symbols: string[]) {
    // Initial prices and volatility for common assets
    symbols.forEach(symbol => {
      let basePrice = 50000;
      let vol = 0.001; // 0.1% — enough for visible 1m candle wicks

      if (symbol.includes('ETH')) { basePrice = 2500; vol = 0.002; }
      if (symbol.includes('SOL')) { basePrice = 150; vol = 0.003; }
      
      this.prices.set(symbol, basePrice);
      this.volatility.set(symbol, vol);
    });
  }

  public tick(symbol: string): PriceTick {
    const currentPrice = this.prices.get(symbol) || 100;
    const vol = this.volatility.get(symbol) || 0.0001;
    
    // Brownian Motion: nextPrice = currentPrice * exp((drift - 0.5 * vol^2) * dt + vol * sqrt(dt) * Z)
    // Simplified for fast simulation:
    const change = (Math.random() - 0.5) * 2 * vol * currentPrice;
    const nextPrice = currentPrice + change;
    
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
