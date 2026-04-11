const normalizeBaseUrl = (url: string): string => url.replace(/\/+$/, '');

const apiBaseUrlFromEnv = (import.meta.env.VITE_API_BASE_URL || '').trim();

if (import.meta.env.PROD && !apiBaseUrlFromEnv) {
  throw new Error(
    'VITE_API_BASE_URL nao foi configurada no ambiente de producao. Configure essa variavel no Vercel antes do deploy.',
  );
}

export const API_BASE_URL = apiBaseUrlFromEnv
  ? normalizeBaseUrl(apiBaseUrlFromEnv)
  : '';
