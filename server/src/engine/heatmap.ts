export interface HeatmapCell {
  sym: string;
  delta: number;
  vol: number;
}

export interface HeatmapSnapshot {
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
    const cells: HeatmapCell[] = this.symbols.map(sym => {
        // Generate pseudo-random delta between -5 and +5
        const delta = (Math.random() * 10) - 5;
        // Volume between 100k and 1M
        const vol = 100000 + Math.random() * 900000;
        
        return { sym, delta, vol };
    });

    return {
      cells,
      ts: Date.now()
    };
  }
}
