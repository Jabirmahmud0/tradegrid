import * as React from 'react';
import { useLiveStore } from '../../store/live-store';
import { Card } from '../../components/ui/Card';
import { Database, HardDrive, MemoryStick, Trash2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { RETENTION_POLICIES } from '../../lib/retention';

export const StoragePage: React.FC = () => {
  const trades = useLiveStore((s) => s.trades);
  const candles = useLiveStore((s) => s.candles);
  const books = useLiveStore((s) => s.books);
  const heatmap = useLiveStore((s) => s.heatmap);
  const debugLog = useLiveStore((s) => s.debug.eventLog);

  // Calculate buffer utilization per stream type
  const tradeCapacity = RETENTION_POLICIES.TRADES;
  const tradeUtilization = Math.min((trades.length / tradeCapacity) * 100, 100);

  // Count total candles across all symbol-interval pairs
  let totalCandles = 0;
  let candleCapacity = 0;
  Object.entries(candles).forEach(([key, ring]) => {
    totalCandles += ring.length;
    // 1m intervals get 500, 1h+ get 200
    const is1m = key.includes('1m');
    candleCapacity += is1m ? RETENTION_POLICIES.CANDLES.MIN_1 : RETENTION_POLICIES.CANDLES.HOUR_1_PLUS;
  });
  const candleUtilization = candleCapacity > 0 ? Math.min((totalCandles / candleCapacity) * 100, 100) : 0;

  const bookDeltas = RETENTION_POLICIES.ORDER_BOOK.DELTAS;
  const bookKeys = Object.keys(books).length;
  const bookUtilization = bookKeys > 0 ? Math.min((bookKeys / 100) * 100, 100) : 0;

  const debugCapacity = RETENTION_POLICIES.DEBUG_LOG;
  const debugUtilization = Math.min((debugLog.length / debugCapacity) * 100, 100);

  // Estimate memory (rough approximation based on event count)
  const estimatedMemoryKB = Math.round(
    (trades.length * 0.12) +  // ~120 bytes per trade
    (totalCandles * 0.08) +   // ~80 bytes per candle
    (bookKeys * 0.5) +        // ~500 bytes per book snapshot
    (debugLog.length * 0.1)   // ~100 bytes per debug entry
  );

  const streams = [
    {
      name: 'Trades Ring Buffer',
      icon: <Database size={14} />,
      current: trades.length,
      capacity: tradeCapacity,
      utilization: tradeUtilization,
      policy: 'Last 500 events (FIFO eviction)',
    },
    {
      name: 'Candles Ring Buffer',
      icon: <HardDrive size={14} />,
      current: totalCandles,
      capacity: candleCapacity,
      utilization: candleUtilization,
      policy: '500 per 1m, 200 per 1h+ (per symbol-interval)',
    },
    {
      name: 'Order Book Deltas',
      icon: <MemoryStick size={14} />,
      current: bookKeys,
      capacity: 100,
      utilization: bookUtilization,
      policy: 'Current snapshot + last 100 deltas per symbol',
    },
    {
      name: 'Heatmap Snapshot',
      icon: <Database size={14} />,
      current: heatmap ? 1 : 0,
      capacity: 1,
      utilization: heatmap ? 100 : 0,
      policy: 'Latest snapshot only (always replaced)',
    },
    {
      name: 'Debug Event Log',
      icon: <Trash2 size={14} />,
      current: debugLog.length,
      capacity: debugCapacity,
      utilization: debugUtilization,
      policy: 'Last 1,000 events (ring buffer)',
    },
  ];

  return (
    <div className="h-full overflow-auto p-4 bg-[var(--color-bg-base)]">
      <div className="mb-4">
        <h1 className="text-lg font-bold text-[var(--color-text-primary)]">Storage & Retention</h1>
        <p className="text-[10px] text-[var(--color-text-tertiary)] font-mono">Bounded memory buffers and data retention policies</p>
      </div>

      {/* Memory Overview */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <Card variant="outline" className="border-[var(--color-border)]">
          <div className="p-3">
            <div className="text-[9px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)]">Est. Memory</div>
            <div className="text-2xl font-bold font-mono mt-1 text-[var(--color-accent)]">
              {estimatedMemoryKB > 1024 ? `${(estimatedMemoryKB / 1024).toFixed(1)} MB` : `${estimatedMemoryKB} KB`}
            </div>
          </div>
        </Card>
        <Card variant="outline" className="border-[var(--color-border)]">
          <div className="p-3">
            <div className="text-[9px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)]">Active Streams</div>
            <div className="text-2xl font-bold font-mono mt-1 text-[var(--color-text-primary)]">{streams.length}</div>
          </div>
        </Card>
        <Card variant="outline" className="border-[var(--color-border)]">
          <div className="p-3">
            <div className="text-[9px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)]">Total Events</div>
            <div className="text-2xl font-bold font-mono mt-1 text-[var(--color-text-primary)]">
              {(trades.length + totalCandles + debugLog.length).toLocaleString()}
            </div>
          </div>
        </Card>
      </div>

      {/* Buffer Utilization */}
      <Card variant="outline" header="Buffer Utilization" className="border-[var(--color-border)] mb-4">
        <div className="flex flex-col gap-3 p-3">
          {streams.map((stream) => (
            <div key={stream.name} className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-[10px] font-mono">
                <div className="flex items-center gap-2 text-[var(--color-text-secondary)]">
                  {stream.icon}
                  <span className="font-bold uppercase">{stream.name}</span>
                </div>
                <span className="text-[var(--color-text-tertiary)]">
                  {stream.current.toLocaleString()} / {stream.capacity.toLocaleString()}
                </span>
              </div>
              <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-300',
                    stream.utilization > 90 ? 'bg-[var(--color-loss)]' :
                    stream.utilization > 70 ? 'bg-[var(--color-warning)]' :
                    'bg-[var(--color-accent)]'
                  )}
                  style={{ width: `${stream.utilization}%` }}
                />
              </div>
              <div className="text-[8px] text-[var(--color-text-tertiary)] font-mono">
                Policy: {stream.policy}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Retention Policies Reference */}
      <Card variant="outline" header="Retention Policies Reference" className="border-[var(--color-border)]">
        <div className="overflow-x-auto">
          <table className="w-full text-[10px] font-mono">
            <thead>
              <tr className="border-b border-[var(--color-border-subtle)]">
                <th className="text-left py-2 px-3 text-[var(--color-text-tertiary)] font-bold uppercase">Stream</th>
                <th className="text-left py-2 px-3 text-[var(--color-text-tertiary)] font-bold uppercase">Retention</th>
                <th className="text-left py-2 px-3 text-[var(--color-text-tertiary)] font-bold uppercase">Eviction</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-[var(--color-border-subtle)]">
                <td className="py-1.5 px-3 text-[var(--color-text-secondary)]">Trades</td>
                <td className="py-1.5 px-3 text-[var(--color-text-secondary)]">Last 500 events</td>
                <td className="py-1.5 px-3 text-[var(--color-text-tertiary)]">FIFO (ring buffer)</td>
              </tr>
              <tr className="border-b border-[var(--color-border-subtle)]">
                <td className="py-1.5 px-3 text-[var(--color-text-secondary)]">Candles (1m)</td>
                <td className="py-1.5 px-3 text-[var(--color-text-secondary)]">Last 500 per symbol</td>
                <td className="py-1.5 px-3 text-[var(--color-text-tertiary)]">FIFO (ring buffer)</td>
              </tr>
              <tr className="border-b border-[var(--color-border-subtle)]">
                <td className="py-1.5 px-3 text-[var(--color-text-secondary)]">Candles (1h+)</td>
                <td className="py-1.5 px-3 text-[var(--color-text-secondary)]">Last 200 per symbol</td>
                <td className="py-1.5 px-3 text-[var(--color-text-tertiary)]">FIFO (ring buffer)</td>
              </tr>
              <tr className="border-b border-[var(--color-border-subtle)]">
                <td className="py-1.5 px-3 text-[var(--color-text-secondary)]">Order Book</td>
                <td className="py-1.5 px-3 text-[var(--color-text-secondary)]">Snapshot + 100 deltas</td>
                <td className="py-1.5 px-3 text-[var(--color-text-tertiary)]">FIFO (ring buffer)</td>
              </tr>
              <tr className="border-b border-[var(--color-border-subtle)]">
                <td className="py-1.5 px-3 text-[var(--color-text-secondary)]">Heatmap</td>
                <td className="py-1.5 px-3 text-[var(--color-text-secondary)]">Latest snapshot only</td>
                <td className="py-1.5 px-3 text-[var(--color-text-tertiary)]">Replace on update</td>
              </tr>
              <tr>
                <td className="py-1.5 px-3 text-[var(--color-text-secondary)]">Debug Log</td>
                <td className="py-1.5 px-3 text-[var(--color-text-secondary)]">Last 1,000 events</td>
                <td className="py-1.5 px-3 text-[var(--color-text-tertiary)]">FIFO (ring buffer)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
