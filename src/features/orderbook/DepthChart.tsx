import React, { useRef, useLayoutEffect } from 'react';
import { useLiveStore } from '../../store/live-store';
import { cn } from '../../utils';

interface DepthChartProps {
  symbol: string;
  className?: string;
}

export const DepthChart: React.FC<DepthChartProps> = ({ symbol, className }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const book = useLiveStore(state => state.books[symbol]);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !book) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 1. High DPI scaling
    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    // 2. Prepare Data
    // Bids (Buy side)
    const bids = book.bids;
    // Asks (Sell side)
    const asks = book.asks;

    if (bids.length === 0 || asks.length === 0) return;

    const minPrice = bids[bids.length - 1].price;
    const maxPrice = asks[asks.length - 1].price;
    const priceRange = maxPrice - minPrice;

    const maxTotal = Math.max(
        bids.length > 0 ? bids[bids.length - 1].total : 0,
        asks.length > 0 ? asks[asks.length - 1].total : 0
    );

    // 3. Coordinate Helpers
    const getX = (price: number) => ((price - minPrice) / priceRange) * width;
    const getY = (total: number) => height - (total / maxTotal) * height;

    // 4. Render
    ctx.clearRect(0, 0, width, height);

    // Grid Line (Mid Price)
    const bestBid = bids[0].price;
    const bestAsk = asks[0].price;
    const midX = getX((bestBid + bestAsk) / 2);
    
    ctx.strokeStyle = '#3f3f46';
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(midX, 0);
    ctx.lineTo(midX, height);
    ctx.stroke();
    ctx.setLineDash([]);

    // Bids Area (Green)
    ctx.fillStyle = 'rgba(34, 197, 94, 0.2)';
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(getX(bestBid), height);
    
    bids.forEach(lvl => {
        ctx.lineTo(getX(lvl.price), getY(lvl.total));
    });
    
    ctx.lineTo(getX(minPrice), height);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Asks Area (Red)
    ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
    ctx.strokeStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(getX(bestAsk), height);
    
    asks.forEach(lvl => {
        ctx.lineTo(getX(lvl.price), getY(lvl.total));
    });
    
    ctx.lineTo(getX(maxPrice), height);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

  }, [book, symbol]);

  return (
    <div ref={containerRef} className={cn("w-full h-full bg-zinc-950/50 overflow-hidden", className)}>
        {!book && (
             <div className="flex items-center justify-center h-full text-zinc-800 text-xs italic">
                Gathering liquidity map...
             </div>
        )}
        <canvas 
            ref={canvasRef} 
            style={{ width: '100%', height: '100%', display: 'block' }}
        />
    </div>
  );
};
