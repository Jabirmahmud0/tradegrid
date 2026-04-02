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
}

export const useCandlestickScales = (
  candles: NormalizedCandle[],
  box: Box,
  gap: number = 2,
  volumeRatio: number = 0.2
): CandlestickScales => {
  return useMemo(() => {
    const chartWidth = box.width - box.margin.left - box.margin.right;
    const chartHeight = box.height - box.margin.top - box.margin.bottom;

    let minPrice = Infinity;
    let maxPrice = -Infinity;
    let maxVolume = 0;

    candles.forEach((c) => {
      if (c.h > maxPrice) maxPrice = c.h;
      if (c.l < minPrice) minPrice = c.l;
      if (c.v > maxVolume) maxVolume = c.v;
    });

    if (candles.length === 0) {
      return {
        minPrice: 0,
        maxPrice: 100,
        priceRange: 100,
        maxVolume: 0,
        candleWidth: 0,
        chartWidth,
        chartHeight,
        getX: () => 0,
        getY: () => 0,
        getVolumeY: () => 0,
        getPrice: () => 0,
      };
    }

    const pricePadding = (maxPrice - minPrice) * 0.1 || 1;
    maxPrice += pricePadding;
    minPrice -= pricePadding;
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
    };
  }, [candles, box.width, box.height, box.margin.top, box.margin.bottom, box.margin.left, box.margin.right, gap, volumeRatio]);
};
