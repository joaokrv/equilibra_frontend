import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

export interface PatrimonioEvolucaoItem {
  dataReferencia: string;
  valorTotal: number;
}

const getAuthHeaders = () => {
  const token = useAuthStore.getState().token;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const patrimonioApi = {
  async listarEvolucao(dias = 180): Promise<PatrimonioEvolucaoItem[]> {
    const { data } = await axios.get<PatrimonioEvolucaoItem[]>('/api/patrimonio/evolucao', {
      params: { dias },
      headers: getAuthHeaders(),
    });
    return data;
  },
};
