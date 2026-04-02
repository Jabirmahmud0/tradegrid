import { StateCreator } from 'zustand';
import { RingBuffer } from '../../lib/ring-buffer';
import { RETENTION_POLICIES } from '../../lib/retention';

export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  droppedFrames: number;
  queueDepth: number;
  eventsPerSec: number;
  workerDecodeTime: number;
  dispatchLatency: number;
  memoryEstimate: number;
}

export interface DebugEvent {
  ts: number;
  message: string;
  level: 'info' | 'warn' | 'error';
}

export interface DebugSlice {
  metrics: PerformanceMetrics;
  eventLog: DebugEvent[];
  setMetrics: (metrics: Partial<PerformanceMetrics>) => void;
  addDebugEvent: (event: DebugEvent) => void;
}

export const createDebugSlice: StateCreator<DebugSlice, [], [], DebugSlice> = (set) => {
  const eventBuffer = new RingBuffer<DebugEvent>(RETENTION_POLICIES.DEBUG_LOG);

  return {
    metrics: {
      fps: 0,
      frameTime: 0,
      droppedFrames: 0,
      queueDepth: 0,
      eventsPerSec: 0,
      workerDecodeTime: 0,
      dispatchLatency: 0,
      memoryEstimate: 0,
    },
    eventLog: [],
    setMetrics: (newMetrics: Partial<PerformanceMetrics>) =>
      set((state: DebugSlice) => ({
        metrics: {
          ...state.metrics,
          ...newMetrics,
        },
      })),
    addDebugEvent: (event: DebugEvent) => {
      eventBuffer.push(event);
      set({ eventLog: eventBuffer.toArray().reverse() });
    },
  };
};
