import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface TutorialState {
  isCompleted: boolean;
  markCompleted: () => void;
  resetTutorial: () => void;
}

export const useTutorialStore = create<TutorialState>()(
  persist(
    (set) => ({
      isCompleted: false,
      markCompleted: () => set({ isCompleted: true }),
      resetTutorial: () => set({ isCompleted: false }),
    }),
    {
      name: 'equilibra-tutorial',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        isCompleted: state.isCompleted,
      }),
    },
  ),
);