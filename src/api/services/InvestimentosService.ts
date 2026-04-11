/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { InvestimentoRegistroRequestDTO } from '../models/InvestimentoRegistroRequestDTO';
import type { InvestimentoResponseDTO } from '../models/InvestimentoResponseDTO';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class InvestimentosService {
    /**
     * Atualizar meta
     * Altera o valor do objetivo (meta final) de um investimento.
     * @param id
     * @param novaMeta
     * @returns InvestimentoResponseDTO OK
     * @throws ApiError
     */
    public static atualizarMeta(
        id: number,
        novaMeta: number,
    ): CancelablePromise<InvestimentoResponseDTO> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/investimentos/{id}/meta',
            path: {
                'id': id,
            },
            query: {
                'novaMeta': novaMeta,
            },
        });
    }
    /**
     * Listar investimentos
     * Retorna todos os investimentos ativos do usuário logado.
     * @returns InvestimentoResponseDTO OK
     * @throws ApiError
     */
    public static listarInvestimentos(): CancelablePromise<Array<InvestimentoResponseDTO>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/investimentos',
        });
    }
    /**
     * Criar investimento
     * Cria uma nova meta de investimento para o usuário logado.
     * @param requestBody
     * @returns InvestimentoResponseDTO OK
     * @throws ApiError
     */
    public static criarInvestimento(
        requestBody: InvestimentoRegistroRequestDTO,
    ): CancelablePromise<InvestimentoResponseDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/investimentos',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Resgatar valor
     * Retira um valor do investimento e credita em uma conta bancária.
     * @param id
     * @param valor
     * @param contaId
     * @returns InvestimentoResponseDTO OK
     * @throws ApiError
     */
    public static resgatarInvestimento(
        id: number,
        valor: number,
        contaId: number,
    ): CancelablePromise<InvestimentoResponseDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/investimentos/{id}/resgatar',
            path: {
                'id': id,
            },
            query: {
                'valor': valor,
                'contaId': contaId,
            },
        });
    }
    /**
     * Adicionar depósito
     * Registra um aporte em um investimento, debitando o valor de uma conta bancária.
     * @param id
     * @param valor
     * @param contaId
     * @returns InvestimentoResponseDTO OK
     * @throws ApiError
     */
    public static depositar(
        id: number,
        valor: number,
        contaId: number,
    ): CancelablePromise<InvestimentoResponseDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/investimentos/{id}/depositar',
            path: {
                'id': id,
            },
            query: {
                'valor': valor,
                'contaId': contaId,
            },
        });
    }
    /**
     * Excluir investimento
     * Realiza o soft delete do investimento. Só é permitido se o saldo estiver zerado.
     * @param id
     * @returns any OK
     * @throws ApiError
     */
    public static deletarInvestimento(
        id: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/investimentos/{id}',
            path: {
                'id': id,
            },
        });
    }
}
