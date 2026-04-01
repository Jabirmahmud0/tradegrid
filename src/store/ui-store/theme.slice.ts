import { StateCreator } from 'zustand';

export type Theme = 'dark' | 'high-contrast';

export interface ThemeSlice {
  theme: Theme;
  systemReady: boolean;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  setSystemReady: (ready: boolean) => void;
}

export const createThemeSlice: StateCreator<ThemeSlice, [], [], ThemeSlice> = (set) => ({
  theme: 'dark',
  systemReady: false,
  setTheme: (theme: Theme) => set({ theme }),
  toggleTheme: () => set((state: ThemeSlice) => ({
    theme: state.theme === 'dark' ? 'high-contrast' : 'dark'
  })),
  setSystemReady: (ready: boolean) => set({ systemReady: ready }),
});
