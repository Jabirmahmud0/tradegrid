import React from 'react';
import { CandlestickScales, Box } from './use-candlestick-scales';

interface CandlestickOverlayProps {
  scales: CandlestickScales;
  box: Box;
  crosshair: { x: number; y: number } | null;
  latestPrice: number | null;
}

export const CandlestickOverlay: React.FC<CandlestickOverlayProps> = ({
  scales,
  box,
  crosshair,
  latestPrice,
}) => {
  const { margin } = box;
  const { getY, maxPrice, priceRange, chartWidth, chartHeight } = scales;

  const currentPriceY = latestPrice ? getY(latestPrice) : null;
  const showCrosshair = crosshair && crosshair.x >= margin.left && crosshair.x <= margin.left + chartWidth;

  return (
    <svg
      className="absolute inset-0 pointer-events-none overflow-visible"
      width={box.width}
      height={box.height}
      viewBox={`0 0 ${box.width} ${box.height}`}
    >
      {/* 1. Grid Axes Labels (Linear) */}
      <g className="text-[10px] font-mono fill-zinc-500">
        {[0, 1/6, 2/6, 3/6, 4/6, 5/6, 1].map((p, i) => {
          const y = margin.top + chartHeight * p;
          const price = maxPrice - p * priceRange;
          return (
            <text key={i} x={margin.left + chartWidth + 5} y={y + 3}>
              {price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </text>
          );
        })}
      </g>

      {/* 2. Current Price Line */}
      {currentPriceY !== null && (
        <g>
          <line
            x1={margin.left}
            y1={currentPriceY}
            x2={margin.left + chartWidth}
            y2={currentPriceY}
            stroke="#52525b"
            strokeDasharray="4 2"
            strokeWidth="0.5"
          />
          <rect
            x={margin.left + chartWidth}
            y={currentPriceY - 7}
            width={margin.right - 5}
            height={14}
            fill="#52525b"
          />
          <text
            x={margin.left + chartWidth + 5}
            y={currentPriceY + 3.5}
            fill="white"
            className="text-[9px] font-mono font-bold"
          >
            {latestPrice?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </text>
        </g>
      )}

      {/* 3. Crosshair Overlay */}
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
            width={margin.right - 5}
            height={20}
            fill="#27272a"
          />
          <text
            x={margin.left + chartWidth + 5}
            y={crosshair.y + 4}
            fill="white"
            className="text-[10px] font-mono"
          >
            {scales.getPrice(crosshair.y).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </text>
        </g>
      )}
    </svg>
  );
};
