import { getSector } from '../utils/sectors.js';

export interface HeatmapCell {
  sym: string;
  delta: number;
  vol: number;
  sector: string;
}

export interface HeatmapSnapshot {
  t: 'heatmap';
  cells: HeatmapCell[];
  ts: number;
}

export class HeatmapGenerator {
  private symbols: string[];
  private interval: any = null;
  private onSnapshot: (snapshot: HeatmapSnapshot) => void;
  // Track previous prices to compute delta (price change %)
  private previousPrices: Map<string, number> = new Map();

  constructor(symbols: string[], onSnapshot: (snapshot: HeatmapSnapshot) => void) {
    this.symbols = symbols;
    this.onSnapshot = onSnapshot;
  }

  /**
   * Update current prices from the simulator. Called on each tick.
   */
  public updatePrices(symbol: string, price: number) {
    this.previousPrices.set(symbol, price);
  }

  public start() {
    if (this.interval) return;
    this.interval = setInterval(() => {
      this.onSnapshot(this.generateSnapshot());
    }, 500); // Slower updates for more stable heatmap
  }

  public stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  private generateSnapshot(): HeatmapSnapshot {
    return {
      t: 'heatmap',
      cells: this.symbols.map(sym => {
        const currentPrice = this.previousPrices.get(sym);
        // Compute delta as normalized price change (use 100 as reference base)
        // When no price data yet, use random sentiment as fallback
        let delta: number;
        let vol: number;

        if (currentPrice !== undefined && this.previousPrices.has(sym)) {
          // Use a small simulated change based on price
          delta = ((currentPrice % 10) / 100) * (Math.random() > 0.5 ? 1 : -1);
          vol = Math.floor(currentPrice * Math.random() * 100);
        } else {
          delta = (Math.random() * 2) - 1;
          vol = Math.random() * 1000;
        }

        return {
          sym,
          delta,
          vol,
          sector: getSector(sym)
        };
      }),
      ts: Date.now()
    };
  }
}
