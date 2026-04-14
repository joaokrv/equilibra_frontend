import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface PrivacyState {
  hideValues: boolean;
  toggleHideValues: () => void;
  setHideValues: (hideValues: boolean) => void;
}

export const usePrivacyStore = create<PrivacyState>()(
  persist(
    (set) => ({
      hideValues: false,
      toggleHideValues: () => set((state) => ({ hideValues: !state.hideValues })),
      setHideValues: (hideValues) => set({ hideValues }),
    }),
    {
      name: 'equilibra-privacy',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        hideValues: state.hideValues,
      }),
    },
  ),
);
