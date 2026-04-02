import React, { useRef, useState, useEffect, useMemo } from 'react';
import { 
  createColumnHelper, 
  flexRender, 
  getCoreRowModel, 
  useReactTable 
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useLiveStore } from '../../store/live-store';
import { NormalizedTrade } from '../../types';
import { cn } from '../../utils';
import { Lock, Zap } from 'lucide-react';
import { EmptyState } from '../../components/common/EmptyState';

interface TradeTapeProps {
  symbol: string;
  className?: string;
}

const columnHelper = createColumnHelper<NormalizedTrade>();

export const TradeTape: React.FC<TradeTapeProps> = ({ symbol, className }) => {
  const parentRef = useRef<HTMLDivElement>(null);
  const [scrollLock, setScrollLock] = useState(false);
  const lastUpdateId = useRef<string | null>(null);

  // 1. Selector: get trades for this symbol
  const allTrades = useLiveStore(state => state.trades);
  const trades = useMemo(() => allTrades.filter(t => t.sym === symbol), [allTrades, symbol]);

  // 2. TanStack Table Definition
  const columns = useMemo(() => [
    columnHelper.accessor('px', {
      header: 'Price',
      cell: info => (
        <span className={cn(
          "font-bold tabular-nums",
          info.row.original.side === 's' ? "text-[var(--color-loss)]" : "text-[var(--color-profit)]"
        )}>
          {info.getValue().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      ),
    }),
    columnHelper.accessor('qty', {
      header: 'Qty',
      cell: info => <span className="text-[var(--color-text-secondary)] text-right">{info.getValue().toFixed(4)}</span>,
    }),
    columnHelper.accessor('formattedTime', {
      header: 'Time',
      cell: info => <span className="text-[var(--color-text-tertiary)] text-right tabular-nums">{info.getValue()}</span>,
    }),
  ], []);

  const table = useReactTable({
    data: trades,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const { rows } = table.getRowModel();

  // 3. Virtualization
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 20,
    overscan: 20,
  });

  // 4. Auto-Scroll Logic
  useEffect(() => {
    const latestId = trades[0]?.id;
    if (latestId && latestId !== lastUpdateId.current) {
        lastUpdateId.current = latestId;
        if (!scrollLock) {
            virtualizer.scrollToIndex(0, { align: 'start' });
        }
    }
  }, [trades, scrollLock, virtualizer]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop } = e.currentTarget;
    if (scrollTop > 50 && !scrollLock) {
        setScrollLock(true);
    } else if (scrollTop <= 10 && scrollLock) {
        setScrollLock(false);
    }
  };

  return (
    <div className={cn("flex flex-col h-full bg-[var(--color-bg-base)] font-mono text-[10px] relative transition-opacity", className)}>
      {/* Header Overlay */}
      <div className="grid grid-cols-3 px-3 py-1.5 border-b border-[var(--color-border)] bg-[var(--color-bg-base)] backdrop-blur z-10 text-[9px] uppercase tracking-widest text-[var(--color-text-secondary)] font-bold">
        {table.getHeaderGroups()[0].headers.map(header => (
          <div key={header.id} className={cn(header.index > 0 && "text-right")}>
            {flexRender(header.column.columnDef.header, header.getContext())}
          </div>
        ))}
      </div>

      {/* List Container / Empty State */}
      <div 
        ref={parentRef} 
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto scrollbar-hide relative text-[var(--color-text-primary)]"
      >
        {trades.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center p-6">
            <EmptyState message="No trades" className="scale-75" />
          </div>
        ) : (
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              position: 'relative',
            }}
          >
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const row = rows[virtualRow.index];
              const trade = row.original;
              const isFresh = virtualRow.index === 0;

              return (
                <div
                  key={trade.id}
                  data-index={virtualRow.index}
                  ref={virtualizer.measureElement}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                  className={cn(
                      "grid grid-cols-3 px-3 py-0.5 items-center hover:bg-[var(--color-bg-surface)] transition-colors cursor-default border-l-2 border-transparent",
                      isFresh && !scrollLock && (trade.side === 's' ? "animate-pulse" : "animate-pulse"),
                      trade.side === 's' ? "hover:border-[var(--color-loss)]/30" : "hover:border-[var(--color-profit)]/30"
                  )}
                >
                  {row.getVisibleCells().map(cell => (
                    <div key={cell.id} className={cn(cell.column.id !== 'px' && "text-right")}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Status Indicator */}
      {scrollLock && (
        <button 
           onClick={() => {
              setScrollLock(false);
              virtualizer.scrollToIndex(0);
           }}
           className="absolute bottom-4 right-4 bg-[var(--color-profit)]/10 hover:bg-[var(--color-profit)]/20 text-[var(--color-profit)] border border-[var(--color-profit)]/30 px-2 py-1 rounded flex items-center gap-1.5 backdrop-blur-sm transition-all animate-in fade-in slide-in-from-bottom-2"
        >
            <Lock size={10} />
            <span className="text-[9px] font-bold uppercase tracking-wider">Scrolled Up</span>
            <Zap size={10} className="fill-current animate-pulse" />
        </button>
      )}
    </div>
  );
};
