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

    let minPrice = Infinity;
    let maxPrice = -Infinity;
    let maxVolume = 0;

    candles.forEach((c) => {
      if (c.h > maxPrice) maxPrice = c.h;
      if (c.l < minPrice) minPrice = c.l;
      if (c.v > maxVolume) maxVolume = c.v;
    });

    // Ensure minimum price range to avoid division by zero
    const rawRange = maxPrice - minPrice;
    const pricePadding = rawRange * 0.12 || Math.max(rawRange, 1);
    const minPadding = Math.max(Math.abs(maxPrice) * 0.01, 1); // At least 1% of price or 1
    maxPrice += Math.max(pricePadding, minPadding);
    minPrice -= Math.max(pricePadding, minPadding);
    const priceRange = maxPrice - minPrice;

    const candleWidth = chartWidth / candles.length - gap;

    const getX = (index: number) => box.margin.left + index * (candleWidth + gap);
    const getY = (price: number) =>
      box.margin.top + chartHeight - ((price - minPrice) / priceRange) * chartHeight;
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
