import { StreamEvent } from '../../types';

export type MainThreadMessage = 
  | { type: 'CONNECT'; payload: { url: string } }
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
  | { type: 'CONNECTED' }
  | { type: 'DISCONNECTED' }
  | { type: 'BATCH_DATA'; payload: StreamEvent[] }
  | { type: 'ERROR'; payload: { message: string; code?: string } }
  | { type: 'STATUS'; payload: { latency: number; connected: boolean } }
  | { type: 'CONTROL'; payload: { type: 'pong' | 'scenario-set' | 'replay-ack' } };
