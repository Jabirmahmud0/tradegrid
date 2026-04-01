import { StateCreator } from 'zustand';
import { ReplayState } from '../../types';

export interface ReplaySlice extends ReplayState {
  setReplayMode: (enabled: boolean) => void;
  setPause: (paused: boolean) => void;
  setSpeed: (speed: number) => void;
  setScrubProgress: (progress: number) => void;
}

export const createReplaySlice: StateCreator<ReplaySlice> = (set) => ({
  isReplaying: false,
  isPaused: false,
  speed: 1,
  currentTime: 0,
  progress: 0,
  setReplayMode: (enabled) => set({ isReplaying: enabled }),
  setPause: (paused) => set({ isPaused: paused }),
  setSpeed: (speed) => set({ speed }),
  setScrubProgress: (progress) => set({ progress }),
});
