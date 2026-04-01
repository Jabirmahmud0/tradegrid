import { StateCreator } from 'zustand';

export type ReplayStatus = 'PLAYING' | 'PAUSED' | 'IDLE';

export interface ReplaySlice {
  mode: 'LIVE' | 'REPLAY';
  status: ReplayStatus;
  speed: number;
  cursor: number;
  
  setReplayMode: (mode: 'LIVE' | 'REPLAY') => void;
  setReplayStatus: (status: ReplayStatus) => void;
  setReplaySpeed: (speed: number) => void;
  setReplayCursor: (cursor: number) => void;
}

export const createReplaySlice: StateCreator<ReplaySlice> = (set) => ({
  mode: 'LIVE',
  status: 'IDLE',
  speed: 1,
  cursor: 0,

  setReplayMode: (mode) => set({ mode }),
  setReplayStatus: (status) => set({ status }),
  setReplaySpeed: (speed) => set({ speed }),
  setReplayCursor: (cursor) => set({ cursor }),
});
