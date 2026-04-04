import { StateCreator } from 'zustand';

export type ReplayStatus = 'PLAYING' | 'PAUSED' | 'IDLE';

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
  resetReplay: () => void;
}

export const createReplaySlice: StateCreator<ReplaySlice> = (set) => ({
  mode: 'LIVE',
  status: 'IDLE',
  speed: 1,
  cursor: 0,
  progress: 0,

  setReplayMode: (mode) => set({ mode }),
  setReplayStatus: (status) => set({ status }),
  setReplaySpeed: (speed) => set({ speed }),
  setReplayCursor: (cursor) => set({ cursor }),
  setReplayProgress: (progress) => set({ progress }),
  resetReplay: () => set({ mode: 'LIVE', status: 'IDLE', speed: 1, cursor: 0, progress: 0 }),
});
