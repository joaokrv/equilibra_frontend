const normalizeBaseUrl = (url: string): string => url.replace(/\/+$/, '');

const apiBaseUrlFromEnv = (import.meta.env.VITE_API_BASE_URL || '').trim();
const frontendOrigin = (import.meta.env.VITE_FRONTEND_ORIGIN || '').trim();

if (import.meta.env.PROD && !apiBaseUrlFromEnv) {
  throw new Error(
    'VITE_API_BASE_URL nao foi configurada no ambiente de producao. Configure essa variavel no Vercel antes do deploy.',
  );
}

const normalizedApiBaseUrl = apiBaseUrlFromEnv
  ? normalizeBaseUrl(apiBaseUrlFromEnv)
  : '';

if (import.meta.env.PROD && normalizedApiBaseUrl) {
  const normalizedFrontendOrigin = frontendOrigin
    ? normalizeBaseUrl(frontendOrigin)
    : '';  if (normalizedFrontendOrigin && normalizedApiBaseUrl === normalizedFrontendOrigin) {
    throw new Error(
      'Configuracao invalida: VITE_API_BASE_URL aponta para o mesmo dominio do frontend. Defina a URL do backend (ex: Render).',
    );
  }

  if (normalizedApiBaseUrl.includes('equilibra-frontend.vercel.app')) {
    throw new Error(
      'Configuracao invalida: VITE_API_BASE_URL nao pode apontar para equilibra-frontend.vercel.app. Use a URL publica do backend.',
    );
  }  if (!normalizedApiBaseUrl.startsWith('https://')) {
    throw new Error(
      'Configuracao invalida: VITE_API_BASE_URL deve usar HTTPS em producao. URL atual: ' + normalizedApiBaseUrl,
    );
  }
}

export const API_BASE_URL = normalizedApiBaseUrl;
