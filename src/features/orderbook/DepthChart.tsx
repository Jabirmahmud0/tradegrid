import React, { useState, useRef, useEffect } from 'react';
import { useLiveStore } from '../../store/live-store';
import { DepthCanvas } from './DepthCanvas';
import { DepthOverlay } from './DepthOverlay';
import { useDepthScales } from './use-depth-scales';
import { OrderBookLevel } from '../../store/live-store/orderbook.slice';
import { DataTableFallback } from '../../components/common/DataTableFallback';

interface DepthChartProps {
  className?: string;
  symbol: string;
}

export const DepthChart: React.FC<DepthChartProps> = ({ className, symbol }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [activeLevel, setActiveLevel] = useState<OrderBookLevel | null>(null);

  // Selector for orderbook
  const orderbook = useLiveStore(state => state.books[symbol]);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const bids = orderbook?.bids || [];
  const asks = orderbook?.asks || [];

  const scales = useDepthScales(bids, asks, dimensions.width, dimensions.height);

  return (
    <div 
        ref={containerRef} 
        className={`w-full h-full relative bg-zinc-950 overflow-hidden focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none ${className}`}
        style={{ backgroundColor: 'var(--color-bg-base)' }}
        tabIndex={0}
        role="img"
        aria-label={`Market Depth profile for ${symbol}`}
    >
      {/* Hidden Data for Screen Readers */}
      <div className="sr-only">
          <table>
              <caption>{symbol} Liquidity Depth Data</caption>
              <thead>
                  <tr>
                      <th>Price</th>
                      <th>Total Volume</th>
                      <th>Type</th>
                  </tr>
              </thead>
              <tbody>
                  {bids.slice(0, 5).map((b: OrderBookLevel) => (
                      <tr key={b.price}>
                          <td>{b.price}</td>
                          <td>{b.total}</td>
                          <td>Bid</td>
                      </tr>
                  ))}
                  {asks.slice(0, 5).map((a: OrderBookLevel) => (
                      <tr key={a.price}>
                          <td>{a.price}</td>
                          <td>{a.total}</td>
                          <td>Ask</td>
                      </tr>
                  ))}
              </tbody>
          </table>
      </div>
      {!orderbook && (
        <div className="absolute inset-0 flex items-center justify-center text-zinc-500 font-mono text-xs uppercase tracking-widest">
            Fetching Liquidity Profile...
        </div>
      )}

      {orderbook && (
        <>
          <DepthCanvas 
            bids={bids}
            asks={asks}
            scales={scales}
          />
          <DepthOverlay 
            bids={bids}
            asks={asks}
            scales={scales}
            activeLevel={activeLevel}
            onMouseMove={setActiveLevel}
          />
        </>
      )}

      {/* Data Table Fallback (keyboard accessible) */}
      {orderbook && (bids.length > 0 || asks.length > 0) && (
        <DataTableFallback
          title={`${symbol} Depth`}
          headers={['Price', 'Total Volume', 'Type']}
          rows={[
            ...bids.slice(0, 20).map(b => [b.price, b.total, 'Bid']),
            ...asks.slice(0, 20).map(a => [a.price, a.total, 'Ask']),
          ]}
        />
      )}

      {/* Symbol Overlay */}
      <div className="absolute bottom-4 left-4 pointer-events-none">
        <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest bg-zinc-900/50 px-2 py-0.5 rounded border border-zinc-800">
            {symbol} / DEPTH
        </span>
      </div>
    </div>
  );
};
