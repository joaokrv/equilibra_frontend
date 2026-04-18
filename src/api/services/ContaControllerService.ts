/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ContaRegistroRequestDTO } from '../models/ContaRegistroRequestDTO';
import type { ContaResponseDTO } from '../models/ContaResponseDTO';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ContaControllerService {
    /**
     * @param id
     * @param valor
     * @returns ContaResponseDTO OK
     * @throws ApiError
     */
    public static atualizarSaldo(
        id: number,
        valor: number,
    ): CancelablePromise<ContaResponseDTO> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/contas/{id}/saldo',
            path: {
                'id': id,
            },
            query: {
                'valor': valor,
            },
        });
    }
    /**
     * @returns ContaResponseDTO OK
     * @throws ApiError
     */
    public static listarContas(): CancelablePromise<Array<ContaResponseDTO>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/contas',
        });
    }
    /**
     * @param requestBody
     * @returns ContaResponseDTO OK
     * @throws ApiError
     */
    public static criarConta(
        requestBody: ContaRegistroRequestDTO,
    ): CancelablePromise<ContaResponseDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/contas',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param id
     * @returns ContaResponseDTO OK
     * @throws ApiError
     */
    public static buscarPorId1(
        id: number,
    ): CancelablePromise<ContaResponseDTO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/contas/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @param id
     * @returns any OK
     * @throws ApiError
     */
    public static deletarConta(
        id: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/contas/{id}',
            path: {
                'id': id,
            },
        });
    }
}
