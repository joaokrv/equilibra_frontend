/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { FaturaResponseDTO } from '../models/FaturaResponseDTO';
import type { PagarFaturaRequestDTO } from '../models/PagarFaturaRequestDTO';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class FaturaControllerService {
    /**
     * @param id
     * @param requestBody
     * @returns FaturaResponseDTO OK
     * @throws ApiError
     */
    public static pagarFatura(
        id: number,
        requestBody: PagarFaturaRequestDTO,
    ): CancelablePromise<FaturaResponseDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/faturas/{id}/pagar',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param cartaoId
     * @returns FaturaResponseDTO OK
     * @throws ApiError
     */
    public static listarFaturasPorCartao(
        cartaoId: number,
    ): CancelablePromise<Array<FaturaResponseDTO>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/faturas/cartao/{cartaoId}',
            path: {
                'cartaoId': cartaoId,
            },
        });
    }
}
