import React, { useRef, useState, useEffect } from 'react';
import { useLiveStore } from '../../store/live-store';
import { cn } from '../../utils';
import { DepthCanvas } from './DepthCanvas';
import { DepthOverlay } from './DepthOverlay';
import { useDepthScales } from './use-depth-scales';

interface DepthChartProps {
  symbol: string;
  className?: string;
}

export const DepthChart: React.FC<DepthChartProps> = ({ symbol, className }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [crosshair, setCrosshair] = useState<{ x: number, y: number } | null>(null);

  const book = useLiveStore(state => state.books[symbol]);

  // 1. Responsive Observer
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setDimensions({ width, height });
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const scales = useDepthScales(
      book?.bids || [], 
      book?.asks || [], 
      dimensions.width, 
      dimensions.height
  );

  const handleMouseMove = (e: React.MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setCrosshair({ x, y });
  };

  const handleMouseLeave = () => setCrosshair(null);

  return (
    <div 
        ref={containerRef} 
        className={cn("w-full h-full bg-zinc-950 overflow-hidden relative group select-none", className)}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
    >
        {!book && (
             <div className="flex items-center justify-center h-full text-zinc-800 text-xs italic">
                Gathering liquidity map...
             </div>
        )}
        
        {book && (
            <div className="absolute inset-0 cursor-crosshair">
                <DepthCanvas 
                    bids={book.bids} 
                    asks={book.asks} 
                    scales={scales} 
                />
                <DepthOverlay 
                    scales={scales} 
                    crosshair={crosshair} 
                    bestBid={book.bids[0]?.price || 0}
                    bestAsk={book.asks[0]?.price || 0}
                />
                
                {/* 2. Volume Labels In Corners */}
                <div className="absolute top-2 left-2 text-[8px] font-bold text-emerald-500 uppercase tracking-widest pointer-events-none">
                    BUYS (BIDS)
                </div>
                <div className="absolute top-2 right-2 text-[8px] font-bold text-red-500 uppercase tracking-widest pointer-events-none">
                    SELLS (ASKS)
                </div>
                
                {/* 3. Scale Legend */}
                <div className="absolute bottom-1 right-1/2 translate-x-1/2 text-[8px] font-mono text-zinc-700 bg-zinc-950/80 px-2 rounded-full uppercase border border-zinc-900 border-none transition-opacity">
                    Quantity x Price Distribution
                </div>
            </div>
        )}
    </div>
  );
};
