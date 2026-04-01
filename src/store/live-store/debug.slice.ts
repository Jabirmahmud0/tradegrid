import { StateCreator } from 'zustand';

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

export interface DebugSlice {
  metrics: PerformanceMetrics;
  setMetrics: (metrics: Partial<PerformanceMetrics>) => void;
}

export const createDebugSlice: StateCreator<DebugSlice, [], [], DebugSlice> = (set) => ({
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
  setMetrics: (newMetrics: Partial<PerformanceMetrics>) =>
    set((state: DebugSlice) => ({
      metrics: {
        ...state.metrics,
        ...newMetrics,
      },
    })),
});
