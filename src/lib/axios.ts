import axios from 'axios';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/useAuthStore';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

/**
 * Instância Axios centralizada para toda a aplicação.
 *
 * Responsabilidades:
 * - Injetar token JWT em cada request
 * - Renovar access token silenciosamente via refresh token (interceptor 401)
 * - Fazer logout e redirecionar quando todas as tentativas falharem
 */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Flag para evitar múltiplos refreshes simultâneos ────────────────
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

/**
 * Processa a fila de requests que falharam durante o refresh.
 */
const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token!);
    }
  });
  failedQueue = [];
};

// ─── Interceptor de Request: Injetar token JWT ──────────────────────
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ─── Interceptor de Response: Refresh silencioso em 401 ─────────────
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Se não é 401 ou já tentamos retry, rejeitar normalmente
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Ignorar refresh para rotas de autenticação (evita loop infinito)
    const url = originalRequest.url || '';
    if (url.includes('/api/auth/login') || url.includes('/api/auth/refresh')) {
      return Promise.reject(error);
    }

    // Se já está refreshando, enfileirar esta request
    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return apiClient(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    const refreshToken = useAuthStore.getState().refreshToken;

    if (!refreshToken) {
      // Sem refresh token, fazer logout direto
      isRefreshing = false;
      useAuthStore.getState().logout();
      window.location.href = '/login';
      return Promise.reject(error);
    }

    try {
      // Chamar endpoint de refresh do backend
      const { data } = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {
        refreshToken,
      });

      const newAccessToken = data.accessToken;
      const newRefreshToken = data.refreshToken;

      // Atualizar store com novos tokens
      const currentUser = useAuthStore.getState().user;
      if (currentUser && newAccessToken) {
        useAuthStore.getState().setAuth(
          currentUser,
          newAccessToken,
          newRefreshToken || refreshToken,
        );
      }

      // Processar fila de requests pendentes com o novo token
      processQueue(null, newAccessToken);

      // Re-executar request original com novo token
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      // Refresh falhou — sessão expirada, fazer logout
      processQueue(refreshError, null);
      useAuthStore.getState().logout();
      window.location.href = '/login';
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default apiClient;
