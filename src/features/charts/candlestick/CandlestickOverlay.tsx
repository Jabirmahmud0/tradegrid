import React from 'react';
import { CandlestickScales, Box } from './use-candlestick-scales';
import { cn } from '../../../utils';

interface CandlestickOverlayProps {
  scales: CandlestickScales;
  box: Box;
  crosshair: { x: number; y: number } | null;
  latestPrice: number | null;
  candles: any[];
}

export const CandlestickOverlay: React.FC<CandlestickOverlayProps> = ({
  scales,
  box,
  crosshair,
  latestPrice,
  candles
}) => {
  const { margin } = box;
  const { getY, maxPrice, priceRange, chartWidth, chartHeight, getPrice, timeLabels, candleWidth } = scales;

  const currentPriceY = latestPrice ? getY(latestPrice) : null;
  const isInRange = crosshair && crosshair.x >= margin.left && crosshair.x <= margin.left + chartWidth;
  const showCrosshair = crosshair && isInRange;

  // Find hovered candle for OHLC info — use the same spacing as the scales (candleWidth + gap)
  // The full cell width is chartWidth / candles.length (which equals candleWidth + gap)
  const cellWidth = candles.length > 0 ? chartWidth / candles.length : candleWidth + 3;
  const hoveredIndex = showCrosshair && candles.length > 0
    ? Math.max(0, Math.min(candles.length - 1, Math.round((crosshair.x - margin.left) / cellWidth)))
    : -1;
  const candle = candles && candles.length > 0 && hoveredIndex >= 0 && hoveredIndex < candles.length 
    ? candles[hoveredIndex] 
    : candles?.[candles.length - 1];

  const formatPrice = (p: number) => {
    // Round to nice numbers for axis display
    const nice = p >= 10000 ? Math.round(p / 10) * 10 : p >= 1000 ? Math.round(p) : p;
    return nice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* 1. OHLC Info Header (Binance Style) */}
      {candle && (
        <div className="absolute top-2 left-2 flex gap-4 text-[11px] font-mono z-30 pointer-events-none">
          <div className="flex gap-1.5 items-center">
            <span className="text-zinc-500 uppercase">O</span>
            <span className={cn(candle.isUp ? "text-emerald-400" : "text-rose-400")}>{formatPrice(candle.o)}</span>
          </div>
          <div className="flex gap-1.5 items-center">
            <span className="text-zinc-500 uppercase">H</span>
            <span className={cn(candle.isUp ? "text-emerald-400" : "text-rose-400")}>{formatPrice(candle.h)}</span>
          </div>
          <div className="flex gap-1.5 items-center">
            <span className="text-zinc-500 uppercase">L</span>
            <span className={cn(candle.isUp ? "text-emerald-400" : "text-rose-400")}>{formatPrice(candle.l)}</span>
          </div>
          <div className="flex gap-1.5 items-center">
            <span className="text-zinc-500 uppercase">C</span>
            <span className={cn(candle.isUp ? "text-emerald-400" : "text-rose-400")}>{formatPrice(candle.c)}</span>
          </div>
          <div className="flex gap-1.5 items-center">
            <span className="text-zinc-500 uppercase">Vol</span>
            <span className="text-[#f0b90b] font-bold">{candle.v.toLocaleString()}</span>
          </div>
        </div>
      )}

      <svg
        className="absolute inset-0 pointer-events-none overflow-visible"
        width={box.width}
        height={box.height}
        viewBox={`0 0 ${box.width} ${box.height}`}
      >
        {/* 2. Grid Axes Labels (Price) */}
        <g className="text-[10px] font-mono fill-zinc-500">
          {[0, 1/6, 2/6, 3/6, 4/6, 5/6, 1].map((p, i) => {
            const y = margin.top + chartHeight * p;
            const price = maxPrice - p * priceRange;
            return (
              <text key={i} x={margin.left + chartWidth + 6} y={y + 3}>
                {formatPrice(price)}
              </text>
            );
          })}
        </g>

        {/* Time Labels */}
        <g className="text-[10px] font-mono fill-zinc-500">
            {timeLabels.map((l, i) => (
                <text key={i} x={l.x} y={margin.top + chartHeight + 15} textAnchor="middle">
                    {l.label}
                </text>
            ))}
        </g>

        {/* 3. Current Price Line */}
        {currentPriceY !== null && (
          <g>
            <line
              x1={margin.left}
              y1={currentPriceY}
              x2={margin.left + chartWidth}
              y2={currentPriceY}
              stroke={latestPrice && candle && latestPrice >= candle.o ? "#00c076" : "#cf304a"}
              strokeDasharray="4 2"
              strokeWidth="1"
            />
            <rect
              x={margin.left + chartWidth}
              y={currentPriceY - 8}
              width={margin.right}
              height={16}
              fill={latestPrice && candle && latestPrice >= candle.o ? "#00c076" : "#cf304a"}
            />
            <text
              x={margin.left + chartWidth + 6}
              y={currentPriceY + 3.5}
              fill="white"
              className="text-[10px] font-mono font-bold"
            >
              {formatPrice(latestPrice || 0)}
            </text>
          </g>
        )}

        {/* 4. Crosshair Overlay */}
        {showCrosshair && (
          <g>
            {/* Vertical */}
            <line
              x1={crosshair.x}
              y1={margin.top}
              x2={crosshair.x}
              y2={margin.top + chartHeight}
              stroke="#71717a"
              strokeDasharray="4 4"
              strokeWidth="1"
            />
            {/* Horizontal */}
            <line
              x1={margin.left}
              y1={crosshair.y}
              x2={margin.left + chartWidth}
              y2={crosshair.y}
              stroke="#71717a"
              strokeDasharray="4 4"
              strokeWidth="1"
            />
            {/* Price Label on Axis */}
            <rect
              x={margin.left + chartWidth}
              y={crosshair.y - 10}
              width={margin.right}
              height={20}
              fill="#181a20"
              stroke="#2b2f36"
              strokeWidth="1"
            />
            <text
              x={margin.left + chartWidth + 6}
              y={crosshair.y + 4}
              fill="#e2e3e5"
              className="text-[10px] font-mono font-bold"
            >
              {formatPrice(getPrice(crosshair.y))}
            </text>

            {/* Time Label on Axis */}
            {candle && (
                <g>
                    <rect 
                        x={crosshair.x - 30}
                        y={margin.top + chartHeight}
                        width={60}
                        height={18}
                        fill="#181a20"
                        stroke="#2b2f36"
                        strokeWidth="1"
                    />
                    <text 
                        x={crosshair.x}
                        y={margin.top + chartHeight + 13}
                        textAnchor="middle"
                        fill="white"
                        className="text-[10px] font-mono"
                    >
                        {new Date(candle.ts || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </text>
                </g>
            )}
          </g>
        )}
      </svg>
    </div>
  );
};
