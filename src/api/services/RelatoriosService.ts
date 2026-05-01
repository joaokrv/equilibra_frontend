/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { RelatorioFiltroDTO } from '../models/RelatorioFiltroDTO';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class RelatoriosService {
    /**
     * Exportar Relatório
     * Gera um arquivo (PDF ou CSV) contendo o extrato das transações do usuário baseadas no filtro informado.
     * @param formato
     * @param requestBody
     * @returns string OK
     * @throws ApiError
     */
    public static exportarRelatorio(
        formato: string,
        requestBody: RelatorioFiltroDTO,
    ): CancelablePromise<string> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/relatorios/exportar',
            query: {
                'formato': formato,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
