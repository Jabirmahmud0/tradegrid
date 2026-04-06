import React from 'react';
import { useLiveStore } from '../../store/live-store';
import { Card } from '../../components/ui/Card';
import { TrendingUp, TrendingDown, Activity, BarChart3, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '../../utils';
import { getMarketSector } from '../../lib/market-symbols';
import type { MarketStats } from '../../store/live-store/market-stats.slice';

const SECTORS = ['Core', 'L1', 'L2', 'DeFi'] as const;
const EMPTY_HEATMAP_CELLS: any[] = [];

type AnalyticsSymbol = {
  sym: string;
  delta: number;
  vol: number;
  price: number;
};

export const AnalyticsPage: React.FC = () => {
  const heatmapCells = useLiveStore((s) => s.heatmap?.cells ?? EMPTY_HEATMAP_CELLS);
  const books = useLiveStore((s) => s.books);
  const trades = useLiveStore((s) => s.trades);
  const stats = useLiveStore((s) => s.stats);
  const candles = useLiveStore((s) => s.candles);
  const activeSymbol = useLiveStore((s) => s.activeSymbol);

  const derivedSymbols = React.useMemo<AnalyticsSymbol[]>(() => {
    const fromStats = new Map<string, AnalyticsSymbol>();

    for (const [sym, stat] of Object.entries(stats) as [string, MarketStats][]) {
      fromStats.set(sym, {
        sym,
        delta: (stat.changePercent24h ?? 0) / 100,
        vol: stat.volume24h ?? 0,
        price: stat.price ?? 0,
      });
    }

    for (const [key, series] of Object.entries(candles)) {
      if (series.length === 0) continue;
      const latest = series[series.length - 1];
      const previous = series[series.length - 2];
      const prevPrice = previous?.c ?? latest.o ?? latest.c;
      const delta = prevPrice > 0 ? (latest.c - prevPrice) / prevPrice : 0;
      const volume = series.slice(-Math.min(series.length, 144)).reduce((sum, candle) => sum + candle.v, 0);
      const symbol = latest.sym || key.split('-').slice(0, 2).join('-');

      fromStats.set(symbol, {
        sym: symbol,
        delta,
        vol: volume,
        price: latest.c,
      });
    }

    for (const trade of trades) {
      if (fromStats.has(trade.sym)) continue;
      fromStats.set(trade.sym, {
        sym: trade.sym,
        delta: 0,
        vol: trade.qty,
        price: trade.px,
      });
    }

    if (fromStats.size === 0 && heatmapCells.length > 0) {
      for (const cell of heatmapCells) {
        fromStats.set(cell.sym, {
          sym: cell.sym,
          delta: cell.delta,
          vol: cell.vol,
          price: 0,
        });
      }
    }

    const ordered = Array.from(fromStats.values()).sort((a, b) => {
      if (a.sym === activeSymbol) return -1;
      if (b.sym === activeSymbol) return 1;
      return Math.abs(b.delta) - Math.abs(a.delta);
    });

    return ordered;
  }, [activeSymbol, candles, heatmapCells, stats, trades]);

  const totalSymbols = React.useMemo(() => {
    const uniqueSymbols = new Set<string>([
      ...derivedSymbols.map((symbol) => symbol.sym),
      ...Object.keys(books),
      ...trades.map((trade) => trade.sym),
    ]);
    return uniqueSymbols.size;
  }, [books, derivedSymbols, trades]);

  const totalTrades = trades.length;
  const gainers = derivedSymbols.filter((symbol) => symbol.delta > 0).length;
  const losers = derivedSymbols.filter((symbol) => symbol.delta < 0).length;

  const sectorStats = React.useMemo(() => {
    return SECTORS.map((sector) => {
      const sectorSymbols = derivedSymbols.filter((symbol) => getMarketSector(symbol.sym) === sector);
      const avgDelta = sectorSymbols.length > 0
        ? sectorSymbols.reduce((sum, symbol) => sum + symbol.delta, 0) / sectorSymbols.length
        : 0;
      const totalVol = sectorSymbols.reduce((sum, symbol) => sum + symbol.vol, 0);
      return { sector, avgDelta, totalVol, count: sectorSymbols.length };
    });
  }, [derivedSymbols]);

  const topMovers = derivedSymbols.slice(0, 8);

  return (
    <div className="h-full overflow-auto p-4 bg-[var(--color-bg-base)]">
      <div className="mb-4">
        <h1 className="text-lg font-bold text-[var(--color-text-primary)]">Portfolio Analytics</h1>
        <p className="text-[10px] text-[var(--color-text-tertiary)] font-mono">Aggregate market statistics across monitored instruments</p>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-4">
        <StatCard label="Active Symbols" value={totalSymbols} icon={<BarChart3 size={14} />} />
        <StatCard label="Total Trades" value={totalTrades.toLocaleString()} icon={<Activity size={14} />} />
        <StatCard label="Gainers" value={gainers} icon={<TrendingUp size={14} />} accent="text-[var(--color-profit)]" />
        <StatCard label="Losers" value={losers} icon={<TrendingDown size={14} />} accent="text-[var(--color-loss)]" />
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <Card variant="outline" header="Sector Performance" className="border-[var(--color-border)]">
          <div className="flex flex-col gap-2 p-2">
            {sectorStats.map((sector) => (
              <div key={sector.sector} className="flex items-center justify-between text-[10px] font-mono">
                <span className="text-[var(--color-text-secondary)] font-bold uppercase">{sector.sector}</span>
                <div className="flex items-center gap-4">
                  <span className="text-zinc-500">{sector.count} symbols</span>
                  <span className="text-zinc-500">Vol: {sector.totalVol.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  <span className={cn('font-bold flex items-center gap-1', sector.avgDelta >= 0 ? 'text-[var(--color-profit)]' : 'text-[var(--color-loss)]')}>
                    {sector.avgDelta >= 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                    {(sector.avgDelta * 100).toFixed(2)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card variant="outline" header="Instrument Stats" className="border-[var(--color-border)]">
          <div className="flex flex-col gap-2 p-2 max-h-[200px] overflow-auto">
            {derivedSymbols.length === 0 ? (
              <span className="text-[10px] text-[var(--color-text-tertiary)] font-mono">Waiting for market data...</span>
            ) : (
              derivedSymbols.slice(0, 10).map((symbol) => (
                <div key={symbol.sym} className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-[var(--color-text-secondary)] font-bold">{symbol.sym}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-zinc-400">{symbol.price > 0 ? symbol.price.toLocaleString() : '--'}</span>
                    <span className={cn('font-bold', symbol.delta >= 0 ? 'text-[var(--color-profit)]' : 'text-[var(--color-loss)]')}>
                      {symbol.delta >= 0 ? '+' : ''}
                      {(symbol.delta * 100).toFixed(2)}%
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <Card variant="outline" header="Top Movers" className="border-[var(--color-border)]">
        <div className="grid grid-cols-4 gap-2 p-3">
          {topMovers.length === 0 ? (
            <span className="text-[10px] text-[var(--color-text-tertiary)] font-mono col-span-4">No market snapshots yet</span>
          ) : (
            topMovers.map((symbol) => (
              <div
                key={symbol.sym}
                className={cn(
                  'p-3 rounded-sm border transition-colors',
                  symbol.delta >= 0
                    ? 'bg-[var(--color-profit)]/5 border-[var(--color-profit)]/20'
                    : 'bg-[var(--color-loss)]/5 border-[var(--color-loss)]/20'
                )}
              >
                <div className="text-[10px] font-bold text-[var(--color-text-primary)]">{symbol.sym}</div>
                <div
                  className={cn(
                    'text-sm font-bold font-mono mt-1',
                    symbol.delta >= 0 ? 'text-[var(--color-profit)]' : 'text-[var(--color-loss)]'
                  )}
                >
                  {symbol.delta >= 0 ? '+' : ''}
                  {(symbol.delta * 100).toFixed(2)}%
                </div>
                <div className="text-[9px] text-[var(--color-text-tertiary)] font-mono mt-0.5">
                  Vol: {symbol.vol.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};

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
