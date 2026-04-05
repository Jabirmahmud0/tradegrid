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
  private currentPrices: Map<string, number> = new Map();
  private anchorPrices: Map<string, number> = new Map();
  private rollingVolume: Map<string, number> = new Map();

  constructor(symbols: string[], onSnapshot: (snapshot: HeatmapSnapshot) => void) {
    this.symbols = symbols;
    this.onSnapshot = onSnapshot;
  }

  /**
   * Update current prices from the simulator. Called on each tick.
   */
  public updatePrices(symbol: string, price: number, notional: number = 0) {
    const previous = this.currentPrices.get(symbol);
    this.currentPrices.set(symbol, price);

    if (!this.anchorPrices.has(symbol)) {
      this.anchorPrices.set(symbol, price);
    } else {
      const anchor = this.anchorPrices.get(symbol)!;
      this.anchorPrices.set(symbol, anchor * 0.985 + price * 0.015);
    }

    const priorRolling = this.rollingVolume.get(symbol) ?? 0;
    const deltaNotional = previous !== undefined ? Math.abs(price - previous) * 250 : 0;
    const blendedInput = Math.max(notional, deltaNotional);
    this.rollingVolume.set(symbol, priorRolling * 0.82 + blendedInput * 0.18);
  }

  public start() {
    if (this.interval) return;
    this.interval = setInterval(() => {
      this.onSnapshot(this.generateSnapshot());
    }, 800);
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
        const currentPrice = this.currentPrices.get(sym);
        const anchorPrice = this.anchorPrices.get(sym);
        let delta = 0;
        let vol = this.rollingVolume.get(sym) ?? 0;

        if (currentPrice !== undefined && anchorPrice !== undefined && anchorPrice > 0) {
          delta = (currentPrice - anchorPrice) / anchorPrice;
          delta = Math.max(-0.12, Math.min(0.12, delta));
          vol = Math.max(vol, currentPrice * 15);
        } else {
          delta = 0;
          vol = vol || 1000;
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
