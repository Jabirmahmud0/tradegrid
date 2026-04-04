import React, { useMemo } from 'react';
import * as d3 from 'd3';
import { DepthScales } from './use-depth-scales';
import { OrderBookLevel } from '../../store/live-store/orderbook.slice';

interface DepthOverlayProps {
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  scales: DepthScales;
  activeLevel?: OrderBookLevel | null;
  onMouseMove?: (level: OrderBookLevel | null) => void;
}

export const DepthOverlay: React.FC<DepthOverlayProps> = ({ bids, asks, scales, activeLevel, onMouseMove }) => {
    const { x, y, margin, chartWidth, chartHeight } = scales;

    const yAxisTicks = useMemo(() => {
        return y.ticks(4);
    }, [y]);

    const xAxisTicks = useMemo(() => {
        return x.ticks(6);
    }, [x]);

    const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
        const svg = e.currentTarget;
        const rect = svg.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const price = x.invert(mouseX);

        // Find nearest level from bids or asks
        const allLevels = [...bids, ...asks];
        if (allLevels.length === 0) return;

        const nearest = allLevels.reduce((prev, curr) => {
            return Math.abs(curr.price - price) < Math.abs(prev.price - price) ? curr : prev;
        });

        onMouseMove?.(nearest);
    };

    return (
        <svg
            className="absolute inset-0 cursor-crosshair overflow-visible touch-none"
            style={{ width: '100%', height: '100%' }}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => onMouseMove?.(null)}
        >
            {/* Y Axis Grid Labels */}
            <g className="y-axis-labels pointer-events-none">
                {yAxisTicks.map((tick) => (
                    <text
                        key={tick}
                        x={margin.left + chartWidth + 5}
                        y={y(tick)}
                        fill="var(--color-text-tertiary)"
                        fontSize="9"
                        dominantBaseline="middle"
                        fontWeight="bold"
                    >
                        {d3.format('.2s')(tick)}
                    </text>
                ))}
            </g>

            {/* X Axis Grid Labels */}
            <g className="x-axis-labels pointer-events-none">
                {xAxisTicks.map((tick) => (
                    <text
                        key={tick}
                        x={x(tick)}
                        y={margin.top + chartHeight + 15}
                        fill="var(--color-text-tertiary)"
                        fontSize="9"
                        textAnchor="middle"
                        fontWeight="bold"
                    >
                        {d3.format('.1f')(tick)}
                    </text>
                ))}
            </g>

            {/* Price Line Indicator (Crosshair) */}
            {activeLevel && (
                <g className="crosshair pointer-events-none">
                    <line
                        x1={x(activeLevel.price)}
                        y1={margin.top}
                        x2={x(activeLevel.price)}
                        y2={margin.top + chartHeight}
                        stroke="var(--color-text-secondary)"
                        strokeWidth="1"
                        strokeDasharray="4 4"
                    />
                    <circle
                        cx={x(activeLevel.price)}
                        cy={y(activeLevel.total)}
                        r="4"
                        fill="var(--color-profit)"
                        stroke="var(--color-bg-base)"
                        strokeWidth="2"
                    />
                    <rect
                        x={x(activeLevel.price) - 40}
                        y={margin.top - 20}
                        width="80"
                        height="18"
                        rx="2"
                        fill="var(--color-bg-overlay)"
                    />
                    <text
                        x={x(activeLevel.price)}
                        y={margin.top - 8}
                        fill="var(--color-text-primary)"
                        fontSize="9"
                        fontWeight="bold"
                        textAnchor="middle"
                    >
                        {d3.format('.2f')(activeLevel.price)}
                    </text>

                    {/* Total Volume Tooltip */}
                    <rect
                        x={margin.left + chartWidth + 2}
                        y={y(activeLevel.total) - 10}
                        width="50"
                        height="20"
                        rx="2"
                        fill="var(--color-bg-overlay)"
                    />
                    <text
                        x={margin.left + chartWidth + 5}
                        y={y(activeLevel.total)}
                        fill="var(--color-text-primary)"
                        fontSize="9"
                        dominantBaseline="middle"
                        fontWeight="bold"
                    >
                        {d3.format('.1s')(activeLevel.total)}
                    </text>
                </g>
            )}
        </svg>
    );
};
