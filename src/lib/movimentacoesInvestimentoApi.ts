import apiClient from './axios';

export type TipoMovimentacao = 'APORTE' | 'RESGATE' | 'RENDIMENTO';

export interface MovimentacaoInvestimentoItem {
  id: number;
  tipo: TipoMovimentacao;
  valor: number;
  data: string;
  descricaoInvestimento: string;
  investimentoId: number;
  nomeContaOrigem?: string;
  observacao?: string;
}

export interface PageMovimentacao {
  content: MovimentacaoInvestimentoItem[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

export interface RendimentoPayload {
  investimentoId: number;
  valor: number;
  data: string;
  observacao?: string;
}

export interface MovimentacaoAtualizacaoPayload {
  valor: number;
  data: string;
  contaId?: number;
  observacao?: string;
}

export const movimentacoesInvestimentoApi = {
  async listar(params: {
    dataInicio?: string;
    dataFim?: string;
    tipo?: TipoMovimentacao;
    investimentoId?: number;
    page?: number;
    size?: number;
  }): Promise<PageMovimentacao> {
    const { data } = await apiClient.get<PageMovimentacao>('/api/investimentos/movimentacoes', { params });
    return data;
  },

  async preview(): Promise<MovimentacaoInvestimentoItem[]> {
    const { data } = await apiClient.get<MovimentacaoInvestimentoItem[]>('/api/investimentos/movimentacoes/preview');
    return data;
  },

  async registrarRendimento(payload: RendimentoPayload): Promise<MovimentacaoInvestimentoItem> {
    const { data } = await apiClient.post<MovimentacaoInvestimentoItem>('/api/investimentos/rendimento', payload);
    return data;
  },

  async editar(movId: number, payload: MovimentacaoAtualizacaoPayload): Promise<MovimentacaoInvestimentoItem> {
    const { data } = await apiClient.put<MovimentacaoInvestimentoItem>(`/api/investimentos/movimentacoes/${movId}`, payload);
    return data;
  },

  async excluir(movId: number): Promise<void> {
    await apiClient.delete(`/api/investimentos/movimentacoes/${movId}`);
  },
};
