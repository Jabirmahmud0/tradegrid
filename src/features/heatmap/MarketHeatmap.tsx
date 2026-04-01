import React, { useRef, useLayoutEffect } from 'react';
import * as d3 from 'd3';
import { useLiveStore } from '../../store/live-store';
import { cn } from '../../utils';

interface MarketHeatmapProps {
  className?: string;
}

export const MarketHeatmap: React.FC<MarketHeatmapProps> = ({ className }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const heatmap = useLiveStore(state => state.heatmap);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !heatmap || heatmap.cells.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high-dpi displays
    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // 1. Prepare Data for D3 Treemap
    const data = {
        name: 'root',
        children: heatmap.cells
    };

    const root = d3.hierarchy<any>(data)
        .sum(d => (d as any).vol)
        .sort((a, b) => (b.value || 0) - (a.value || 0));

    const treemapLayout = d3.treemap<any>()
        .size([rect.width, rect.height])
        .padding(1);
    
    treemapLayout(root);

    // 2. Render
    ctx.clearRect(0, 0, rect.width, rect.height);
    
    root.leaves().forEach((leaf: any) => {
        const { x0, y0, x1, y1, data: cell } = leaf;
        const w = x1 - x0;
        const h = y1 - y0;

        // Color based on delta (sentiment)
        // delta ranges from -1 to 1 in simulation
        const delta = cell.delta || 0;
        const green = [34, 197, 94];
        const red = [239, 68, 68];

        let color;
        if (delta > 0) {
            const alpha = Math.min(1, delta * 2);
            color = `rgba(${green[0]}, ${green[1]}, ${green[2]}, ${alpha})`;
        } else {
            const alpha = Math.min(1, Math.abs(delta) * 2);
            color = `rgba(${red[0]}, ${red[1]}, ${red[2]}, ${alpha})`;
        }

        ctx.fillStyle = color;
        ctx.fillRect(x0, y0, w, h);

        // Border
        ctx.strokeStyle = '#09090b';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(x0, y0, w, h);

        // Labels (if big enough)
        if (w > 40 && h > 20) {
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 10px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(cell.sym, x0 + w / 2, y0 + h / 2 + 4);
        }
    });

  }, [heatmap]);

  return (
    <div ref={containerRef} className={cn("w-full h-full bg-zinc-950 overflow-hidden", className)}>
        {!heatmap && (
             <div className="flex items-center justify-center h-full text-zinc-800 text-xs italic">
                Awaiting market sentiment...
             </div>
        )}
        <canvas 
            ref={canvasRef} 
            style={{ width: '100%', height: '100%', display: 'block' }}
        />
    </div>
  );
};
