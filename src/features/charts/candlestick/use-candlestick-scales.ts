import { useMemo } from 'react';
import { NormalizedCandle } from '../../../types';

export interface Box {
  width: number;
  height: number;
  margin: { top: number; right: number; bottom: number; left: number };
}

export interface CandlestickScales {
  minPrice: number;
  maxPrice: number;
  priceRange: number;
  maxVolume: number;
  candleWidth: number;
  chartWidth: number;
  chartHeight: number;
  getX: (index: number) => number;
  getY: (price: number) => number;
  getVolumeY: (volume: number) => number;
  getPrice: (y: number) => number;
  timeLabels: { x: number; label: string }[];
}

function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return 0;
  if (sorted.length === 1) return sorted[0];

  const position = (sorted.length - 1) * q;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);

  if (lower === upper) return sorted[lower];

  const weight = position - lower;
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

/**
 * Round a price to a "nice" number for display on the axis.
 * e.g., 50237.15 → 50240, 1.234 → 1.23
 */
export const useCandlestickScales = (
  candles: NormalizedCandle[],
  box: Box,
  gap: number = 3,
  volumeRatio: number = 0.10
): CandlestickScales => {
  return useMemo(() => {
    const chartWidth = box.width - box.margin.left - box.margin.right;
    const chartHeight = box.height - box.margin.top - box.margin.bottom;

    if (candles.length === 0 || chartWidth <= 0 || chartHeight <= 0) {
      return {
        minPrice: 0,
        maxPrice: 100,
        priceRange: 100,
        maxVolume: 0,
        candleWidth: 0,
        chartWidth: Math.max(0, chartWidth),
        chartHeight: Math.max(0, chartHeight),
        getX: () => 0,
        getY: () => 0,
        getVolumeY: () => 0,
        getPrice: () => 0,
        timeLabels: [],
      };
    }

    let maxVolume = 0;
    const lows: number[] = [];
    const highs: number[] = [];
    let bodyMin = Infinity;
    let bodyMax = -Infinity;

    candles.forEach((c) => {
      lows.push(c.l);
      highs.push(c.h);
      bodyMin = Math.min(bodyMin, c.o, c.c);
      bodyMax = Math.max(bodyMax, c.o, c.c);
      if (c.v > maxVolume) maxVolume = c.v;
    });

    lows.sort((a, b) => a - b);
    highs.sort((a, b) => a - b);

    const trimQuantile = candles.length >= 40 ? 0.04 : candles.length >= 20 ? 0.02 : 0;
    const trimmedLow = trimQuantile > 0 ? quantile(lows, trimQuantile) : lows[0];
    const trimmedHigh = trimQuantile > 0 ? quantile(highs, 1 - trimQuantile) : highs[highs.length - 1];

    let minPrice = Math.min(bodyMin, trimmedLow);
    let maxPrice = Math.max(bodyMax, trimmedHigh);

    const rawRange = maxPrice - minPrice;
    const midpoint = (maxPrice + minPrice) / 2;

    if (rawRange <= 0) {
      const fallbackRange = Math.max(Math.abs(midpoint) * 0.002, 1);
      maxPrice = midpoint + fallbackRange / 2;
      minPrice = midpoint - fallbackRange / 2;
    } else {
      const rangePadding = rawRange * 0.12;
      const absoluteFloor = Math.max(Math.abs(midpoint) * 0.0002, 0.5);
      const absoluteCap = Math.max(Math.abs(midpoint) * 0.0015, absoluteFloor);
      const padding = Math.min(Math.max(rangePadding, absoluteFloor), absoluteCap);
      maxPrice += padding;
      minPrice -= padding;
    }

    const priceRange = maxPrice - minPrice;

    const candleWidth = Math.max(1, chartWidth / candles.length - gap);

    const getX = (index: number) => box.margin.left + index * (candleWidth + gap);
    const getY = (price: number) => {
      const normalized = (price - minPrice) / priceRange;
      const clamped = Math.max(-0.08, Math.min(1.08, normalized));
      return box.margin.top + chartHeight - clamped * chartHeight;
    };
    const getVolumeY = (volume: number) =>
        box.margin.top + chartHeight - (volume / maxVolume) * chartHeight * volumeRatio;

    const getPrice = (y: number) => {
        const relativeY = chartHeight - (y - box.margin.top);
        return minPrice + (relativeY / chartHeight) * priceRange;
    };

    // Calculate time labels (6-8 labels)
    const timeLabels: { x: number; label: string }[] = [];
    const step = Math.max(1, Math.floor(candles.length / 6));
    for (let i = 0; i < candles.length; i += step) {
        const c = candles[i];
        if (!c) continue;
        const date = new Date(c.ts || Date.now());
        const label = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        timeLabels.push({ x: getX(i) + candleWidth / 2, label });
    }

    return {
      minPrice,
      maxPrice,
      priceRange,
      maxVolume,
      candleWidth,
      chartWidth,
      chartHeight,
      getX,
      getY,
      getVolumeY,
      getPrice,
      timeLabels,
    };
  }, [candles, box.width, box.height, box.margin.top, box.margin.bottom, box.margin.left, box.margin.right, gap, volumeRatio]);
};
