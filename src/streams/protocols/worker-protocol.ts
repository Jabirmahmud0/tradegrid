import { StreamEvent } from '../../types';

export interface ReconnectOptions {
  endpoints?: string[];
}

export type DataSourceType = 'mock' | 'binance' | 'binance-testnet' | 'custom';

export type MainThreadMessage =
  | { type: 'CONNECT'; payload: { url: string; sourceType?: DataSourceType; reconnectOptions?: ReconnectOptions; symbols?: string[] } }
  | { type: 'DISCONNECT' }
  | { type: 'SUBSCRIBE'; payload: { symbols: string[] } }
  | { type: 'UNSUBSCRIBE'; payload: { symbols: string[] } }
  | { type: 'CONTROL_COMMAND'; payload: ControlCommand };

export type ControlCommand = 
  | { type: 'ping' }
  | { type: 'set-scenario'; mode: 'NORMAL' | 'BURST' | 'FAILURE' }
  | { type: 'replay-start'; speed: number; index?: number }
  | { type: 'replay-stop' }
  | { type: 'replay-seek'; index: number };

export type WorkerMessage =
  | { type: 'CONNECTED'; payload?: { sourceType: string } }
  | { type: 'DISCONNECTED' }
  | { type: 'CONNECTION_ERROR'; payload?: { sourceType: string; url: string | null } }
  | { type: 'BATCH_DATA'; payload: StreamEvent[]; metrics?: { decodeTime: number; ingestionTime: number } }
  | { type: 'ERROR'; payload: { message: string; url?: string | null; sourceType?: string } }
  | { type: 'STATUS'; payload: { latency: number; connected: boolean } }
  | { type: 'CONTROL'; payload: any };
