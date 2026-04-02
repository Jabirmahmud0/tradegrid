import React, { useRef, useLayoutEffect } from 'react';
import { DepthLevel, DepthScales } from './use-depth-scales';

interface DepthCanvasProps {
  bids: DepthLevel[];
  asks: DepthLevel[];
  scales: DepthScales;
}

export const DepthCanvas: React.FC<DepthCanvasProps> = ({ bids, asks, scales }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !bids.length || !asks.length) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = scales.width * dpr;
    canvas.height = scales.height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, scales.width, scales.height);

    const { getX, getY, height } = scales;
    const bestBid = bids[0].price;
    const bestAsk = asks[0].price;

    // Draw Bids (Buy side)
    ctx.beginPath();
    ctx.fillStyle = 'rgba(34, 197, 94, 0.15)';
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 2;
    ctx.moveTo(getX(bestBid), height);
    bids.forEach(l => ctx.lineTo(getX(l.price), getY(l.total)));
    ctx.lineTo(getX(scales.minPrice), height);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Draw Asks (Sell side)
    ctx.beginPath();
    ctx.fillStyle = 'rgba(239, 68, 68, 0.15)';
    ctx.strokeStyle = '#ef4444';
    ctx.moveTo(getX(bestAsk), height);
    asks.forEach(l => ctx.lineTo(getX(l.price), getY(l.total)));
    ctx.lineTo(getX(scales.maxPrice), height);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

  }, [bids, asks, scales]);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" style={{ width: '100%', height: '100%' }} />;
};
