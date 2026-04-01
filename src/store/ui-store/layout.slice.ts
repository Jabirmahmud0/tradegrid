import { StateCreator } from 'zustand';
import { CandleInterval } from '../../types';

export interface LayoutSlice {
  activeSymbol: string;
  activeInterval: CandleInterval;
  sidebarOpen: boolean;
  activeTab: 'symbol' | 'scenarios';
  setActiveSymbol: (symbol: string) => void;
  setActiveInterval: (interval: CandleInterval) => void;
  toggleSidebar: () => void;
  setActiveTab: (tab: 'symbol' | 'scenarios') => void;
}

export const createLayoutSlice: StateCreator<LayoutSlice> = (set) => ({
  activeSymbol: 'BTC-USD',
  activeInterval: '1m',
  sidebarOpen: true,
  activeTab: 'symbol',
  setActiveSymbol: (symbol) => set({ activeSymbol: symbol }),
  setActiveInterval: (interval) => set({ activeInterval: interval }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setActiveTab: (tab) => set({ activeTab: tab }),
});
