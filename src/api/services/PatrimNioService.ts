/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PatrimonioEvolucaoResponseDTO } from '../models/PatrimonioEvolucaoResponseDTO';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class PatrimNioService {
    /**
     * Evolução patrimonial
     * Retorna snapshots diários de patrimônio (contas + investimentos) no período informado.
     * @param dias
     * @returns PatrimonioEvolucaoResponseDTO OK
     * @throws ApiError
     */
    public static listarEvolucao(
        dias: number = 180,
    ): CancelablePromise<Array<PatrimonioEvolucaoResponseDTO>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/patrimonio/evolucao',
            query: {
                'dias': dias,
            },
        });
    }
}
