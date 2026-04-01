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
  x: any; // D3 Time scale
  y: any; // D3 Linear scale
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
