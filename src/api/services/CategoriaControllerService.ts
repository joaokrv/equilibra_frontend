/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CategoriaRegistroRequestDTO } from '../models/CategoriaRegistroRequestDTO';
import type { CategoriaResponseDTO } from '../models/CategoriaResponseDTO';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class CategoriaControllerService {
    /**
     * @param id
     * @param requestBody
     * @returns CategoriaResponseDTO OK
     * @throws ApiError
     */
    public static atualizarCategoria(
        id: number,
        requestBody: CategoriaRegistroRequestDTO,
    ): CancelablePromise<CategoriaResponseDTO> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/categorias/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param id
     * @returns any OK
     * @throws ApiError
     */
    public static deletarCategoria(
        id: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/categorias/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @param tipo
     * @returns CategoriaResponseDTO OK
     * @throws ApiError
     */
    public static listarCategorias(
        tipo?: 'RECEITA' | 'DESPESA',
    ): CancelablePromise<Array<CategoriaResponseDTO>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/categorias',
            query: {
                'tipo': tipo,
            },
        });
    }
    /**
     * @param requestBody
     * @returns CategoriaResponseDTO OK
     * @throws ApiError
     */
    public static criarCategoria(
        requestBody: CategoriaRegistroRequestDTO,
    ): CancelablePromise<CategoriaResponseDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/categorias',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
