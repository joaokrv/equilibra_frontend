import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

export type TipoInvestimento =
  | 'CDB'
  | 'CDI'
  | 'LCI'
  | 'LCA'
  | 'POUPANCA'
  | 'TESOURO_DIRETO'
  | 'FUNDO_DI'
  | 'ACAO'
  | 'FII'
  | 'CRIPTO'
  | 'OUTRO';

export interface InvestimentoItem {
  id?: number;
  descricao?: string;
  tipoInvestimento?: TipoInvestimento;
  tipoPersonalizado?: string;
  valorInicial?: number;
  valorAtual?: number;
  metaAtual?: number;
  nomeContaOrigem?: string;
  nomeContaDestino?: string;
}

interface InvestimentoRegistroPayload {
  descricao: string;
  valorInicial: number;
  meta?: number | null;
  contaId: number;
  contaDestinoId?: number;
  tipoInvestimento: TipoInvestimento;
  tipoPersonalizado?: string;
}

interface InvestimentoAtualizacaoPayload {
  descricao: string;
  meta?: number | null;
  tipoInvestimento: TipoInvestimento;
  tipoPersonalizado?: string;
}

const getAuthHeaders = () => {
  const token = useAuthStore.getState().token;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const investimentosApi = {
  async listar(): Promise<InvestimentoItem[]> {
    const { data } = await axios.get<InvestimentoItem[] | { content?: InvestimentoItem[] }>('/api/investimentos', {
      headers: getAuthHeaders(),
    });
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object' && Array.isArray((data as any).content)) {
      return (data as any).content as InvestimentoItem[];
    }
    return [];
  },

  async criar(payload: InvestimentoRegistroPayload): Promise<InvestimentoItem> {
    const { data } = await axios.post<InvestimentoItem>('/api/investimentos', payload, {
      headers: getAuthHeaders(),
    });
    return data;
  },

  async depositar(id: number, valor: number, contaId: number): Promise<InvestimentoItem> {
    const { data } = await axios.post<InvestimentoItem>(`/api/investimentos/${id}/depositar`, null, {
      params: { valor, contaId },
      headers: getAuthHeaders(),
    });
    return data;
  },

  async resgatar(id: number, valor: number, contaId: number): Promise<InvestimentoItem> {
    const { data } = await axios.post<InvestimentoItem>(`/api/investimentos/${id}/resgatar`, null, {
      params: { valor, contaId },
      headers: getAuthHeaders(),
    });
    return data;
  },

  async atualizarMeta(id: number, novaMeta: number): Promise<InvestimentoItem> {
    const { data } = await axios.put<InvestimentoItem>(`/api/investimentos/${id}/meta`, null, {
      params: { novaMeta },
      headers: getAuthHeaders(),
    });
    return data;
  },

  async atualizar(id: number, payload: InvestimentoAtualizacaoPayload): Promise<InvestimentoItem> {
    const { data } = await axios.put<InvestimentoItem>(`/api/investimentos/${id}`, payload, {
      headers: getAuthHeaders(),
    });
    return data;
  },

  async deletar(id: number): Promise<void> {
    await axios.delete(`/api/investimentos/${id}`, {
      headers: getAuthHeaders(),
    });
  },
};
