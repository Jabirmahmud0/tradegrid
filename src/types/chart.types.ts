import type { ScaleTime, ScaleLinear } from 'd3-scale';

export interface OHLCDataPoint {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface ChartDimensions {
  width: number;
  height: number;
  margin: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

export interface ChartScale {
  x: ScaleTime<number, number>;
  y: ScaleLinear<number, number>;
  volumeY: ScaleLinear<number, number>;
  price: ScaleLinear<number, number>;
}

export interface CrosshairPosition {
  x: number | null;
  y: number | null;
  dataPoint?: OHLCDataPoint;
}

export interface ZoomState {
  scale: number;
  offset: number;
}

export interface HeatmapCell {
  id: string;
  value: number;
  color: string;
  label: string;
}
