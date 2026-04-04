import React from 'react';
import { useLiveStore } from '../../store/live-store';
import { Card } from '../../components/ui/Card';
import { TrendingUp, TrendingDown, Activity, BarChart3, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '../../utils';
import type { MarketStats } from '../../store/live-store/market-stats.slice';

const SECTORS = ['Core', 'L1', 'L2', 'DeFi'] as const;

export const AnalyticsPage: React.FC = () => {
  const symbols = useLiveStore((s) => s.heatmap?.cells || []);
  const books = useLiveStore((s) => s.books);
  const trades = useLiveStore((s) => s.trades);
  const stats = useLiveStore((s) => s.stats);

  // Compute aggregate metrics
  const totalSymbols = Object.keys(books).length;
  const totalTrades = trades.length;
  const gainers = symbols.filter(c => c.delta > 0).length;
  const losers = symbols.filter(c => c.delta < 0).length;

  // Sector breakdown
  const sectorStats = SECTORS.map(sector => {
    const sectorCells = symbols.filter(c => getSymbolSector(c.sym) === sector);
    const avgDelta = sectorCells.length > 0
      ? sectorCells.reduce((a, c) => a + c.delta, 0) / sectorCells.length
      : 0;
    const totalVol = sectorCells.reduce((a, c) => a + c.vol, 0);
    return { sector, avgDelta, totalVol, count: sectorCells.length };
  });

  // Top movers
  const topMovers = [...symbols].sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta)).slice(0, 8);

  return (
    <div className="h-full overflow-auto p-4 bg-[var(--color-bg-base)]">
      <div className="mb-4">
        <h1 className="text-lg font-bold text-[var(--color-text-primary)]">Portfolio Analytics</h1>
        <p className="text-[10px] text-[var(--color-text-tertiary)] font-mono">Aggregate market statistics across monitored instruments</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <StatCard label="Active Symbols" value={totalSymbols} icon={<BarChart3 size={14} />} />
        <StatCard label="Total Trades" value={totalTrades.toLocaleString()} icon={<Activity size={14} />} />
        <StatCard label="Gainers" value={gainers} icon={<TrendingUp size={14} />} accent="text-[var(--color-profit)]" />
        <StatCard label="Losers" value={losers} icon={<TrendingDown size={14} />} accent="text-[var(--color-loss)]" />
      </div>

      {/* Sector Performance */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Card variant="outline" header="Sector Performance" className="border-[var(--color-border)]">
          <div className="flex flex-col gap-2 p-2">
            {sectorStats.map(s => (
              <div key={s.sector} className="flex items-center justify-between text-[10px] font-mono">
                <span className="text-[var(--color-text-secondary)] font-bold uppercase">{s.sector}</span>
                <div className="flex items-center gap-4">
                  <span className="text-zinc-500">{s.count} symbols</span>
                  <span className="text-zinc-500">Vol: {s.totalVol.toLocaleString()}</span>
                  <span className={cn('font-bold flex items-center gap-1', s.avgDelta >= 0 ? 'text-[var(--color-profit)]' : 'text-[var(--color-loss)]')}>
                    {s.avgDelta >= 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                    {(s.avgDelta * 100).toFixed(2)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Market Stats from live store */}
        <Card variant="outline" header="Instrument Stats" className="border-[var(--color-border)]">
          <div className="flex flex-col gap-2 p-2 max-h-[200px] overflow-auto">
            {Object.entries(stats).length === 0 ? (
              <span className="text-[10px] text-[var(--color-text-tertiary)] font-mono">Waiting for market data...</span>
            ) : (
              (Object.entries(stats) as [string, MarketStats][]).slice(0, 10).map(([sym, stat]) => (
                <div key={sym} className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-[var(--color-text-secondary)] font-bold">{sym}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-zinc-400">{stat.price?.toLocaleString() ?? '—'}</span>
                    <span className={cn(
                      'font-bold',
                      (stat.changePercent24h ?? 0) >= 0 ? 'text-[var(--color-profit)]' : 'text-[var(--color-loss)]'
                    )}>
                      {(stat.changePercent24h ?? 0) >= 0 ? '+' : ''}{(stat.changePercent24h ?? 0).toFixed(2)}%
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Top Movers Heatmap */}
      <Card variant="outline" header="Top Movers" className="border-[var(--color-border)]">
        <div className="grid grid-cols-4 gap-2 p-3">
          {topMovers.length === 0 ? (
            <span className="text-[10px] text-[var(--color-text-tertiary)] font-mono col-span-4">No heatmap data yet</span>
          ) : (
            topMovers.map(cell => (
              <div
                key={cell.sym}
                className={cn(
                  'p-3 rounded-sm border transition-colors',
                  cell.delta >= 0
                    ? 'bg-[var(--color-profit)]/5 border-[var(--color-profit)]/20'
                    : 'bg-[var(--color-loss)]/5 border-[var(--color-loss)]/20'
                )}
              >
                <div className="text-[10px] font-bold text-[var(--color-text-primary)]">{cell.sym}</div>
                <div className={cn(
                  'text-sm font-bold font-mono mt-1',
                  cell.delta >= 0 ? 'text-[var(--color-profit)]' : 'text-[var(--color-loss)]'
                )}>
                  {cell.delta >= 0 ? '+' : ''}{(cell.delta * 100).toFixed(2)}%
                </div>
                <div className="text-[9px] text-[var(--color-text-tertiary)] font-mono mt-0.5">
                  Vol: {cell.vol.toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};

function getSymbolSector(sym: string): string {
  const map: Record<string, string> = {
    'BTC-USD': 'Core', 'ETH-USD': 'Core',
    'SOL-USD': 'L1', 'ADA-USD': 'L1', 'DOT-USD': 'L1', 'AVAX-USD': 'L1',
    'ARB-USD': 'L2', 'OP-USD': 'L2', 'MATIC-USD': 'L2',
    'LINK-USD': 'DeFi', 'UNI-USD': 'DeFi',
  };
  return map[sym] || 'Misc';
}

const StatCard: React.FC<{ label: string; value: string | number; icon: React.ReactNode; accent?: string }> = ({ label, value, icon, accent }) => (
  <Card variant="outline" className={cn('border-[var(--color-border)]', accent && 'border-opacity-50')}>
    <div className="flex items-center justify-between p-3">
      <div>
        <div className="text-[9px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)]">{label}</div>
        <div className={cn('text-xl font-bold font-mono mt-1', accent || 'text-[var(--color-text-primary)]')}>{value}</div>
      </div>
      <div className="text-[var(--color-text-tertiary)]">{icon}</div>
    </div>
  </Card>
);
