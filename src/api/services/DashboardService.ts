/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DashboardResumoPeriodoResponseDTO } from '../models/DashboardResumoPeriodoResponseDTO';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class DashboardService {
    /**
     * Resumo por periodo
     * Retorna resumo da dashboard para 1M, 3M, 6M ou 1A, comparando com a janela anterior de mesmo tamanho.
     * @param periodo
     * @returns DashboardResumoPeriodoResponseDTO OK
     * @throws ApiError
     */
    public static obterResumoPorPeriodo(
        periodo: string = '1M',
    ): CancelablePromise<DashboardResumoPeriodoResponseDTO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/dashboard/resumo',
            query: {
                'periodo': periodo,
            },
        });
    }
}
