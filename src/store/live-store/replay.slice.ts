import { StateCreator } from 'zustand';

export type ReplayStatus = 'PLAYING' | 'PAUSED' | 'IDLE' | 'COMPLETED';

export interface ReplaySlice {
  mode: 'LIVE' | 'REPLAY';
  status: ReplayStatus;
  speed: number;
  cursor: number;
  progress: number;
  totalEvents: number;

  setReplayMode: (mode: 'LIVE' | 'REPLAY') => void;
  setReplayStatus: (status: ReplayStatus) => void;
  setReplaySpeed: (speed: number) => void;
  setReplayCursor: (cursor: number) => void;
  setReplayTotalEvents: (totalEvents: number) => void;
  setReplayProgress: (progress: number) => void;
  /** Mark replay as completed (reached end of timeline) */
  setReplayCompleted: () => void;
  resetReplay: () => void;
}

const VALID_SPEEDS = [0.5, 1, 5, 10, 100] as const;
const DEFAULT_SPEED = 1;

export const createReplaySlice: StateCreator<ReplaySlice> = (set, get) => ({
  mode: 'LIVE',
  status: 'IDLE',
  speed: DEFAULT_SPEED,
  cursor: 0,
  progress: 0,
  totalEvents: 0,

  setReplayMode: (mode) => set({ mode }),
  setReplayStatus: (status) => set({ status }),
  setReplaySpeed: (speed) => {
    // Validate: must be positive and one of the allowed speeds
    if (speed <= 0 || !Number.isFinite(speed)) {
      console.warn(`[Replay] Invalid speed ${speed}, must be a positive finite number`);
      return;
    }
    // Clamp to nearest valid speed
    const closest = VALID_SPEEDS.reduce((prev, curr) =>
      Math.abs(curr - speed) < Math.abs(prev - speed) ? curr : prev
    );
    set({ speed: closest });
  },
  setReplayCursor: (cursor) =>
    set((state) => {
      const safeCursor = Math.max(0, Math.floor(cursor));
      const safeTotal = Math.max(state.totalEvents, 0);
      const progress = safeTotal > 1 ? Math.min(1, safeCursor / (safeTotal - 1)) : 0;
      return { cursor: safeCursor, progress };
    }),
  setReplayTotalEvents: (totalEvents) =>
    set((state) => {
      const safeTotal = Math.max(0, Math.floor(totalEvents));
      const safeCursor = safeTotal > 0 ? Math.min(state.cursor, safeTotal - 1) : 0;
      const progress = safeTotal > 1 ? Math.min(1, safeCursor / (safeTotal - 1)) : 0;
      return { totalEvents: safeTotal, cursor: safeCursor, progress };
    }),
  setReplayProgress: (progress) => {
    // Auto-complete when progress reaches 100%
    const newProgress = Math.min(1, Math.max(0, progress));
    const totalEvents = get().totalEvents;
    const cursor = totalEvents > 1 ? Math.round(newProgress * (totalEvents - 1)) : 0;
    if (newProgress >= 1) {
      set({ progress: 1, cursor, status: 'COMPLETED' });
    } else {
      set({ progress: newProgress, cursor });
    }
  },
  setReplayCompleted: () => set((state) => ({
    cursor: state.totalEvents > 0 ? state.totalEvents - 1 : 0,
    progress: 1,
    status: 'COMPLETED',
  })),
  resetReplay: () => set({ mode: 'LIVE', status: 'IDLE', speed: DEFAULT_SPEED, cursor: 0, progress: 0 }),
});
