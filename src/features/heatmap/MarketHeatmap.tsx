import React, { useRef, useLayoutEffect, useState, useCallback, useEffect } from 'react';
import * as d3 from 'd3';
import { useLiveStore } from '../../store/live-store';
import { cn } from '../../utils';
import { DataTableFallback } from '../../components/common/DataTableFallback';
import { toRgba } from '../../lib/utils';
import { HeatmapEvent, NormalizedTrade } from '../../types';
import { getMarketSector } from '../../lib/market-symbols';

interface MarketHeatmapProps {
  className?: string;
}

export const MarketHeatmap: React.FC<MarketHeatmapProps> = ({ className }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const heatmap = useLiveStore(state => state.heatmap);
  const trades = useLiveStore(state => state.trades);
  const dataSource = useLiveStore(state => state.dataSource);
  const hoveredCellRef = useRef<any | null>(null);
  const [hoveredCell, setHoveredCell] = useState<any | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  const displayHeatmap = React.useMemo<HeatmapEvent | null>(() => {
    if (heatmap) return heatmap;
    if (!dataSource.startsWith('binance')) return null;
    if (trades.length === 0) return null;

    const grouped = new Map<string, NormalizedTrade[]>();
    for (const trade of trades.slice(0, 300)) {
      if (!grouped.has(trade.sym)) {
        grouped.set(trade.sym, []);
      }
      grouped.get(trade.sym)!.push(trade);
    }

    const cells = Array.from(grouped.entries())
      .map(([sym, symbolTrades]) => {
        const latest = symbolTrades[0];
        const oldest = symbolTrades[symbolTrades.length - 1];
        if (!latest || !oldest) return null;

        const basePrice = oldest.px || latest.px;
        const delta = basePrice > 0 ? (latest.px - basePrice) / basePrice : 0;
        const vol = symbolTrades.reduce((sum, trade) => sum + (trade.px * trade.qty), 0);

        return {
          sym,
          delta,
          vol,
          sector: getMarketSector(sym),
        };
      })
      .filter((cell): cell is NonNullable<typeof cell> => cell !== null);

    if (cells.length === 0) return null;

    return {
      t: 'heatmap',
      cells,
      ts: Math.max(...cells.map((cell) => grouped.get(cell.sym)?.[0]?.ts ?? 0)),
    };
  }, [dataSource, heatmap, trades]);

  // ResizeObserver to track container size changes
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setContainerSize({ width, height });
      }
    });

    observer.observe(container);
    // Initialize size on first render
    const rect = container.getBoundingClientRect();
    setContainerSize({ width: rect.width, height: rect.height });

    return () => observer.disconnect();
  }, []);

    const getColors = () => {
        const root = getComputedStyle(document.documentElement);
        return {
            bg: root.getPropertyValue('--color-bg-base').trim() || '#0b0e11',
            surface: root.getPropertyValue('--color-bg-surface').trim() || '#181a20',
            profit: root.getPropertyValue('--color-profit').trim() || '#00c076',
            loss: root.getPropertyValue('--color-loss').trim() || '#cf304a',
            border: root.getPropertyValue('--color-border').trim() || '#2b2f36',
            text: root.getPropertyValue('--color-text-primary').trim() || '#eaecef',
            textSecondary: root.getPropertyValue('--color-text-secondary').trim() || '#848e9c',
        };
    };

    useLayoutEffect(() => {
        if (displayHeatmap) {
            setLastUpdate(new Date(displayHeatmap.ts));
        }
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container || !displayHeatmap || displayHeatmap.cells.length === 0) return;
        if (containerSize.width === 0 || containerSize.height === 0) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const COLORS = getColors();
        const dpr = window.devicePixelRatio || 1;
        canvas.width = containerSize.width * dpr;
        canvas.height = containerSize.height * dpr;
        ctx.scale(dpr, dpr);

        // 1. Hierarchical Data with Sector Grouping
        const grouped = d3.group(displayHeatmap.cells, d => d.sector);
        const data = {
            name: 'root',
            children: Array.from(grouped, ([name, children]) => ({ name, children }))
        };

        const root = d3.hierarchy<any>(data)
            .sum(d => (d as any).vol)
            .sort((a, b) => (b.value || 0) - (a.value || 0));

        const treemapLayout = d3.treemap<any>()
            .size([containerSize.width, containerSize.height])
            .paddingOuter(4)
            .paddingTop(18) // Space for sector label
            .paddingInner(1);

        treemapLayout(root);

        // 2. Render
        ctx.clearRect(0, 0, containerSize.width, containerSize.height);

        // Draw Sector Containers
        root.children?.forEach((sector: any) => {
            const { x0, y0, x1, y1, data: sectorData } = sector;

            // Sector Header Background
            ctx.fillStyle = COLORS.surface;
            ctx.fillRect(x0, y0, x1 - x0, 18);

            // Sector Label
            ctx.fillStyle = COLORS.textSecondary;
            ctx.font = 'bold 9px monospace';
            ctx.textAlign = 'left';
            ctx.fillText(sectorData.name.toUpperCase(), x0 + 6, y0 + 13);

            // Sector Border
            ctx.strokeStyle = COLORS.border;
            ctx.lineWidth = 1;
            ctx.strokeRect(x0, y0, x1 - x0, y1 - y0);
        });

        // Read hoveredCell from ref to avoid re-render dependency
        const currentHover = hoveredCellRef.current;

        root.leaves().forEach((leaf: any) => {
            const { x0, y0, x1, y1, data: cell } = leaf;
            const w = x1 - x0;
            const h = y1 - y0;

            const delta = cell.delta || 0;
            const intensity = Math.min(1, Math.abs(delta) * 1.5);
            const baseColor = delta >= 0 ? COLORS.profit : COLORS.loss;

            // Semi-transparent fill based on intensity — properly handles hex, rgb, and rgba colors
            ctx.fillStyle = toRgba(baseColor, 0.1 + intensity * 0.7);
            ctx.fillRect(x0, y0, w, h);

            // Cell Border
            ctx.strokeStyle = COLORS.bg;
            ctx.lineWidth = 0.5;
            ctx.strokeRect(x0, y0, w, h);

            // Highlight if hovered
            if (currentHover?.sym === cell.sym) {
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.strokeRect(x0 + 1, y0 + 1, w - 2, h - 2);
            }

            // Labels
            if (w > 32 && h > 20) {
                ctx.fillStyle = COLORS.text;
                ctx.textAlign = 'center';
                const fontSize = Math.min(14, w / 4);
                ctx.font = `bold ${fontSize}px monospace`;
                ctx.fillText(cell.sym, x0 + w / 2, y0 + h / 2 + 2);

                if (h > 40) {
                    ctx.font = '9px monospace';
                    ctx.fillStyle = COLORS.textSecondary;
                    ctx.fillText(`${(delta * 100).toFixed(2)}%`, x0 + w / 2, y0 + h / 2 + 14);
                }
            }
        });

    // 3. Mouse Tracking Utility
    (canvas as any)._root = root; // Attach root for hit testing

  }, [displayHeatmap, containerSize]);

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

    const newHovered = found ? found.data : null;
    hoveredCellRef.current = newHovered;
    setHoveredCell(newHovered);
  }, []);

  return (
    <div 
        ref={containerRef} 
        className={cn("w-full h-full bg-zinc-950 overflow-hidden relative group cursor-crosshair focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none", className)}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => { hoveredCellRef.current = null; setHoveredCell(null); }}
        tabIndex={0}
        role="img"
        aria-label="Market Heatmap showing asset volume and price delta by sector"
    >
        {/* Hidden Data for Screen Readers */}
        <div className="sr-only">
            <table>
                <caption>Market Heatmap Data</caption>
                <thead>
                    <tr>
                        <th>Symbol</th>
                        <th>Sector</th>
                        <th>Delta</th>
                        <th>Volume</th>
                    </tr>
                </thead>
                <tbody>
                    {displayHeatmap?.cells.map(cell => (
                        <tr key={cell.sym}>
                            <td>{cell.sym}</td>
                            <td>{cell.sector}</td>
                            <td>{(cell.delta * 100).toFixed(2)}%</td>
                            <td>{cell.vol}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>

        {!displayHeatmap && (
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

        {/* Status Overlay */}
        {lastUpdate && (
            <div className="absolute top-2 right-2 flex items-center justify-center gap-1.5 px-2 py-0.5 rounded bg-zinc-900/80 backdrop-blur pointer-events-none border border-zinc-800/50">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-widest">
                    Live
                </span>
            </div>
        )}

        {/* Data Table Fallback (keyboard accessible) */}
        {displayHeatmap && displayHeatmap.cells.length > 0 && (
            <DataTableFallback
                title="Market Heatmap"
                headers={['Symbol', 'Sector', 'Delta', 'Volume']}
                rows={displayHeatmap.cells.map(c => [
                    c.sym,
                    c.sector,
                    `${(c.delta * 100).toFixed(2)}%`,
                    c.vol.toLocaleString(undefined, { maximumFractionDigits: 0 })
                ])}
            />
        )}
    </div>
  );
};
