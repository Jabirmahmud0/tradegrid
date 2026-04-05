import React, { useMemo, useRef, useEffect, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useLiveStore } from '../../store/live-store';
import { cn } from '../../utils';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

interface OrderBookProps {
  symbol: string;
  className?: string;
}

const LevelRow: React.FC<{
    price: number;
    size: number;
    total: number;
    maxTotal: number;
    type: 'bid' | 'ask';
    virtualRow: any;
    prevSizes: React.MutableRefObject<Map<number, number>>;
}> = ({ price, size, total, maxTotal, type, virtualRow, prevSizes }) => {
    const isBid = type === 'bid';
    const percentage = (total / maxTotal) * 100;

    // Delta Highlighting — use a global map keyed by price instead of per-row ref
    // because virtualized rows are recreated, losing ref state.
    const prevSize = prevSizes.current.get(price);
    const [flash, setFlash] = useState(false);

    useEffect(() => {
        if (prevSize !== undefined && size !== prevSize) {
            setFlash(true);
            const timer = setTimeout(() => setFlash(false), 500);
            prevSizes.current.set(price, size);
            return () => clearTimeout(timer);
        } else if (prevSize === undefined) {
            // First render — just record the size without flashing
            prevSizes.current.set(price, size);
        }
    }, [size, price, prevSize, prevSizes]);

    return (
        <div 
            ref={virtualRow.measureElement}
            className={cn(
                "absolute top-0 left-0 w-full grid grid-cols-3 px-3 py-[1px] cursor-default text-[10px] font-mono shrink-0 transition-colors",
                flash && (isBid ? "bg-[var(--color-profit)]/20" : "bg-[var(--color-loss)]/20"),
                !flash && "hover:bg-[var(--color-bg-surface)]"
            )}
            style={{ 
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`
            }}
        >
            {/* Depth Bar */}
            <div 
                className={cn(
                    "absolute top-0 right-0 h-full opacity-10 transition-all duration-300 pointer-events-none",
                    isBid ? "bg-[var(--color-profit)]" : "bg-[var(--color-loss)]"
                )}
                style={{ width: `${percentage}%` }}
            />
            
            <div className={cn("font-bold z-10", isBid ? "text-[var(--color-profit)]" : "text-[var(--color-loss)]")}>
                {price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-right text-[var(--color-text-primary)] z-10 tabular-nums">
                {size.toFixed(4)}
            </div>
            <div className="text-right text-[var(--color-text-secondary)] z-10 tabular-nums">
                {total.toFixed(2)}
            </div>
        </div>
    );
};

export const OrderBook: React.FC<OrderBookProps> = ({ symbol, className }) => {
  const rawBook = useLiveStore(state => state.books[symbol]);
  const lastTradePrice = useLiveStore(state => state.trades[0]?.px ?? null);

  // Depth limiting: show top 50 levels max (L3)
  const MAX_LEVELS = 50;
  const book = rawBook ? {
    ...rawBook,
    bids: rawBook.bids.slice(0, MAX_LEVELS),
    asks: rawBook.asks.slice(0, MAX_LEVELS),
  } : null;

  const askParentRef = useRef<HTMLDivElement>(null);
  const bidParentRef = useRef<HTMLDivElement>(null);

  // Shared prevSizes map for flash effect persistence across virtualized row recreation
  const prevSizes = useRef<Map<number, number>>(new Map());

  const maxTotal = useMemo(() => {
    if (!book) return 0;
    const maxBid = book.bids.length > 0 ? book.bids[book.bids.length - 1].total : 0;
    const maxAsk = book.asks.length > 0 ? book.asks[book.asks.length - 1].total : 0;
    return Math.max(maxBid, maxAsk);
  }, [book]);

  const askVirtualizer = useVirtualizer({
    count: book?.asks.length || 0,
    getScrollElement: () => askParentRef.current,
    estimateSize: () => 18,
    overscan: 10,
  });

  const bidVirtualizer = useVirtualizer({
    count: book?.bids.length || 0,
    getScrollElement: () => bidParentRef.current,
    estimateSize: () => 18,
    overscan: 10,
  });

  if (!book) {
    return (
        <div className={cn("flex flex-col items-center justify-center h-full bg-[var(--color-bg-base)]", className)}>
            <LoadingSpinner label="Calibrating Order Flow" size={32} />
        </div>
    );
  }

  const bestBid = book.bids[0]?.price || 0;
  const bestAsk = book.asks[0]?.price || 0;
  const spread = bestAsk - bestBid;
  const spreadPercent = spread > 0 ? (spread / bestAsk) * 100 : 0;

  return (
    <div className={cn("flex flex-col h-full bg-[var(--color-bg-base)] font-mono text-[10px]", className)}>
      {/* Header */}
      <div className="grid grid-cols-3 px-3 py-1.5 border-b border-[var(--color-border)] bg-[var(--color-bg-surface)] text-[9px] font-bold text-[var(--color-text-secondary)] uppercase tracking-widest z-10">
        <div>Price</div>
        <div className="text-right">Size</div>
        <div className="text-right">Total</div>
      </div>

      {/* Asks (Sell Side) - Reverse Column to show mid at bottom */}
      <div 
        ref={askParentRef}
        className="flex-1 overflow-y-auto scrollbar-hide flex flex-col-reverse"
      >
        <div
          style={{
            height: `${askVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {askVirtualizer.getVirtualItems().map((vRow) => (
            <LevelRow
                key={book.asks[vRow.index].price}
                {...book.asks[vRow.index]}
                maxTotal={maxTotal}
                type="ask"
                virtualRow={vRow}
                prevSizes={prevSizes}
            />
          ))}
        </div>
      </div>

      {/* Ticker / Mid Price */}
      <div className="flex items-center justify-between px-3 py-2 bg-[var(--color-bg-surface)] border-y border-[var(--color-border)] my-[1px] relative shadow-lg">
        <div className="flex flex-col">
            <span className={cn(
                "text-base lg:text-lg font-bold leading-none",
                book.asks[0]?.price > (lastTradePrice ?? 0) ? "text-[var(--color-profit)]" : "text-[var(--color-loss)]"
            )}>
                {bestAsk > 0 ? ((bestAsk + bestBid) / 2).toLocaleString(undefined, { minimumFractionDigits: 2 }) : "---"}
            </span>
            <div className="flex items-center gap-2 mt-1">
                <span className="text-[9px] text-[var(--color-text-secondary)] font-bold uppercase">SPREAD</span>
                <span className="text-[9px] text-[var(--color-text-tertiary)] tabular-nums">{spread.toFixed(2)} ({spreadPercent.toFixed(3)}%)</span>
            </div>
        </div>
      </div>

      {/* Bids (Buy Side) */}
      <div 
        ref={bidParentRef}
        className="flex-1 overflow-y-auto scrollbar-hide"
      >
        <div
          style={{
            height: `${bidVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {bidVirtualizer.getVirtualItems().map((vRow) => (
            <LevelRow
                key={book.bids[vRow.index].price}
                {...book.bids[vRow.index]}
                maxTotal={maxTotal}
                type="bid"
                virtualRow={vRow}
                prevSizes={prevSizes}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
