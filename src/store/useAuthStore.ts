import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const AUTH_STORAGE_KEY = 'equilibra-auth';

// Remove vestígios antigos de auth no localStorage para manter sessão privada por aba.
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
  fotoBase64?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  updateIsEmailVerificado: (verificado: boolean) => void;
  updateProfile: (profileData: Partial<User>) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setAuth: (user, token) =>
        set({ user, token, isAuthenticated: true }),
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
          token: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: AUTH_STORAGE_KEY,
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        // AT não persiste — reload dispara refresh silencioso via cookie HttpOnly (AR-02)
        // RT nunca persiste — vive apenas no cookie HttpOnly (G5-A1)
      }),
    },
  ),
);
