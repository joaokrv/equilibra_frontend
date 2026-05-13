// eslint-disable-next-line no-restricted-imports
import axios from 'axios';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/useAuthStore';
import { API_BASE_URL } from './apiBaseUrl';

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
  // Necessário para enviar/receber o cookie HttpOnly do refresh token (G5-A1)
  withCredentials: true,
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
    if (url.includes('/api/auth/login') || url.includes('/api/auth/refresh') || url.includes('/api/auth/logout')) {
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

    try {
      // RT enviado automaticamente via cookie HttpOnly (withCredentials=true)
      const { data } = await axios.post(
        `${API_BASE_URL}/api/auth/refresh`,
        {},
        { withCredentials: true },
      );

      const newAccessToken = data.accessToken;

      // Atualizar store com novo access token
      const currentUser = useAuthStore.getState().user;
      if (currentUser && newAccessToken) {
        useAuthStore.getState().setAuth(currentUser, newAccessToken);
      }

      // Processar fila de requests pendentes com o novo token
      processQueue(null, newAccessToken);

      // Re-executar request original com novo token
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      // Refresh falhou — sessão expirada; CustomEvent desacopla do router (G10.1)
      processQueue(refreshError, null);
      window.dispatchEvent(new CustomEvent('auth:force-logout'));
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default apiClient;
