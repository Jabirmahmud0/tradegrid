import React, { useRef, useLayoutEffect } from 'react';
import { NormalizedCandle } from '../../../types';
import { CandlestickScales, Box } from './use-candlestick-scales';

interface CandlestickCanvasProps {
  candles: NormalizedCandle[];
  scales: CandlestickScales;
  box: Box;
}

export const CandlestickCanvas: React.FC<CandlestickCanvasProps> = ({ candles, scales, box }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || candles.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = box.width * dpr;
    canvas.height = box.height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, box.width, box.height);

    const { getX, getY, candleWidth, chartWidth, chartHeight, maxVolume } = scales;

    // 1. Grid Lines
    ctx.strokeStyle = '#18181b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i <= 6; i++) {
      const y = box.margin.top + (chartHeight / 6) * i;
      ctx.moveTo(box.margin.left, y);
      ctx.lineTo(box.margin.left + chartWidth, y);
    }
    ctx.stroke();

    // 2. Volume and Candles
    candles.forEach((c, i) => {
      const x = getX(i);
      const isUp = c.isUp;
      const candleColor = isUp ? '#22c55e' : '#ef4444';

      // Volume Bars
      const vH = (c.v / maxVolume) * chartHeight * 0.2;
      ctx.fillStyle = isUp ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)';
      ctx.fillRect(x, box.margin.top + chartHeight - vH, candleWidth, vH);

      // Wick
      ctx.strokeStyle = candleColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x + candleWidth / 2, getY(c.h));
      ctx.lineTo(x + candleWidth / 2, getY(c.l));
      ctx.stroke();

      // Body
      const openY = getY(c.o);
      const closeY = getY(c.c);
      ctx.fillStyle = candleColor;
      ctx.fillRect(x, Math.min(openY, closeY), candleWidth, Math.max(1, Math.abs(openY - closeY)));
    });
  }, [candles, scales, box]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ width: '100%', height: '100%' }}
    />
  );
};
