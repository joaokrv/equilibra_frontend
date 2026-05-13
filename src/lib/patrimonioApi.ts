import apiClient from './axios';

export interface PatrimonioEvolucaoItem {
  dataReferencia: string;
  valorTotal: number;
}

export const patrimonioApi = {
  async listarEvolucao(dias = 180): Promise<PatrimonioEvolucaoItem[]> {
    const { data } = await apiClient.get<PatrimonioEvolucaoItem[]>('/api/patrimonio/evolucao', {
      params: { dias },
    });
    return data;
  },
};
