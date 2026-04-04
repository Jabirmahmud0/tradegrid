import React, { useRef, useLayoutEffect } from 'react';
import { OrderBookLevel } from '../../store/live-store/orderbook.slice';
import { DepthScales } from './use-depth-scales';

interface DepthCanvasProps {
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  scales: DepthScales;
}

const getColors = () => {
    const root = getComputedStyle(document.documentElement);
    return {
        bg: root.getPropertyValue('--color-bg-base').trim() || '#0b0e11',
        bid: root.getPropertyValue('--color-profit').trim() || '#00c076',
        ask: root.getPropertyValue('--color-loss').trim() || '#cf304a',
        grid: root.getPropertyValue('--color-border-subtle').trim() || '#1e2329',
    };
};

export const DepthCanvas: React.FC<DepthCanvasProps> = ({ bids, asks, scales }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || (!bids.length && !asks.length)) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const COLORS = getColors();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = scales.width * dpr;
    canvas.height = scales.height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, scales.width, scales.height);

    const { x, y, margin, chartHeight } = scales;

    // Draw Side Helper
    const drawSide = (data: OrderBookLevel[], color: string) => {
        if (data.length === 0) return;

        ctx.beginPath();
        const first = data[0];
        const last = data[data.length - 1];

        // Gradient Fill
        const gradient = ctx.createLinearGradient(0, margin.top, 0, margin.top + chartHeight);
        gradient.addColorStop(0, color.replace(')', ', 0.3)').replace('rgb', 'rgba'));
        gradient.addColorStop(1, color.replace(')', ', 0.05)').replace('rgb', 'rgba'));
        ctx.fillStyle = gradient;

        // Path for fill
        ctx.moveTo(x(first.price), margin.top + chartHeight);
        data.forEach(d => ctx.lineTo(x(d.price), y(d.total)));
        ctx.lineTo(x(last.price), margin.top + chartHeight);
        ctx.closePath();
        ctx.fill();

        // Stroke
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        data.forEach((d, i) => {
            if (i === 0) ctx.moveTo(x(d.price), y(d.total));
            else ctx.lineTo(x(d.price), y(d.total));
        });
        ctx.stroke();
    };

    // Draw Bids (Emerald)
    drawSide(bids, COLORS.bid);

    // Draw Asks (Red)
    drawSide(asks, COLORS.ask);

  }, [bids, asks, scales]);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" style={{ width: '100%', height: '100%' }} />;
};
