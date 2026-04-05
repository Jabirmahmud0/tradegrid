import { StateCreator } from 'zustand';
import { CandleInterval } from '../../types';

export type DataSourceType = 'mock' | 'binance' | 'binance-testnet' | 'custom';

const STORAGE_KEY = 'tradegrid-dataSource';

function getInitialDataSource(): DataSourceType {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'mock' || stored === 'binance' || stored === 'binance-testnet' || stored === 'custom') {
      return stored;
    }
  } catch {}
  return 'mock';
}

export interface LayoutSlice {
  activeSymbol: string;
  activeInterval: CandleInterval;
  sidebarOpen: boolean;
  activeTab: 'dashboard' | 'analytics' | 'replay' | 'status' | 'data';
  dataSource: DataSourceType;
  systemReady: boolean;
  setActiveSymbol: (symbol: string) => void;
  setActiveInterval: (interval: CandleInterval) => void;
  toggleSidebar: () => void;
  setActiveTab: (tab: 'dashboard' | 'analytics' | 'replay' | 'status' | 'data') => void;
  setDataSource: (source: DataSourceType) => void;
  setSystemReady: (ready: boolean) => void;
}

export const createLayoutSlice: StateCreator<LayoutSlice, [], [], LayoutSlice> = (set) => ({
  activeSymbol: 'BTC-USD',
  activeInterval: '1m',
  sidebarOpen: true,
  activeTab: 'dashboard',
  dataSource: getInitialDataSource(),
  systemReady: false,
  setActiveSymbol: (symbol: string) => set({ activeSymbol: symbol }),
  setActiveInterval: (interval: CandleInterval) => set({ activeInterval: interval }),
  toggleSidebar: () => set((state: LayoutSlice) => ({ sidebarOpen: !state.sidebarOpen })),
  setActiveTab: (tab: 'dashboard' | 'analytics' | 'replay' | 'status' | 'data') => set({ activeTab: tab }),
  setDataSource: (source: DataSourceType) => {
    try {
      localStorage.setItem(STORAGE_KEY, source);
    } catch {}
    set({ dataSource: source });
  },
  setSystemReady: (ready: boolean) => set({ systemReady: ready }),
});
