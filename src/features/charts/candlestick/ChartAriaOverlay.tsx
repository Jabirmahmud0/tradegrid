import React from 'react';
import { NormalizedCandle } from '../../../types';

interface ChartAriaOverlayProps {
  candles: NormalizedCandle[];
  symbol: string;
  interval: string;
}

export const ChartAriaOverlay: React.FC<ChartAriaOverlayProps> = ({ candles, symbol, interval }) => {
  if (candles.length === 0) return null;
  
  const latest = candles[candles.length - 1];
  const first = candles[0];
  const change = ((latest.c - first.o) / first.o) * 100;

  return (
    <div 
        role="graphics-document" 
        aria-label={`Candlestick chart for ${symbol} at ${interval} interval.`}
        className="sr-only"
    >
      <p>
        Currently displaying {candles.length} periods. 
        Opening price at {new Date(first.ts).toLocaleString()} was {first.o.toFixed(2)}.
        Latest closing price is {latest.c.toFixed(2)}, a {change.toFixed(2)}% change over the visible period.
      </p>
      <table>
          <caption>Recent Price Data</caption>
          <thead>
              <tr>
                  <th>Time</th>
                  <th>Open</th>
                  <th>High</th>
                  <th>Low</th>
                  <th>Close</th>
              </tr>
          </thead>
          <tbody>
              {candles.slice(-10).map((c, i) => (
                  <tr key={i}>
                      <td>{new Date(c.ts).toLocaleTimeString()}</td>
                      <td>{c.o.toFixed(2)}</td>
                      <td>{c.h.toFixed(2)}</td>
                      <td>{c.l.toFixed(2)}</td>
                      <td>{c.c.toFixed(2)}</td>
                  </tr>
              ))}
          </tbody>
      </table>
    </div>
  );
};
