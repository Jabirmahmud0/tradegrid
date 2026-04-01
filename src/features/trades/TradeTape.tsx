import React, { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useLiveStore } from '../../store/live-store';
import { cn } from '../../utils';

interface TradeTapeProps {
  symbol: string;
  className?: string;
}

export const TradeTape: React.FC<TradeTapeProps> = ({ symbol, className }) => {
  const parentRef = useRef<HTMLDivElement>(null);

  // Selector: get trades for this symbol (filtered)
  const allTrades = useLiveStore(state => state.trades);
  const trades = allTrades.filter(t => t.sym === symbol);

  const virtualizer = useVirtualizer({
    count: trades.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 22, // compact row height
    overscan: 10,
  });

  return (
    <div className={cn("flex flex-col h-full bg-zinc-950 font-mono text-[11px]", className)}>
      {/* Header */}
      <div className="grid grid-cols-3 px-2 py-1 border-b border-zinc-900 text-zinc-500 font-bold uppercase tracking-widest text-[9px]">
        <div>Price</div>
        <div className="text-right">Qty</div>
        <div className="text-right">Time</div>
      </div>

      {/* List */}
      <div 
        ref={parentRef} 
        className="flex-1 overflow-auto scrollbar-hide"
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const trade = trades[virtualRow.index];
            if (!trade) return null;

            const isSell = trade.side === 's';
            const priceColor = isSell ? 'text-red-400' : 'text-emerald-400';

            return (
              <div
                key={trade.id}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
                className={cn(
                    "grid grid-cols-3 px-2 items-center hover:bg-zinc-900 transition-colors cursor-default",
                    virtualRow.index % 2 === 0 ? "bg-zinc-900/10" : ""
                )}
              >
                <div className={cn("font-bold", priceColor)}>
                  {trade.px.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-right text-zinc-400">
                  {trade.qty.toFixed(4)}
                </div>
                <div className="text-right text-zinc-500 tabular-nums">
                  {trade.formattedTime}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
