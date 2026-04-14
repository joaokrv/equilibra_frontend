import apiClient from './axios';
import { TransacaoResponseDTO } from '../api/models/TransacaoResponseDTO';

export type DashboardPeriodo = '1M' | '3M' | '6M' | '1A';

export interface DashboardResumoPeriodoResponse {
  periodo: DashboardPeriodo;
  inicioPeriodoAtual: string;
  fimPeriodoAtual: string;
  inicioPeriodoAnterior: string;
  fimPeriodoAnterior: string;
  totalReceitasAtual: number;
  totalReceitasAnterior: number;
  totalReceitasPendentesAtual: number;
  variacaoReceitasPercentual: number | null;
  totalDespesasAtual: number;
  totalDespesasAnterior: number;
  totalDespesasPendentesAtual: number;
  variacaoDespesasPercentual: number | null;
  saldoContasAtual: number;
  totalInvestidoAtual: number;
  variacaoSaldoContasPercentual: number | null;
  variacaoInvestimentosPercentual: number | null;
}

export const dashboardApi = {
  async obterResumoPorPeriodo(periodo: DashboardPeriodo): Promise<DashboardResumoPeriodoResponse> {
    const { data } = await apiClient.get<DashboardResumoPeriodoResponse>('/api/dashboard/resumo', {
      params: { periodo },
    });

    return data;
  },

  async listarPorIntervalo(dataInicio: string, dataFim: string): Promise<TransacaoResponseDTO[]> {
    const { data } = await apiClient.get<TransacaoResponseDTO[]>('/api/transacoes/intervalo', {
      params: { dataInicio, dataFim },
    });

    return data;
  },
};
