import React, { useRef, useLayoutEffect } from 'react';
import { NormalizedCandle } from '../../../types';
import { CandlestickScales, Box } from './use-candlestick-scales';
import { calculateSMA } from '../../../utils/indicators';

interface CandlestickCanvasProps {
  candles: NormalizedCandle[];
  scales: CandlestickScales;
  box: Box;
}

// Get CSS Variable colors
const getColors = () => {
  const root = getComputedStyle(document.documentElement);
  return {
    bg: root.getPropertyValue('--color-bg-base').trim() || '#0b0e11',
    green: root.getPropertyValue('--color-profit').trim() || '#00c076',
    red: root.getPropertyValue('--color-loss').trim() || '#cf304a',
    grid: root.getPropertyValue('--color-border-subtle').trim() || '#1e2329',
    ma7: '#f0b90b', // Yellow
    ma25: '#8739fa', // Purple
    volUp: 'rgba(0, 192, 118, 0.2)',
    volDown: 'rgba(207, 48, 74, 0.2)'
  };
};

export const CandlestickCanvas: React.FC<CandlestickCanvasProps> = ({ candles, scales, box }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || candles.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const COLORS = getColors();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = box.width * dpr;
    canvas.height = box.height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, box.width, box.height);

    const { getX, getY, candleWidth, chartWidth, chartHeight, getVolumeY, timeLabels } = scales;

    // 1. Grid Lines (Horizontal & Vertical)
    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 1;
    
    // Horizontal Grid
    ctx.beginPath();
    for (let i = 0; i <= 6; i++) {
      const y = box.margin.top + (chartHeight / 6) * i;
      ctx.moveTo(box.margin.left, y);
      ctx.lineTo(box.margin.left + chartWidth, y);
    }
    ctx.stroke();

    // Vertical Grid
    ctx.beginPath();
    timeLabels.forEach(label => {
        ctx.moveTo(label.x, box.margin.top);
        ctx.lineTo(label.x, box.margin.top + chartHeight);
    });
    ctx.stroke();

    // 2. Technical Indicators (MAs)
    const ma7 = calculateSMA(candles, 7);
    const ma25 = calculateSMA(candles, 25);

    const drawLine = (data: number[], color: string) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        let first = true;
        data.forEach((val, i) => {
            if (isNaN(val)) return;
            const x = getX(i) + candleWidth / 2;
            const y = getY(val);
            if (first) {
                ctx.moveTo(x, y);
                first = false;
            } else {
                ctx.lineTo(x, y);
            }
        });
        ctx.stroke();
    };

    drawLine(ma7, COLORS.ma7);
    drawLine(ma25, COLORS.ma25);

    // 3. Candles and Volume
    candles.forEach((c, i) => {
      const x = getX(i);
      const isUp = c.isUp;
      const candleColor = isUp ? COLORS.green : COLORS.red;

      // Volume Bars (Subtle)
      const vY = getVolumeY(c.v);
      const baselineY = box.margin.top + chartHeight;
      ctx.fillStyle = isUp ? 'rgba(0, 192, 118, 0.08)' : 'rgba(207, 48, 74, 0.08)';
      ctx.fillRect(x, vY, candleWidth, baselineY - vY);

      // Wick
      ctx.strokeStyle = candleColor;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      // Snap to pixel center for sharper lines
      const centerX = Math.floor(x + candleWidth / 2) + 0.5;
      ctx.moveTo(centerX, getY(c.h));
      ctx.lineTo(centerX, getY(c.l));
      ctx.stroke();

      // Body
      const openY = getY(c.o);
      const closeY = getY(c.c);
      const bodyH = Math.max(1, Math.abs(openY - closeY));
      const minY = Math.min(openY, closeY);
      
      if (isUp) {
        ctx.strokeStyle = candleColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(x + 0.5, minY + 0.5, candleWidth - 1, bodyH - 1, 1);
        } else {
            ctx.rect(x + 0.5, minY + 0.5, candleWidth - 1, bodyH - 1);
        }
        ctx.stroke();
      } else {
        ctx.fillStyle = candleColor;
        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(x, minY, candleWidth, bodyH, 1);
        } else {
            ctx.rect(x, minY, candleWidth, bodyH);
        }
        ctx.fill();
      }
      
      // Glow on latest candle
      if (i === candles.length - 1) {
          ctx.shadowColor = candleColor;
          ctx.shadowBlur = 8;
          ctx.fillStyle = candleColor;
          ctx.fillRect(x + candleWidth/2 - 1, closeY - 1, 2, 2);
          ctx.shadowBlur = 0; // reset
      }
    });

  }, [candles, scales, box]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ width: '100%', height: '100%', background: 'var(--color-bg-base)' }}
    />
  );
};
