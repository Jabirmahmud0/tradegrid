import { NormalizedTrade } from '../../types/stream.types';

export interface ExecutionSignal {
  id: string;
  timestamp: number;
  symbol: string;
  signal: 'MOMENTUM_BUY' | 'MOMENTUM_SELL' | 'VOL_SPIKE' | 'REVERSAL';
  price: number;
  qty: number;
  status: 'PENDING' | 'FILLED' | 'CANCELLED';
  confidence: number; // 0-1
}

/**
 * Simulated execution engine — watches live trades and generates
 * hypothetical signals based on simple heuristics.
 * Not a real trading system; purely for visualization/demo purposes.
 */
export class ExecutionEngine {
  private recentTrades: NormalizedTrade[] = [];
  private signals: ExecutionSignal[] = [];
  private lastSignalTime = 0;
  private signalIdCounter = 0;
  private readonly COOLDOWN_MS = 3000; // Minimum time between signals
  private readonly WINDOW_SIZE = 20;

  /** Feed a new trade into the engine; returns any generated signals */
  processTrade(trade: NormalizedTrade): ExecutionSignal | null {
    this.recentTrades.push(trade);
    if (this.recentTrades.length > this.WINDOW_SIZE) {
      this.recentTrades.shift();
    }

    // Rate limit signals
    const now = Date.now();
    if (now - this.lastSignalTime < this.COOLDOWN_MS) return null;

    if (this.recentTrades.length < 5) return null;

    const signal = this.detectSignal(trade);
    if (signal) {
      this.lastSignalTime = now;
      this.signals.push(signal);
      if (this.signals.length > 200) this.signals.shift();
    }
    return signal;
  }

  getSignals(): ExecutionSignal[] {
    return [...this.signals].reverse(); // newest first
  }

  clear(): void {
    this.recentTrades = [];
    this.signals = [];
  }

  private detectSignal(trade: NormalizedTrade): ExecutionSignal | null {
    const window = this.recentTrades;
    const prices = window.map(t => t.px);
    const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
    const currentPrice = trade.px;
    const deviation = Math.abs(currentPrice - avg) / avg;

    // Volatility spike
    if (deviation > 0.002 && window.length >= 10) {
      return this.createSignal(
        trade,
        currentPrice > avg ? 'MOMENTUM_BUY' : 'MOMENTUM_SELL',
        Math.min(0.95, deviation * 100)
      );
    }

    // Volume spike
    const volumes = window.map(t => t.qty);
    const avgVol = volumes.reduce((a, b) => a + b, 0) / volumes.length;
    if (trade.qty > avgVol * 3) {
      return this.createSignal(trade, 'VOL_SPIKE', Math.min(0.9, trade.qty / (avgVol * 10)));
    }

    // Reversal (3 consecutive same-direction moves then opposite)
    if (window.length >= 4) {
      const last4 = window.slice(-4);
      const directions = last4.slice(1).map((t, i) => t.px > last4[i].px ? 1 : -1);
      if (directions[0] === directions[1] && directions[1] === directions[2] && directions[2] !== Math.sign(currentPrice - avg)) {
        return this.createSignal(trade, 'REVERSAL', 0.7);
      }
    }

    return null;
  }

  private createSignal(trade: NormalizedTrade, signal: ExecutionSignal['signal'], confidence: number): ExecutionSignal {
    this.signalIdCounter++;
    const statuses: ExecutionSignal['status'][] = ['PENDING', 'FILLED', 'FILLED', 'FILLED', 'CANCELLED'];
    return {
      id: `SIG-${this.signalIdCounter.toString().padStart(4, '0')}`,
      timestamp: trade.ts,
      symbol: trade.sym,
      signal,
      price: trade.px,
      qty: trade.qty,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      confidence: Math.round(confidence * 100) / 100,
    };
  }
}
