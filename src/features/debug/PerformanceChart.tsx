import React, { useMemo } from 'react';

interface PerformanceChartProps {
    data: number[];
    color?: string;
    height?: number;
    max?: number;
}

export const PerformanceChart: React.FC<PerformanceChartProps> = ({
    data,
    color = "currentColor",
    height = 30,
    max: providedMax
}) => {
    const { points, viewBoxWidth } = useMemo(() => {
        if (!data.length) return { points: "", viewBoxWidth: 200 };
        const max = providedMax || Math.max(...data, 1);
        const viewBoxWidth = Math.max(200, data.length * 10);
        const step = viewBoxWidth / (data.length - 1);

        const pts = data.map((val, i) => {
            const x = i * step;
            const y = height - (val / max) * height;
            return `${x},${y}`;
        }).join(" ");

        return { points: pts, viewBoxWidth };
    }, [data, height, providedMax]);

    return (
        <svg viewBox={`0 0 ${viewBoxWidth} ${height}`} className="w-full h-full overflow-visible">
            <polyline
                fill="none"
                stroke={color}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points}
                className="transition-all duration-300"
            />
        </svg>
    );
};
