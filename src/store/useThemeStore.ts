import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type AppTheme = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
}

export const resolveTheme = (theme: AppTheme): 'light' | 'dark' => {
  if (theme === 'system') {
    if (typeof window === 'undefined') return 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return theme;
};

export const applyTheme = (theme: AppTheme) => {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-theme', resolveTheme(theme));
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'system',
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'equilibra-theme',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
