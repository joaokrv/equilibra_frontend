import apiClient from './axios';
import { CartaoRegistroRequestDTO } from '../api/models/CartaoRegistroRequestDTO';
import { CartaoResponseDTO } from '../api/models/CartaoResponseDTO';

export const cartoesApi = {
  atualizar: async (id: number, payload: CartaoRegistroRequestDTO): Promise<CartaoResponseDTO> => {
    const { data } = await apiClient.put<CartaoResponseDTO>(`/api/cartoes/${id}`, payload);
    return data;
  },
};
