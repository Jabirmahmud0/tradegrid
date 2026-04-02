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

  constructor(symbols: string[], onSnapshot: (snapshot: HeatmapSnapshot) => void) {
    this.symbols = symbols;
    this.onSnapshot = onSnapshot;
  }

  public start() {
    if (this.interval) return;
    this.interval = setInterval(() => {
      this.onSnapshot(this.generateSnapshot());
    }, 100);
  }

  public stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  private generateSnapshot(): HeatmapSnapshot {
    const sectors: Record<string, string> = {
      'BTC-USD': 'Core', 'ETH-USD': 'Core', 'SOL-USD': 'L1', 'ADA-USD': 'L1', 'DOT-USD': 'L1', 'AVAX-USD': 'L1',
      'ARB-USD': 'L2', 'OP-USD': 'L2', 'MATIC-USD': 'L2',
      'LINK-USD': 'DeFi', 'UNI-USD': 'DeFi', 'AAVE-USD': 'DeFi'
    };

    return {
      t: 'heatmap',
      cells: this.symbols.map(sym => ({
        sym,
        delta: (Math.random() * 2) - 1, // Sentiment
        vol: Math.random() * 1000,     // Volume for treemap sizing
        sector: sectors[sym] || 'Misc'
      })),
      ts: Date.now()
    };
  }
}
