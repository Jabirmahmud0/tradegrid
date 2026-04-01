import React, { useRef, useLayoutEffect, useState, useCallback, useMemo } from 'react';
import { NormalizedCandle } from '../../types';
import { cn } from '../../utils';

interface CandleChartProps {
  candles: NormalizedCandle[];
  className?: string;
}

export const CandleChart: React.FC<CandleChartProps> = ({ candles, className }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Interaction State
  const [visibleCount, setVisibleCount] = useState(100);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [crosshair, setCrosshair] = useState<{ x: number; y: number } | null>(null);
  const [isPanning, setIsPanning] = useState(false);

  // Constants
  const MARGIN = { top: 20, right: 60, bottom: 30, left: 10 };
  const CANDLE_GAP = 2;
  const VOLUME_HEIGHT_RATIO = 0.2;

  // Memoized window of candles to render
  const visibleCandles = useMemo(() => {
    const end = Math.max(0, candles.length - scrollOffset);
    const start = Math.max(0, end - visibleCount);
    return candles.slice(start, end);
  }, [candles, visibleCount, scrollOffset]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomSpeed = 0.1;
    const delta = e.deltaY > 0 ? 1 : -1;
    const newCount = Math.min(500, Math.max(20, visibleCount + delta * Math.round(visibleCount * zoomSpeed)));
    setVisibleCount(newCount);
  };

  const handleMouseDown = () => setIsPanning(true);
  const handleMouseUp = () => setIsPanning(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setCrosshair({ x, y });

    if (isPanning) {
        const panSpeed = 0.5;
        const newOffset = Math.max(0, Math.min(candles.length - visibleCount, scrollOffset + e.movementX * panSpeed));
        setScrollOffset(Math.round(newOffset));
    }
  };

  const handleMouseLeave = () => {
    setCrosshair(null);
    setIsPanning(false);
  };

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || visibleCandles.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width - MARGIN.left - MARGIN.right;
    const height = rect.height - MARGIN.top - MARGIN.bottom;

    // 1. Calculate extremes for scaling
    let minPrice = Infinity;
    let maxPrice = -Infinity;
    let maxVolume = 0;

    visibleCandles.forEach(c => {
      if (c.h > maxPrice) maxPrice = c.h;
      if (c.l < minPrice) minPrice = c.l;
      if (c.v > maxVolume) maxVolume = c.v;
    });

    const pricePadding = (maxPrice - minPrice) * 0.1;
    maxPrice += pricePadding;
    minPrice -= pricePadding;
    const priceRange = maxPrice - minPrice;

    const candleWidth = (width / visibleCandles.length) - CANDLE_GAP;

    const getX = (index: number) => MARGIN.left + index * (candleWidth + CANDLE_GAP);
    const getY = (price: number) => MARGIN.top + height - ((price - minPrice) / priceRange) * height;

    ctx.clearRect(0, 0, rect.width, rect.height);

    // 2. Draw Grid Lines
    ctx.strokeStyle = '#18181b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i <= 6; i++) {
        const y = MARGIN.top + (height / 6) * i;
        ctx.moveTo(MARGIN.left, y);
        ctx.lineTo(MARGIN.left + width, y);
        
        ctx.fillStyle = '#3f3f46';
        ctx.font = '10px tabular-nums font-mono';
        const price = maxPrice - (priceRange / 6) * i;
        ctx.fillText(price.toFixed(2), MARGIN.left + width + 5, y + 3);
    }
    ctx.stroke();

    // 3. Draw Candles
    visibleCandles.forEach((c, i) => {
        const x = getX(i);
        const candleColor = c.isUp ? '#22c55e' : '#ef4444';
        
        // Volume
        const vH = (c.v / maxVolume) * height * VOLUME_HEIGHT_RATIO;
        ctx.fillStyle = c.isUp ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)';
        ctx.fillRect(x, MARGIN.top + height - vH, candleWidth, vH);

        // Wick
        ctx.strokeStyle = candleColor;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x + candleWidth/2, getY(c.h));
        ctx.lineTo(x + candleWidth/2, getY(c.l));
        ctx.stroke();

        // Body
        ctx.fillStyle = candleColor;
        const openY = getY(c.o);
        const closeY = getY(c.c);
        ctx.fillRect(x, Math.min(openY, closeY), candleWidth, Math.max(1, Math.abs(openY - closeY)));
    });

    // 4. Draw Crosshair
    if (crosshair && crosshair.x >= MARGIN.left && crosshair.x <= MARGIN.left + width) {
        ctx.strokeStyle = '#52525b';
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 1;
        
        // Vertical
        ctx.beginPath();
        ctx.moveTo(crosshair.x, MARGIN.top);
        ctx.lineTo(crosshair.x, MARGIN.top + height);
        ctx.stroke();

        // Horizontal
        ctx.beginPath();
        ctx.moveTo(MARGIN.left, crosshair.y);
        ctx.lineTo(MARGIN.left + width, crosshair.y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Price Marker
        const hoveredPrice = maxPrice - ((crosshair.y - MARGIN.top) / height) * priceRange;
        ctx.fillStyle = '#27272a';
        ctx.fillRect(MARGIN.left + width, crosshair.y - 10, MARGIN.right, 20);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(hoveredPrice.toFixed(2), MARGIN.left + width + 5, crosshair.y + 4);
    }

  }, [visibleCandles, crosshair, MARGIN.top, MARGIN.bottom, MARGIN.left, MARGIN.right]);

  return (
    <div 
        ref={containerRef} 
        className={cn("relative w-full h-full overflow-hidden select-none cursor-crosshair", className)}
        onWheel={handleWheel}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
    >
      <canvas 
        ref={canvasRef} 
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
    </div>
  );
};
