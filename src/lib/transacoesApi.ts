import apiClient from './axios';

export const transacoesApi = {
  /**
   * Exclui uma transação. Com grupo=true, exclui todas as parcelas de uma compra parcelada
   * (o backend resolve o grupo a partir do ID informado).
   */
  excluir: async (id: number, grupo = false): Promise<void> => {
    await apiClient.delete(`/api/transacoes/${id}`, { params: { grupo } });
  },
};
