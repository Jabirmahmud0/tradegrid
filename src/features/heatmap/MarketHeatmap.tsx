import React, { useRef, useLayoutEffect, useState, useCallback } from 'react';
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
  const [hoveredCell, setHoveredCell] = useState<any | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !heatmap || heatmap.cells.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // 1. Hierarchical Data with Sector Grouping
    const grouped = d3.group(heatmap.cells, d => d.sector);
    const data = {
        name: 'root',
        children: Array.from(grouped, ([name, children]) => ({ name, children }))
    };

    const root = d3.hierarchy<any>(data)
        .sum(d => (d as any).vol)
        .sort((a, b) => (b.value || 0) - (a.value || 0));

    const treemapLayout = d3.treemap<any>()
        .size([rect.width, rect.height])
        .paddingOuter(2)
        .paddingTop(14) // Space for sector label
        .paddingInner(1);
    
    treemapLayout(root);

    // 2. Render
    ctx.clearRect(0, 0, rect.width, rect.height);
    
    // Draw Sector Containers
    root.children?.forEach((sector: any) => {
        const { x0, y0, x1, y1, data: sectorData } = sector;
        ctx.fillStyle = '#18181b';
        ctx.fillRect(x0, y0, x1-x0, 14);
        ctx.fillStyle = '#71717a';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(sectorData.name.toUpperCase(), x0 + 4, y0 + 10);

        ctx.strokeStyle = '#27272a';
        ctx.lineWidth = 1;
        ctx.strokeRect(x0, y0, x1-x0, y1-y0);
    });

    root.leaves().forEach((leaf: any) => {
        const { x0, y0, x1, y1, data: cell } = leaf;
        const w = x1 - x0;
        const h = y1 - y0;

        const delta = cell.delta || 0;
        // delta in simulation is -1 to 1
        const intensity = Math.min(1, Math.abs(delta) * 1.5);
        const color = delta >= 0 
            ? `rgba(34, 197, 94, ${0.1 + intensity * 0.7})` 
            : `rgba(239, 68, 68, ${0.1 + intensity * 0.7})`;

        ctx.fillStyle = color;
        ctx.fillRect(x0, y0, w, h);

        // Highlight if hovered
        if (hoveredCell?.sym === cell.sym) {
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.strokeRect(x0 + 1, y0 + 1, w - 2, h - 2);
        }

        // Labels
        if (w > 30 && h > 15) {
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'center';
            ctx.font = `bold ${Math.min(12, w / 4)}px monospace`;
            ctx.fillText(cell.sym, x0 + w / 2, y0 + h / 2 + 2);
            
            if (h > 30) {
                ctx.font = '9px monospace';
                ctx.fillStyle = 'rgba(255,255,255,0.6)';
                ctx.fillText(`${(delta * 100).toFixed(2)}%`, x0 + w / 2, y0 + h / 2 + 12);
            }
        }
    });

    // 3. Mouse Tracking Utility
    (canvas as any)._root = root; // Attach root for hit testing
    
  }, [heatmap, hoveredCell]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setTooltipPos({ x, y });

    const root = (canvas as any)._root;
    if (!root) return;

    // Hit test
    const found = root.leaves().find((leaf: any) => 
        x >= leaf.x0 && x <= leaf.x1 && y >= leaf.y0 && y <= leaf.y1
    );

    setHoveredCell(found ? found.data : null);
  }, []);

  return (
    <div 
        ref={containerRef} 
        className={cn("w-full h-full bg-zinc-950 overflow-hidden relative group cursor-crosshair", className)}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredCell(null)}
    >
        {!heatmap && (
             <div className="flex items-center justify-center h-full text-zinc-800 text-xs italic">
                Quantifying market dynamic...
             </div>
        )}
        <canvas 
            ref={canvasRef} 
            style={{ width: '100%', height: '100%', display: 'block' }}
        />

        {/* Tooltip */}
        {hoveredCell && (
            <div 
                className="absolute z-50 pointer-events-none bg-zinc-900 border border-zinc-700 p-2 rounded shadow-2xl flex flex-col gap-1 min-w-[120px] transition-transform duration-75"
                style={{ 
                    left: Math.min(tooltipPos.x + 15, (containerRef.current?.clientWidth || 0) - 130), 
                    top: Math.min(tooltipPos.y + 15, (containerRef.current?.clientHeight || 0) - 80)
                }}
            >
                <div className="flex items-center justify-between">
                    <span className="font-bold text-zinc-100">{hoveredCell.sym}</span>
                    <span className="text-[10px] text-zinc-500 uppercase">{hoveredCell.sector}</span>
                </div>
                <div className={cn(
                    "text-xs font-mono font-bold",
                    hoveredCell.delta >= 0 ? "text-emerald-400" : "text-red-400"
                )}>
                    {hoveredCell.delta >= 0 ? '+' : ''}{(hoveredCell.delta * 100).toFixed(2)}%
                </div>
                <div className="text-[10px] text-zinc-500 border-t border-zinc-800 pt-1 mt-1">
                    VOL: {hoveredCell.vol.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </div>
            </div>
        )}
    </div>
  );
};
