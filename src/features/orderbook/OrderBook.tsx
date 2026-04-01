import React, { useMemo } from 'react';
import { useLiveStore } from '../../store/live-store';
import { cn } from '../../utils';

interface OrderBookProps {
  symbol: string;
  className?: string;
}

const LevelRow: React.FC<{ 
    price: number; 
    size: number; 
    total: number; 
    maxTotal: number; 
    type: 'bid' | 'ask' 
}> = ({ price, size, total, maxTotal, type }) => {
    const isBid = type === 'bid';
    const percentage = (total / maxTotal) * 100;

    return (
        <div className="relative grid grid-cols-3 px-2 py-[2px] cursor-default hover:bg-zinc-900/50 group text-[11px] font-mono shrink-0">
            {/* Depth Bar */}
            <div 
                className={cn(
                    "absolute top-0 right-0 h-full opacity-10 transition-all duration-300 pointer-events-none",
                    isBid ? "bg-emerald-500" : "bg-red-500"
                )}
                style={{ width: `${percentage}%` }}
            />
            
            <div className={cn("font-bold", isBid ? "text-emerald-400" : "text-red-400")}>
                {price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-right text-zinc-300 z-10">
                {size.toFixed(4)}
            </div>
            <div className="text-right text-zinc-500 z-10 tabular-nums">
                {total.toFixed(2)}
            </div>
        </div>
    );
};

export const OrderBook: React.FC<OrderBookProps> = ({ symbol, className }) => {
  const book = useLiveStore(state => state.books[symbol]);

  const maxTotal = useMemo(() => {
    if (!book) return 0;
    const maxBid = book.bids.length > 0 ? book.bids[book.bids.length - 1].total : 0;
    const maxAsk = book.asks.length > 0 ? book.asks[book.asks.length - 1].total : 0;
    return Math.max(maxBid, maxAsk);
  }, [book]);

  if (!book) {
    return (
        <div className={cn("flex items-center justify-center h-full text-zinc-800 text-xs italic", className)}>
            Waiting for data...
        </div>
    );
  }

  const bestBid = book.bids[0]?.price || 0;
  const bestAsk = book.asks[0]?.price || 0;
  const spread = bestAsk - bestBid;
  const spreadPercent = spread > 0 ? (spread / bestAsk) * 100 : 0;

  return (
    <div className={cn("flex flex-col h-full bg-zinc-950/50 border border-zinc-900 rounded-sm overflow-hidden", className)}>
      {/* Header */}
      <div className="grid grid-cols-3 px-2 py-1 bg-zinc-900/50 border-b border-zinc-800 text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
        <div>Price</div>
        <div className="text-right">Size</div>
        <div className="text-right">Total</div>
      </div>

      {/* Asks (Red) */}
      <div className="flex flex-col-reverse flex-1 overflow-hidden min-h-0">
        {book.asks.slice(0, 15).map((lvl) => (
            <LevelRow key={lvl.price} {...lvl} maxTotal={maxTotal} type="ask" />
        ))}
      </div>

      {/* Mid Price / Spread */}
      <div className="flex items-center justify-between px-3 py-2 bg-zinc-900/80 border-y border-zinc-800 my-[1px] shadow-sm">
        <div className="flex flex-col">
            <span className="text-lg font-bold text-zinc-100 leading-none">
                {bestAsk > 0 ? ((bestAsk + bestBid) / 2).toLocaleString(undefined, { minimumFractionDigits: 2 }) : "---"}
            </span>
            <span className="text-[10px] text-zinc-500 font-mono mt-1">
                Spread: {spread.toFixed(2)} ({spreadPercent.toFixed(3)}%)
            </span>
        </div>
      </div>

      {/* Bids (Green) */}
      <div className="flex flex-col flex-1 overflow-hidden min-h-0">
        {book.bids.slice(0, 15).map((lvl) => (
            <LevelRow key={lvl.price} {...lvl} maxTotal={maxTotal} type="bid" />
        ))}
      </div>
    </div>
  );
};
