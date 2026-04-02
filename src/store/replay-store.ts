import { create } from 'zustand';
import { ReplayState } from '../types';

interface ReplayActions {
    setReplaying: (val: boolean) => void;
    setPaused: (val: boolean) => void;
    setSpeed: (val: number) => void;
    setProgress: (val: number) => void;
    setCurrentTime: (val: number) => void;
    reset: () => void;
}

export const useReplayStore = create<ReplayState & ReplayActions>((set) => ({
    isReplaying: false,
    isPaused: false,
    speed: 1.0,
    currentTime: 0,
    progress: 0,

    setReplaying: (isReplaying) => set({ isReplaying }),
    setPaused: (isPaused) => set({ isPaused }),
    setSpeed: (speed) => set({ speed }),
    setProgress: (progress) => set({ progress }),
    setCurrentTime: (currentTime) => set({ currentTime }),
    reset: () => set({ 
        isReplaying: false, 
        isPaused: false, 
        speed: 1.0, 
        currentTime: 0, 
        progress: 0 
    })
}));
