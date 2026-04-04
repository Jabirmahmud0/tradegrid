import { StateCreator } from 'zustand';
import { CandleInterval } from '../../types';

export interface LayoutSlice {
  activeSymbol: string;
  activeInterval: CandleInterval;
  sidebarOpen: boolean;
  activeTab: 'dashboard' | 'analytics' | 'replay' | 'status' | 'data';
  systemReady: boolean;
  setActiveSymbol: (symbol: string) => void;
  setActiveInterval: (interval: CandleInterval) => void;
  toggleSidebar: () => void;
  setActiveTab: (tab: 'dashboard' | 'analytics' | 'replay' | 'status' | 'data') => void;
  setSystemReady: (ready: boolean) => void;
}

export const createLayoutSlice: StateCreator<LayoutSlice, [], [], LayoutSlice> = (set) => ({
  activeSymbol: 'BTC-USD',
  activeInterval: '1m',
  sidebarOpen: true,
  activeTab: 'dashboard',
  systemReady: false,
  setActiveSymbol: (symbol: string) => set({ activeSymbol: symbol }),
  setActiveInterval: (interval: CandleInterval) => set({ activeInterval: interval }),
  toggleSidebar: () => set((state: LayoutSlice) => ({ sidebarOpen: !state.sidebarOpen })),
  setActiveTab: (tab: 'dashboard' | 'analytics' | 'replay' | 'status' | 'data') => set({ activeTab: tab }),
  setSystemReady: (ready: boolean) => set({ systemReady: ready }),
});
