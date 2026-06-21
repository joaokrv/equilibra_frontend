import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const AUTH_STORAGE_KEY = 'equilibra-auth';

if (typeof window !== 'undefined') {
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
}

export interface User {
  id: number;
  nome: string;
  email: string;
  isEmailVerificado: boolean;
  celular?: string;
  moeda?: 'BRL' | 'USD' | 'EUR';
  notificacoesFaturaAtivo?: boolean;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setAuth: (user: User) => void;
  updateIsEmailVerificado: (verificado: boolean) => void;
  updateProfile: (profileData: Partial<User>) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      setAuth: (user) =>
        set({ user, isAuthenticated: true }),
      updateIsEmailVerificado: (verificado) =>
        set((state) => ({
          user: state.user ? { ...state.user, isEmailVerificado: verificado } : null,
        })),
      updateProfile: (profileData) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...profileData } : null,
        })),
      logout: () =>
        set({
          user: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: AUTH_STORAGE_KEY,
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
