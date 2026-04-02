import React from 'react';
import { DepthScales } from './use-depth-scales';

interface DepthOverlayProps {
  scales: DepthScales;
  crosshair: { x: number; y: number } | null;
  bestBid: number;
  bestAsk: number;
}

export const DepthOverlay: React.FC<DepthOverlayProps> = ({
  scales,
  crosshair,
  bestBid,
  bestAsk,
}) => {
  const { width, height, getX, getPrice, getTotal, minPrice, maxPrice, maxTotal } = scales;

  const midPrice = bestBid > 0 ? (bestBid + bestAsk) / 2 : 0;
  const midX = getX(midPrice);
  const showCrosshair = crosshair && crosshair.x >= 0 && crosshair.x <= width;

  return (
    <svg
      className="absolute inset-0 pointer-events-none overflow-visible"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
    >
      {/* 1. Price Axis (Bottom) */}
      <g className="text-[9px] font-mono fill-zinc-600">
        {[minPrice, midPrice, maxPrice].map((p, i) => {
            const x = getX(p);
            return (
                <text key={i} x={x} y={height - 2} textAnchor={i === 0 ? "start" : i === 2 ? "end" : "middle"}>
                    {p.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </text>
            )
        })}
      </g>

      {/* 2. Quantity Axis Lines (Horizontal) */}
      <g className="text-[9px] font-mono fill-zinc-700/50">
        {[0, 0.25, 0.5, 0.75].map((p, i) => {
            const y = height * (1 - p);
            return (
                <g key={i}>
                    <line x1={0} y1={y} x2={width} y2={y} stroke="#18181b" strokeWidth="0.5" />
                    <text x={2} y={y - 2}>
                        {(maxTotal * p).toFixed(0)}
                    </text>
                </g>
            )
        })}
      </g>

      {/* 3. Mid Price Vertical Line */}
      {midX > 0 && (
          <g>
            <line x1={midX} y1={0} x2={midX} y2={height} stroke="#3f3f46" strokeDasharray="5 5" strokeWidth="1" />
            <rect x={midX - 30} y={height / 2 - 10} width={60} height={20} fill="#18181b" rx={2} stroke="#3f3f46" strokeWidth="0.5" />
            <text x={midX} y={height / 2 + 3} textAnchor="middle" fill="#71717a" className="text-[9px] font-bold">MID PRICE</text>
          </g>
      )}

      {/* 4. Crosshair */}
      {showCrosshair && (
          <g>
              <line x1={crosshair.x} y1={0} x2={crosshair.x} y2={height} stroke="#52525b" strokeDasharray="4 2" />
              <line x1={0} y1={crosshair.y} x2={width} y2={crosshair.y} stroke="#52525b" strokeDasharray="4 2" />
              
              {/* x-axis label */}
              <rect x={crosshair.x - 30} y={height - 15} width={60} height={14} fill="#27272a" rx={2} />
              <text x={crosshair.x} y={height - 5} textAnchor="middle" fill="white" className="text-[9px] font-mono">
                  {getPrice(crosshair.x).toFixed(2)}
              </text>

              {/* y-axis label */}
              <rect x={2} y={crosshair.y - 7} width={40} height={14} fill="#27272a" rx={2} />
              <text x={22} y={crosshair.y + 3} textAnchor="middle" fill="white" className="text-[9px] font-mono">
                  {getTotal(crosshair.y).toFixed(0)}
              </text>
          </g>
      )}
    </svg>
  );
};
