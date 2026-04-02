import React, { useRef, useState, useMemo, useEffect } from 'react';
import { NormalizedCandle } from '../../../types';
import { cn } from '../../../utils';
import { CandlestickCanvas } from './CandlestickCanvas';
import { CandlestickOverlay } from './CandlestickOverlay';
import { useCandlestickScales, Box } from './use-candlestick-scales';
import { ChartAriaOverlay } from './ChartAriaOverlay';

interface CandlestickChartProps {
  candles: NormalizedCandle[];
  className?: string;
}

export const CandlestickChart: React.FC<CandlestickChartProps> = ({ candles, className }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // 1. Chart Configuration & Scale State
  const [visibleCount, setVisibleCount] = useState(100);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [crosshair, setCrosshair] = useState<{ x: number; y: number } | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [selectedInterval, setSelectedInterval] = useState('1m');

  const MARGIN = { top: 30, right: 70, bottom: 20, left: 10 };

  // 2. Responsive observer
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setDimensions({ width, height });
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // 3. Slice and Scale data
  const visibleCandles = useMemo(() => {
    if (candles.length === 0) return [];
    // Always show the latest data by default (offset 0)
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
    const newCount = Math.min(500, Math.max(20, visibleCount + delta * adjust));
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
    setCrosshair({ x: y > MARGIN.top + scales.chartHeight + 5 ? -100 : x, y });

    if (isPanning) {
        const candlesMove = (e.movementX / (scales.candleWidth + 2));
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
    <div className={cn("relative w-full h-full select-none bg-[#09090b] overflow-hidden", className)}>
      {/* 5. Toolbars / Overlays */}
      <div className="absolute top-3 left-3 flex gap-1 z-20">
        {['1m', '5m', '15m', '1h', '1D'].map((interval) => (
            <button 
                key={interval}
                onClick={() => setSelectedInterval(interval)}
                className={cn(
                    "px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-tighter transition-colors",
                    selectedInterval === interval ? "bg-zinc-800 text-zinc-100" : "text-zinc-500 hover:bg-zinc-900"
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
        />
      </div>

      {/* 6. Accessibility Overlay */}
      <ChartAriaOverlay 
          candles={visibleCandles} 
          symbol="CURRENT" 
          interval={selectedInterval} 
      />

      {/* 7. Interaction Hints */}
      <div className="absolute bottom-3 left-3 text-[9px] font-mono text-zinc-700 pointer-events-none uppercase">
          Wheel: Zoom • Drag: Pan • {visibleCount} Bars
      </div>
    </div>
  );
};
