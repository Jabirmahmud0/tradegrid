import React from 'react';
import { useLiveStore } from '../../store/live-store';
import { ExecutionEngine, ExecutionSignal } from './ExecutionEngine';
import { cn } from '../../utils';
import { EmptyState } from '../../components/common/EmptyState';

const SIGNAL_COLORS: Record<ExecutionSignal['signal'], string> = {
  MOMENTUM_BUY: 'text-[var(--color-profit)]',
  MOMENTUM_SELL: 'text-[var(--color-loss)]',
  VOL_SPIKE: 'text-[var(--color-accent)]',
  REVERSAL: 'text-amber-400',
};

const STATUS_STYLES: Record<ExecutionSignal['status'], string> = {
  PENDING: 'bg-amber-500/10 text-amber-400',
  FILLED: 'bg-[var(--color-profit)]/10 text-[var(--color-profit)]',
  CANCELLED: 'bg-zinc-700/30 text-zinc-500',
};

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export const ExecutionsTab: React.FC = () => {
  const activeSymbol = useLiveStore((s) => s.activeSymbol);
  const trades = useLiveStore((s) => s.trades);
  const [signals, setSignals] = React.useState<ExecutionSignal[]>([]);
  const engineRef = React.useRef<ExecutionEngine | null>(null);

  // Initialize engine once
  if (!engineRef.current) {
    engineRef.current = new ExecutionEngine();
  }

  // Process new trades through the engine
  React.useEffect(() => {
    if (!engineRef.current) return;

    // Process any trades that haven't been processed yet
    const engine = engineRef.current;
    const tradeCount = trades.length;

    // Simple approach: process the most recent N trades
    const recentTrades = trades.slice(0, Math.min(50, tradeCount));
    for (const trade of recentTrades) {
      engine.processTrade(trade);
    }

    setSignals(engine.getSignals());
  }, [trades, activeSymbol]);

  // Reset on symbol change
  React.useEffect(() => {
    engineRef.current?.clear();
    setSignals([]);
  }, [activeSymbol]);

  if (signals.length === 0) {
    return <EmptyState message="Waiting for execution signals..." />;
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header Stats */}
      <div className="flex items-center gap-3 px-3 py-2 border-b border-[var(--color-border)] shrink-0">
        <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">Signals:</span>
        <span className="text-[10px] font-mono text-zinc-300">{signals.length}</span>
        <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 ml-2">Filled:</span>
        <span className="text-[10px] font-mono text-[var(--color-profit)]">
          {signals.filter(s => s.status === 'FILLED').length}
        </span>
        <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 ml-2">Pending:</span>
        <span className="text-[10px] font-mono text-amber-400">
          {signals.filter(s => s.status === 'PENDING').length}
        </span>
      </div>

      {/* Signal Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-[10px] font-mono" role="table" aria-label="Execution signals">
          <thead className="sticky top-0 bg-[var(--color-bg-base)] z-10">
            <tr className="border-b border-[var(--color-border)]">
              <th className="px-3 py-1.5 text-left text-[9px] font-bold uppercase tracking-wider text-zinc-500">ID</th>
              <th className="px-3 py-1.5 text-left text-[9px] font-bold uppercase tracking-wider text-zinc-500">Time</th>
              <th className="px-3 py-1.5 text-left text-[9px] font-bold uppercase tracking-wider text-zinc-500">Signal</th>
              <th className="px-3 py-1.5 text-right text-[9px] font-bold uppercase tracking-wider text-zinc-500">Price</th>
              <th className="px-3 py-1.5 text-right text-[9px] font-bold uppercase tracking-wider text-zinc-500">Qty</th>
              <th className="px-3 py-1.5 text-right text-[9px] font-bold uppercase tracking-wider text-zinc-500">Confidence</th>
              <th className="px-3 py-1.5 text-center text-[9px] font-bold uppercase tracking-wider text-zinc-500">Status</th>
            </tr>
          </thead>
          <tbody>
            {signals.map((sig) => (
              <tr key={sig.id} className="border-b border-[var(--color-border-subtle)] hover:bg-[var(--color-bg-surface)] transition-colors">
                <td className="px-3 py-1 text-zinc-400">{sig.id}</td>
                <td className="px-3 py-1 text-zinc-300 tabular-nums">{formatTime(sig.timestamp)}</td>
                <td className={cn('px-3 py-1 font-bold', SIGNAL_COLORS[sig.signal])}>
                  {sig.signal.replace('_', ' ')}
                </td>
                <td className="px-3 py-1 text-right text-zinc-300 tabular-nums">{sig.price.toLocaleString()}</td>
                <td className="px-3 py-1 text-right text-zinc-300 tabular-nums">{sig.qty.toFixed(4)}</td>
                <td className="px-3 py-1 text-right text-zinc-300 tabular-nums">{(sig.confidence * 100).toFixed(0)}%</td>
                <td className="px-3 py-1 text-center">
                  <span className={cn('px-1.5 py-0.5 rounded text-[8px] font-bold uppercase', STATUS_STYLES[sig.status])}>
                    {sig.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
