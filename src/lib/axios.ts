// eslint-disable-next-line no-restricted-imports -- este é o ÚNICO ponto autorizado a importar axios cru (instância central + refresh)
import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/useAuthStore';
import { API_BASE_URL } from './apiBaseUrl';
import { toast } from '../store/useToastStore';

/**
 * Instância Axios centralizada para toda a aplicação.
 *
 * Responsabilidades:
 * - Enviar tokens automaticamente via cookie httpOnly (withCredentials)
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

/**
 * Dispara o refresh do access token (cookie httpOnly). Usa axios cru, não o apiClient,
 * de propósito: evita reentrar no interceptor 401 e cair em loop de refresh. Fonte única
 * reusada pelo interceptor e pelo bootstrap de sessão (App.tsx).
 */
export const refreshSession = () =>
  axios.post(`${API_BASE_URL}/api/auth/refresh`, {}, { withCredentials: true });

let isRefreshing = false;
let coldStartToastShown = false;
let failedQueue: Array<{
  resolve: () => void;
  reject: (error: unknown) => void;
}> = [];

/**
 * Libera a fila de requests que aguardavam o refresh.
 * Com cookie httpOnly, basta sinalizar conclusão — o novo token já está no cookie.
 */
const processQueue = (error: unknown) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve();
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const isNetworkError = error.message === 'Network Error' || error.code === 'ECONNABORTED';
    const isBadGateway = error.response?.status === 502 || error.response?.status === 504 || error.response?.status === 503;

    if (isNetworkError || isBadGateway) {
      if (!coldStartToastShown) {
        coldStartToastShown = true;
        toast.warning('Servidor em inicialização. Tente novamente em 3 a 5 minutos.', 10000);

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
      return new Promise<void>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then(() => apiClient(originalRequest));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      await refreshSession();

      const currentUser = useAuthStore.getState().user;
      if (currentUser) {
        useAuthStore.getState().setAuth(currentUser);
      }
      processQueue(null);
      return apiClient(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError);
      window.dispatchEvent(new CustomEvent('auth:force-logout'));
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default apiClient;
