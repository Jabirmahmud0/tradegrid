import { StateCreator } from 'zustand';

export type Theme = 'dark' | 'high-contrast';

const STORAGE_KEY = 'tradegrid-theme';

function getInitialTheme(): Theme {
  // 1. Check localStorage
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'dark' || stored === 'high-contrast') {
      return stored;
    }
    // 2. Detect system preference
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
  }
  // 3. Fallback
  return 'dark';
}

export interface ThemeSlice {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

export const createThemeSlice: StateCreator<ThemeSlice, [], [], ThemeSlice> = (set) => ({
  theme: getInitialTheme(),
  setTheme: (theme: Theme) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, theme);
    }
    set({ theme });
  },
  toggleTheme: () => set((state: ThemeSlice) => {
    const newTheme = state.theme === 'dark' ? 'high-contrast' : 'dark';
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, newTheme);
    }
    return { theme: newTheme };
  }),
});
