// eslint-disable-next-line no-restricted-imports
import axios from 'axios';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/useAuthStore';
import { API_BASE_URL } from './apiBaseUrl';
import { toast } from '../store/useToastStore';

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
  withCredentials: true,
});

// ─── Flag para evitar múltiplos refreshes simultâneos ────────────────
let isRefreshing = false;
let coldStartToastShown = false;
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
    // ─── Tratamento de Cold Start (Render) ────────────────
    const isNetworkError = error.message === 'Network Error' || error.code === 'ECONNABORTED';
    const isBadGateway = error.response?.status === 502 || error.response?.status === 504 || error.response?.status === 503;
    
    if (isNetworkError || isBadGateway) {
      if (!coldStartToastShown) {
        coldStartToastShown = true;
        toast.warning('Servidor em inicialização. Tente novamente em 3 a 5 minutos.', 10000);
        
        // Reseta a flag após 1 minuto para caso o usuário tente novamente depois
        setTimeout(() => {
          coldStartToastShown = false;
        }, 60000);
      }
      return Promise.reject(error);
    }

    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }
    const url = originalRequest.url || '';
    if (url.includes('/api/auth/login') || url.includes('/api/auth/refresh') || url.includes('/api/auth/logout')) {
      return Promise.reject(error);
    }
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
      const { data } = await axios.post(
        `${API_BASE_URL}/api/auth/refresh`,
        {},
        { withCredentials: true },
      );

      const newAccessToken = data.accessToken;
      const currentUser = useAuthStore.getState().user;
      if (currentUser && newAccessToken) {
        useAuthStore.getState().setAuth(currentUser, newAccessToken);
      }
      processQueue(null, newAccessToken);
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      window.dispatchEvent(new CustomEvent('auth:force-logout'));
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default apiClient;
