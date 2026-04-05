import React, { useRef, useState, useMemo, useEffect } from 'react';
import { NormalizedCandle } from '../../../types';
import { cn } from '../../../utils';
import { CandlestickCanvas } from './CandlestickCanvas';
import { CandlestickOverlay } from './CandlestickOverlay';
import { useCandlestickScales, Box } from './use-candlestick-scales';
import { ChartAriaOverlay } from './ChartAriaOverlay';
import { DataTableFallback } from '../../../components/common/DataTableFallback';
import { useLiveStore } from '../../../store/live-store';
import { EmptyState } from '../../../components/common/EmptyState';

interface CandlestickChartProps {
  candles: NormalizedCandle[];
  className?: string;
}

export const CandlestickChart: React.FC<CandlestickChartProps> = ({ candles, className }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // 1. Chart Configuration & Scale State
  const [visibleCount, setVisibleCount] = useState(80);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [crosshair, setCrosshair] = useState<{ x: number; y: number } | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const activeInterval = useLiveStore(state => state.activeInterval);
  const setActiveInterval = useLiveStore(state => state.setActiveInterval);

  const MARGIN = { top: 30, right: 70, bottom: 30, left: 0 };

  // 2. Responsive observer
  useEffect(() => {
    if (!containerRef.current) return;
    
    const updateDimensions = () => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect && rect.width > 0 && rect.height > 0) {
        setDimensions({ width: rect.width, height: rect.height });
      }
    };

    updateDimensions();
    const observer = new ResizeObserver(updateDimensions);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // 3. Slice and Scale data
  const visibleCandles = useMemo(() => {
    if (candles.length === 0) return [];
    const end = Math.max(0, candles.length - scrollOffset);
    const start = Math.max(0, end - visibleCount);
    return candles.slice(start, end);
  }, [candles, visibleCount, scrollOffset]);

  const box = useMemo((): Box => ({
    width: dimensions.width,
    height: dimensions.height,
    margin: MARGIN
  }), [dimensions]);

  const scales = useCandlestickScales(visibleCandles, box);

  const latestPrice = candles.length > 0 ? candles[candles.length - 1].c : null;

  // 4. Interaction Handlers
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomSpeed = 0.1;
    const delta = e.deltaY > 0 ? 1 : -1;
    const adjust = Math.round(visibleCount * zoomSpeed);
    const newCount = Math.min(Math.min(500, candles.length), Math.max(20, visibleCount + delta * adjust));
    setVisibleCount(newCount);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
      if (e.button === 0) setIsPanning(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setCrosshair({ 
        x: x > MARGIN.left + scales.chartWidth + 5 ? -100 : x, 
        y: y > MARGIN.top + scales.chartHeight + 5 ? -100 : y 
    });

    if (isPanning) {
        const panSpeed = 0.8;
        const candlesMove = (e.movementX / (scales.candleWidth + 2)) * panSpeed;
        const newOffset = Math.max(0, Math.min(candles.length - visibleCount, scrollOffset + candlesMove));
        setScrollOffset(newOffset);
    }
  };

  const handleMouseUp = () => setIsPanning(false);
  const handleMouseLeave = () => {
    setCrosshair(null);
    setIsPanning(false);
  };

  return (
    <div className={cn("relative w-full h-full select-none bg-[#0b0e11] overflow-hidden", className)}>
      {/* 5. Toolbars / Overlays */}
      <div className="absolute top-2 right-2 flex gap-1 z-20 items-center">
        <div className="flex gap-2 mr-4 text-[10px] font-mono font-bold">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#f0b90b]"></span> MA(7)</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#8739fa]"></span> MA(25)</span>
        </div>
        {['1m', '5m', '15m', '1h', '1D'].map((interval) => (
            <button 
                key={interval}
                onClick={() => setActiveInterval(interval as any)}
                className={cn(
                    "px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-tighter transition-colors",
                    activeInterval === interval ? "bg-zinc-800 text-zinc-100" : "text-zinc-500 hover:bg-zinc-900"
                )}
            >
                {interval}
            </button>
        ))}
      </div>

      <div 
        ref={containerRef}
        className="absolute inset-0 cursor-crosshair"
        onWheel={handleWheel}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        {candles.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center p-12">
              <EmptyState message="Syncing market data..." />
          </div>
        ) : (
          <>
            <CandlestickCanvas 
                candles={visibleCandles} 
                scales={scales} 
                box={box}
            />
            <CandlestickOverlay 
                scales={scales} 
                box={box} 
                crosshair={crosshair}
                latestPrice={latestPrice}
                candles={visibleCandles}
            />
          </>
        )}
      </div>

      {/* 6. Accessibility Overlay */}
      <ChartAriaOverlay
          candles={visibleCandles}
          symbol="CURRENT"
          interval={activeInterval}
      />

      {/* 7. Data Table Fallback (keyboard accessible) */}
      {visibleCandles.length > 0 && (
        <DataTableFallback
          title={`${"CURRENT"} OHLCV`}
          headers={['Time', 'Open', 'High', 'Low', 'Close', 'Volume']}
          rows={visibleCandles.slice(-50).map(c => [
            new Date(c.ts).toLocaleString(),
            c.o.toFixed(2),
            c.h.toFixed(2),
            c.l.toFixed(2),
            c.c.toFixed(2),
            c.v.toFixed(2)
          ])}
        />
      )}

      {/* 8. Interaction Hints */}
      <div className="absolute bottom-1 right-2 text-[9px] font-mono text-zinc-600 pointer-events-none uppercase">
          Wheel: Zoom • Drag: Pan • {visibleCount} Bars
      </div>
    </div>
  );
};
