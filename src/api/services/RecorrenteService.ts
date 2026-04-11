import type { TransacaoRecorrenteRequestDTO } from '../models/TransacaoRecorrenteRequestDTO';
import type { TransacaoRecorrenteResponseDTO } from '../models/TransacaoRecorrenteResponseDTO';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export class RecorrenteService {

    public static listar(): CancelablePromise<Array<TransacaoRecorrenteResponseDTO>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/recorrentes',
        });
    }

    public static criar(requestBody: TransacaoRecorrenteRequestDTO): CancelablePromise<TransacaoRecorrenteResponseDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/recorrentes',
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    public static atualizar(id: number, requestBody: TransacaoRecorrenteRequestDTO): CancelablePromise<TransacaoRecorrenteResponseDTO> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/recorrentes/{id}',
            path: { id },
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    public static deletar(id: number): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/recorrentes/{id}',
            path: { id },
        });
    }

    public static cancelarMes(id: number, ano: number, mes: number): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/recorrentes/{id}/cancelar',
            path: { id },
            query: { ano, mes },
        });
    }

    public static reativarMes(id: number, ano: number, mes: number): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/recorrentes/{id}/cancelar',
            path: { id },
            query: { ano, mes },
        });
    }
}
