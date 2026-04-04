import { StreamEvent } from '../../types';

export interface ReconnectOptions {
  endpoints?: string[];
}

export type MainThreadMessage =
  | { type: 'CONNECT'; payload: { url: string; reconnectOptions?: ReconnectOptions } }
  | { type: 'DISCONNECT' }
  | { type: 'SUBSCRIBE'; payload: { symbols: string[] } }
  | { type: 'UNSUBSCRIBE'; payload: { symbols: string[] } }
  | { type: 'CONTROL_COMMAND'; payload: ControlCommand };

export type ControlCommand = 
  | { type: 'ping' }
  | { type: 'set-scenario'; mode: 'NORMAL' | 'BURST' | 'FAILURE' }
  | { type: 'replay-start'; speed: number }
  | { type: 'replay-stop' }
  | { type: 'replay-seek'; index: number };

export type WorkerMessage = 
  | { type: 'CONNECTED'; payload?: { sourceType: string } }
  | { type: 'DISCONNECTED' }
  | { type: 'BATCH_DATA'; payload: StreamEvent[]; metrics?: { decodeTime: number; ingestionTime: number } }
  | { type: 'ERROR'; payload: { message: string; url?: string; errorType?: string; isTrusted?: boolean } }
  | { type: 'STATUS'; payload: { latency: number; connected: boolean } }
  | { type: 'CONTROL'; payload: any };
