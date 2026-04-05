import { StateCreator } from 'zustand';

export type ReplayStatus = 'PLAYING' | 'PAUSED' | 'IDLE' | 'COMPLETED';

export interface ReplaySlice {
  mode: 'LIVE' | 'REPLAY';
  status: ReplayStatus;
  speed: number;
  cursor: number;
  progress: number;

  setReplayMode: (mode: 'LIVE' | 'REPLAY') => void;
  setReplayStatus: (status: ReplayStatus) => void;
  setReplaySpeed: (speed: number) => void;
  setReplayCursor: (cursor: number) => void;
  setReplayProgress: (progress: number) => void;
  /** Mark replay as completed (reached end of timeline) */
  setReplayCompleted: () => void;
  resetReplay: () => void;
}

const VALID_SPEEDS = [0.5, 1, 5, 10, 100] as const;
const DEFAULT_SPEED = 1;

export const createReplaySlice: StateCreator<ReplaySlice> = (set) => ({
  mode: 'LIVE',
  status: 'IDLE',
  speed: DEFAULT_SPEED,
  cursor: 0,
  progress: 0,

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
  setReplayCursor: (cursor) => set({ cursor }),
  setReplayProgress: (progress) => {
    // Auto-complete when progress reaches 100%
    const newProgress = Math.min(1, Math.max(0, progress));
    if (newProgress >= 1) {
      set({ progress: 1, status: 'COMPLETED' });
    } else {
      set({ progress: newProgress });
    }
  },
  setReplayCompleted: () => set({ progress: 1, status: 'COMPLETED' }),
  resetReplay: () => set({ mode: 'LIVE', status: 'IDLE', speed: DEFAULT_SPEED, cursor: 0, progress: 0 }),
});
