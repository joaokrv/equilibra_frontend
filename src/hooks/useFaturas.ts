import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FaturasService } from '../api/services/FaturasService';
import { PagarFaturaRequestDTO } from '../api/models/PagarFaturaRequestDTO';
import { TransacoesService } from '../api/services/TransacoesService';
import { invalidateFaturaQueries } from '../lib/queryInvalidation';

export function useFaturasPorCartao(cartaoId: number | null) {
  return useQuery({
    queryKey: ['faturas', cartaoId],
    queryFn: () => FaturasService.listarFaturasPorCartao(cartaoId!),
    enabled: !!cartaoId,
  });
}

export function useFaturaDetalhes(faturaId: number | null) {
  return useQuery({
    queryKey: ['fatura', faturaId],
    queryFn: () => FaturasService.buscarPorId1(faturaId!),
    enabled: !!faturaId,
  });
}

export function useTransacoesPorFatura(faturaId: number | null) {
  return useQuery({
    queryKey: ['transacoes', 'fatura', faturaId],
    queryFn: () => TransacoesService.listarPorFatura(faturaId!),
    enabled: !!faturaId,
  });
}

export function usePagarFatura() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: PagarFaturaRequestDTO }) =>
      FaturasService.pagarFatura(id, body),
    onSuccess: () => {
      invalidateFaturaQueries(qc);
    },
  });
}
