import React from 'react';
import { useLiveStore } from '../../store/live-store';
import { cn } from '../../utils';
import { EmptyState } from '../../components/common/EmptyState';

interface HistoryRecord {
  t: string;
  sym: string;
  px: number;
  qty: number;
  side: 'b' | 's';
  ts: number;
  o?: number;
  h?: number;
  l?: number;
  c?: number;
  v?: number;
  interval?: string;
}

const TRADE_COLUMNS = [
  { id: 'time', header: 'Time', accessor: (r: HistoryRecord) => formatTime(r.ts) },
  { id: 'symbol', header: 'Symbol', accessor: (r: HistoryRecord) => r.sym },
  { id: 'price', header: 'Price', accessor: (r: HistoryRecord) => r.px.toLocaleString() },
  { id: 'qty', header: 'Qty', accessor: (r: HistoryRecord) => r.qty.toFixed(4) },
  { id: 'side', header: 'Side', accessor: (r: HistoryRecord) => r.side === 'b' ? 'BUY' : 'SELL' },
] as const;

const CANDLE_COLUMNS = [
  { id: 'time', header: 'Time', accessor: (r: HistoryRecord) => formatTime(r.ts) },
  { id: 'symbol', header: 'Symbol', accessor: (r: HistoryRecord) => r.sym },
  { id: 'interval', header: 'Interval', accessor: (r: HistoryRecord) => r.interval || '1m' },
  { id: 'open', header: 'Open', accessor: (r: HistoryRecord) => r.o?.toLocaleString() ?? '—' },
  { id: 'high', header: 'High', accessor: (r: HistoryRecord) => r.h?.toLocaleString() ?? '—' },
  { id: 'low', header: 'Low', accessor: (r: HistoryRecord) => r.l?.toLocaleString() ?? '—' },
  { id: 'close', header: 'Close', accessor: (r: HistoryRecord) => r.c?.toLocaleString() ?? '—' },
  { id: 'volume', header: 'Volume', accessor: (r: HistoryRecord) => r.v?.toLocaleString() ?? '—' },
] as const;

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export const HistoryTab: React.FC = () => {
  const activeSymbol = useLiveStore((s) => s.activeSymbol);
  const [records, setRecords] = React.useState<HistoryRecord[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [dataType, setDataType] = React.useState<'trades' | 'candles'>('trades');
  const [error, setError] = React.useState<string | null>(null);

  const fetchHistory = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`http://localhost:4000/history/${activeSymbol}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setRecords(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch history');
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [activeSymbol]);

  React.useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const columns = dataType === 'trades' ? TRADE_COLUMNS : CANDLE_COLUMNS;
  const filtered = dataType === 'trades'
    ? records.filter(r => r.t === 'trade')
    : records.filter(r => r.t === 'candle');

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center text-[10px] font-mono text-zinc-500">
        Loading history...
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center text-[10px] font-mono text-red-400">
        Error: {error} — <button onClick={fetchHistory} className="ml-2 text-cyan-400 underline">Retry</button>
      </div>
    );
  }

  if (filtered.length === 0) {
    return <EmptyState message="No historical data available" />;
  }

  return (
    <div className="h-full flex flex-col">
      {/* Filter Controls */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--color-border)] shrink-0">
        <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">Type:</span>
        <button
          onClick={() => setDataType('trades')}
          className={cn(
            'px-2 py-0.5 text-[9px] font-bold uppercase rounded transition-colors',
            dataType === 'trades' ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-500 hover:text-zinc-300'
          )}
        >
          Trades ({records.filter(r => r.t === 'trade').length})
        </button>
        <button
          onClick={() => setDataType('candles')}
          className={cn(
            'px-2 py-0.5 text-[9px] font-bold uppercase rounded transition-colors',
            dataType === 'candles' ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-500 hover:text-zinc-300'
          )}
        >
          Candles ({records.filter(r => r.t === 'candle').length})
        </button>
        <span className="ml-auto text-[9px] font-mono text-zinc-600">
          {filtered.length} records
        </span>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-[10px] font-mono" role="table" aria-label="Trade history">
          <thead className="sticky top-0 bg-[var(--color-bg-base)] z-10">
            <tr className="border-b border-[var(--color-border)]">
              {columns.map(col => (
                <th key={col.id} className="px-3 py-1.5 text-left text-[9px] font-bold uppercase tracking-wider text-zinc-500">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((record, i) => (
              <tr key={i} className="border-b border-[var(--color-border-subtle)] hover:bg-[var(--color-bg-surface)] transition-colors">
                {columns.map(col => (
                  <td key={col.id} className="px-3 py-1 tabular-nums text-zinc-300">
                    {col.id === 'side' ? (
                      <span className={cn(
                        'font-bold',
                        record.side === 'b' ? 'text-[var(--color-profit)]' : 'text-[var(--color-loss)]'
                      )}>
                        {col.accessor(record)}
                      </span>
                    ) : (
                      col.accessor(record)
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
