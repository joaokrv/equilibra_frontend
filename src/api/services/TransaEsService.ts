/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Pageable } from '../models/Pageable';
import type { PageTransacaoResponseDTO } from '../models/PageTransacaoResponseDTO';
import type { TransacaoRegistroRequestDTO } from '../models/TransacaoRegistroRequestDTO';
import type { TransacaoResponseDTO } from '../models/TransacaoResponseDTO';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class TransaEsService {
    /**
     * Atualizar transação
     * Altera os dados de uma transação existente e reajusta os saldos/limites impactados.
     * @param id
     * @param requestBody
     * @returns TransacaoResponseDTO OK
     * @throws ApiError
     */
    public static atualizarTransacao(
        id: number,
        requestBody: TransacaoRegistroRequestDTO,
    ): CancelablePromise<TransacaoResponseDTO> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/transacoes/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Excluir transação
     * Remove logicamente uma transação e estorna seu impacto financeiro (saldo/limite).
     * @param id
     * @returns any OK
     * @throws ApiError
     */
    public static deletarTransacao(
        id: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/transacoes/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Listar transações mensais
     * Retorna todas as transações de um mês e ano específicos para o usuário logado.
     * @param pageable
     * @param ano
     * @param mes
     * @returns any OK
     * @throws ApiError
     */
    public static listarPaginado(
        pageable: Pageable,
        ano: number,
        mes: number,
    ): CancelablePromise<(Array<TransacaoResponseDTO> | PageTransacaoResponseDTO)> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/transacoes',
            query: {
                'pageable': pageable,
                'ano': ano,
                'mes': mes,
            },
        });
    }
    /**
     * Criar transação
     * Registra uma nova receita ou despesa. Impacta automaticamente o saldo da conta ou limite do cartão.
     * @param requestBody
     * @returns TransacaoResponseDTO OK
     * @throws ApiError
     */
    public static criarTransacao(
        requestBody: TransacaoRegistroRequestDTO,
    ): CancelablePromise<TransacaoResponseDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/transacoes',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
