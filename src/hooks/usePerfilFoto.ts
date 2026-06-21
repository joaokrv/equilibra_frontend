import { useQuery } from '@tanstack/react-query';
import { PerfilService } from '../api/services/PerfilService';
import { useAuthStore } from '../store/useAuthStore';

/**
 * Foto de perfil buscada uma única vez por sessão (staleTime infinito) e fora do
 * sessionStorage. Substitui o fotoBase64 que vinha embutido no perfil a cada poll
 * de 30s. Retorna a data URI pronta para `<img src>`, ou null se não houver foto.
 */
export function usePerfilFoto(): string | null {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const { data } = useQuery({
    queryKey: ['perfil-foto'],
    queryFn: () => PerfilService.obterFoto(),
    enabled: isAuthenticated,
    staleTime: Infinity,
    retry: false,
  });

  if (!data?.fotoBase64) return null;
  return `data:${data.contentType ?? 'image/png'};base64,${data.fotoBase64}`;
}
