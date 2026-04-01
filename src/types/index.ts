export * from './stream.types';
export * from './chart.types';

export type RequestStatus = 'idle' | 'loading' | 'success' | 'error';
export type ConnectionStatus = 'connected' | 'reconnecting' | 'disconnected';

export interface Instrument {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  name: string;
}

export interface ReplayState {
  isReplaying: boolean;
  isPaused: boolean;
  speed: number;
  currentTime: number;
  progress: number;
}
