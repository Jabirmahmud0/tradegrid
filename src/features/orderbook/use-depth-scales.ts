import { useMemo } from 'react';
import * as d3 from 'd3';
import { OrderBookLevel } from '../../store/live-store/orderbook.slice';

export interface DepthScales {
  x: d3.ScaleLinear<number, number>;
  y: d3.ScaleLinear<number, number>;
  width: number;
  height: number;
  margin: { top: number; right: number; bottom: number; left: number };
  chartWidth: number;
  chartHeight: number;
}

export const useDepthScales = (
  bids: OrderBookLevel[],
  asks: OrderBookLevel[],
  width: number,
  height: number
): DepthScales => {
  const margin = { top: 20, right: 60, bottom: 30, left: 20 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  return useMemo(() => {
    if (bids.length === 0 || asks.length === 0) {
      return {
        x: d3.scaleLinear(),
        y: d3.scaleLinear(),
        width,
        height,
        margin,
        chartWidth,
        chartHeight,
      };
    }

    const allPrices = [...bids, ...asks].map((d) => d.price);
    const priceDomain = [d3.min(allPrices) || 0, d3.max(allPrices) || 0];
    
    const maxTotal = d3.max([...bids, ...asks].map((d) => d.total)) || 0;

    const x = d3.scaleLinear().domain(priceDomain).range([margin.left, margin.left + chartWidth]);
    const y = d3.scaleLinear().domain([0, maxTotal * 1.1]).range([margin.top + chartHeight, margin.top]);

    return {
      x,
      y,
      width,
      height,
      margin,
      chartWidth,
      chartHeight,
    };
  }, [bids, asks, width, height, chartWidth, chartHeight]);
};
