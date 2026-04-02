import { NormalizedCandle } from '../types';

export interface IndicatorValue {
  timestamp: number;
  value: number;
}

/**
 * Calculates Simple Moving Average
 */
export const calculateSMA = (candles: NormalizedCandle[], period: number): number[] => {
  const sma: number[] = [];
  for (let i = 0; i < candles.length; i++) {
    if (i < period - 1) {
      sma.push(NaN);
      continue;
    }
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += candles[i - j].c;
    }
    sma.push(sum / period);
  }
  return sma;
};

/**
 * Calculates Exponential Moving Average
 */
export const calculateEMA = (candles: NormalizedCandle[], period: number): number[] => {
  const ema: number[] = [];
  const k = 2 / (period + 1);
  let prevEMA = candles[0].c;
  
  for (let i = 0; i < candles.length; i++) {
    const currentClose = candles[i].c;
    const currentEMA = i === 0 ? currentClose : (currentClose - prevEMA) * k + prevEMA;
    ema.push(currentEMA);
    prevEMA = currentEMA;
  }
  return ema;
};
