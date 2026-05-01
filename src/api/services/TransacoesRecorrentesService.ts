/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TransacaoRecorrenteRequestDTO } from '../models/TransacaoRecorrenteRequestDTO';
import type { TransacaoRecorrenteResponseDTO } from '../models/TransacaoRecorrenteResponseDTO';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class TransacoesRecorrentesService {
    /**
     * Atualizar recorrência
     * Edita uma recorrência. Afeta apenas meses futuros.
     * @param id
     * @param requestBody
     * @returns TransacaoRecorrenteResponseDTO OK
     * @throws ApiError
     */
    public static atualizar(
        id: number,
        requestBody: TransacaoRecorrenteRequestDTO,
    ): CancelablePromise<TransacaoRecorrenteResponseDTO> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/recorrentes/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Desativar recorrência
     * Desativa a recorrência para sempre. Transações já geradas permanecem.
     * @param id
     * @returns any OK
     * @throws ApiError
     */
    public static deletar(
        id: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/recorrentes/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Listar recorrências
     * Retorna todas as recorrências ativas do usuário.
     * @returns TransacaoRecorrenteResponseDTO OK
     * @throws ApiError
     */
    public static listar(): CancelablePromise<Array<TransacaoRecorrenteResponseDTO>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/recorrentes',
        });
    }
    /**
     * Criar recorrência
     * Cadastra uma nova receita ou despesa fixa.
     * @param requestBody
     * @returns TransacaoRecorrenteResponseDTO OK
     * @throws ApiError
     */
    public static criar(
        requestBody: TransacaoRecorrenteRequestDTO,
    ): CancelablePromise<TransacaoRecorrenteResponseDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/recorrentes',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Cancelar mês
     * Cancela a geração da recorrência para um mês específico.
     * @param id
     * @param ano
     * @param mes
     * @returns any OK
     * @throws ApiError
     */
    public static cancelarMes(
        id: number,
        ano: number,
        mes: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/recorrentes/{id}/cancelar',
            path: {
                'id': id,
            },
            query: {
                'ano': ano,
                'mes': mes,
            },
        });
    }
    /**
     * Reativar mês
     * Remove o cancelamento de um mês específico.
     * @param id
     * @param ano
     * @param mes
     * @returns any OK
     * @throws ApiError
     */
    public static reativarMes(
        id: number,
        ano: number,
        mes: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/recorrentes/{id}/cancelar',
            path: {
                'id': id,
            },
            query: {
                'ano': ano,
                'mes': mes,
            },
        });
    }
}
