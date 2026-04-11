/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CartaoRegistroRequestDTO } from '../models/CartaoRegistroRequestDTO';
import type { CartaoResponseDTO } from '../models/CartaoResponseDTO';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class CartaoControllerService {
    /**
     * @returns CartaoResponseDTO OK
     * @throws ApiError
     */
    public static listarCartoes(): CancelablePromise<Array<CartaoResponseDTO>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/cartoes',
        });
    }
    /**
     * @param requestBody
     * @returns CartaoResponseDTO OK
     * @throws ApiError
     */
    public static criarCartao(
        requestBody: CartaoRegistroRequestDTO,
    ): CancelablePromise<CartaoResponseDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/cartoes',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param id
     * @returns CartaoResponseDTO OK
     * @throws ApiError
     */
    public static buscarPorId1(
        id: number,
    ): CancelablePromise<CartaoResponseDTO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/cartoes/{id}',
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
    public static deletarCartao(
        id: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/cartoes/{id}',
            path: {
                'id': id,
            },
        });
    }
}
