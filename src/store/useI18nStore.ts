import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type AppLanguage = 'pt-BR' | 'en-US';

interface I18nState {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
}

const detectInitialLanguage = (): AppLanguage => {
  if (typeof window === 'undefined') {
    return 'pt-BR';
  }

  const browserLanguage = (navigator.language || '').toLowerCase();
  return browserLanguage.startsWith('en') ? 'en-US' : 'pt-BR';
};

export const useI18nStore = create<I18nState>()(
  persist(
    (set) => ({
      language: detectInitialLanguage(),
      setLanguage: (language) => set({ language }),
    }),
    {
      name: 'equilibra-language',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
