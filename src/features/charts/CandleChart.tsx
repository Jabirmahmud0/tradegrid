import React, { useRef, useLayoutEffect, useMemo } from 'react';
import { NormalizedCandle } from '../../types';

interface CandleChartProps {
  candles: NormalizedCandle[];
  symbol: string;
  className?: string;
}

export const CandleChart: React.FC<CandleChartProps> = ({ candles, symbol, className }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Constants
  const MARGIN = { top: 20, right: 60, bottom: 30, left: 10 };
  const CANDLE_GAP = 2;
  const VOLUME_HEIGHT_RATIO = 0.2;

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || candles.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high-dpi displays
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

    // We only visible candles that fit in the width
    const candleWidth = Math.max(5, (width / candles.length) - CANDLE_GAP);
    const visibleCandles = candles; // For now show all in the ring buffer

    visibleCandles.forEach(c => {
      if (c.h > maxPrice) maxPrice = c.h;
      if (c.l < minPrice) minPrice = c.l;
      if (c.v > maxVolume) maxVolume = c.v;
    });

    // Add padding to price scale (10%)
    const pricePadding = (maxPrice - minPrice) * 0.1;
    maxPrice += pricePadding;
    minPrice -= pricePadding;

    const priceRange = maxPrice - minPrice;

    // Coordinate helpers
    const getX = (index: number) => MARGIN.left + (visibleCandles.length - 1 - index) * (candleWidth + CANDLE_GAP);
    const getY = (price: number) => MARGIN.top + height - ((price - minPrice) / priceRange) * height;

    // 2. Clear
    ctx.clearRect(0, 0, rect.width, rect.height);

    // 3. Draw Grid Lines (Horizontal)
    ctx.strokeStyle = '#1e1e1e';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i <= 5; i++) {
        const y = MARGIN.top + (height / 5) * i;
        ctx.moveTo(MARGIN.left, y);
        ctx.lineTo(MARGIN.left + width, y);
        
        // Price label
        ctx.fillStyle = '#52525b';
        ctx.font = '10px tabular-nums font-mono';
        const price = maxPrice - (priceRange / 5) * i;
        ctx.fillText(price.toFixed(2), MARGIN.left + width + 5, y + 3);
    }
    ctx.stroke();

    // 4. Draw Candles & Volume
    visibleCandles.forEach((c, i) => {
        const x = getX(i);
        const candleColor = c.isUp ? '#22c55e' : '#ef4444';
        
        // Volume Bar
        const vH = (c.v / maxVolume) * height * VOLUME_HEIGHT_RATIO;
        ctx.fillStyle = c.isUp ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)';
        ctx.fillRect(x, MARGIN.top + height - vH, candleWidth, vH);

        // Wick
        ctx.strokeStyle = candleColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + candleWidth/2, getY(c.h));
        ctx.lineTo(x + candleWidth/2, getY(c.l));
        ctx.stroke();

        // Body
        ctx.fillStyle = candleColor;
        const openY = getY(c.o);
        const closeY = getY(c.c);
        const bodyHeight = Math.max(1, Math.abs(openY - closeY));
        ctx.fillRect(x, Math.min(openY, closeY), candleWidth, bodyHeight);
    });

  }, [candles, MARGIN.top, MARGIN.bottom, MARGIN.left, MARGIN.right]);

  return (
    <div ref={containerRef} className={`relative w-full h-full overflow-hidden ${className}`}>
      <canvas 
        ref={canvasRef} 
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
    </div>
  );
};
