/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { InvestimentoAtualizacaoRequestDTO } from '../models/InvestimentoAtualizacaoRequestDTO';
import type { InvestimentoRegistroRequestDTO } from '../models/InvestimentoRegistroRequestDTO';
import type { InvestimentoResponseDTO } from '../models/InvestimentoResponseDTO';
import type { MovimentacaoAtualizacaoRequestDTO } from '../models/MovimentacaoAtualizacaoRequestDTO';
import type { MovimentacaoInvestimentoResponseDTO } from '../models/MovimentacaoInvestimentoResponseDTO';
import type { PageMovimentacaoInvestimentoResponseDTO } from '../models/PageMovimentacaoInvestimentoResponseDTO';
import type { RendimentoRegistroRequestDTO } from '../models/RendimentoRegistroRequestDTO';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class InvestimentosService {
    /**
     * Atualizar investimento
     * @param id
     * @param requestBody
     * @returns InvestimentoResponseDTO OK
     * @throws ApiError
     */
    public static atualizarInvestimento(
        id: number,
        requestBody: InvestimentoAtualizacaoRequestDTO,
    ): CancelablePromise<InvestimentoResponseDTO> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/investimentos/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Excluir investimento
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
    /**
     * Atualizar meta
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
     * Editar movimentação
     * Edita qualquer tipo de movimentação. Para APORTE/RESGATE, reverte o efeito anterior e recria. contaId obrigatório para APORTE/RESGATE.
     * @param movId
     * @param requestBody
     * @returns MovimentacaoInvestimentoResponseDTO OK
     * @throws ApiError
     */
    public static editarMovimentacao(
        movId: number,
        requestBody: MovimentacaoAtualizacaoRequestDTO,
    ): CancelablePromise<MovimentacaoInvestimentoResponseDTO> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/investimentos/movimentacoes/{movId}',
            path: {
                'movId': movId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Excluir movimentação
     * Soft delete com reversão completa do efeito financeiro (saldo de conta e valorAtual do investimento).
     * @param movId
     * @returns any OK
     * @throws ApiError
     */
    public static excluirMovimentacao(
        movId: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/investimentos/movimentacoes/{movId}',
            path: {
                'movId': movId,
            },
        });
    }
    /**
     * Listar investimentos
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
     * Adicionar aporte
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
     * Registrar rendimento
     * Registra um rendimento (positivo ou negativo) em um investimento. Não movimenta conta bancária.
     * @param requestBody
     * @returns MovimentacaoInvestimentoResponseDTO OK
     * @throws ApiError
     */
    public static registrarRendimento(
        requestBody: RendimentoRegistroRequestDTO,
    ): CancelablePromise<MovimentacaoInvestimentoResponseDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/investimentos/rendimento',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Extrato de movimentações
     * Retorna movimentações paginadas. Filtro padrão: últimos 30 dias. Tamanhos: 10, 20, 50.
     * @param dataInicio
     * @param dataFim
     * @param tipo
     * @param investimentoId
     * @param page
     * @param size
     * @returns PageMovimentacaoInvestimentoResponseDTO OK
     * @throws ApiError
     */
    public static listarMovimentacoes(
        dataInicio?: string,
        dataFim?: string,
        tipo?: 'APORTE' | 'RESGATE' | 'RENDIMENTO',
        investimentoId?: number,
        page?: number,
        size: number = 10,
    ): CancelablePromise<PageMovimentacaoInvestimentoResponseDTO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/investimentos/movimentacoes',
            query: {
                'dataInicio': dataInicio,
                'dataFim': dataFim,
                'tipo': tipo,
                'investimentoId': investimentoId,
                'page': page,
                'size': size,
            },
        });
    }
    /**
     * Preview de movimentações
     * Retorna as últimas 5 movimentações de todos os investimentos do usuário.
     * @returns MovimentacaoInvestimentoResponseDTO OK
     * @throws ApiError
     */
    public static buscarPreview(): CancelablePromise<Array<MovimentacaoInvestimentoResponseDTO>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/investimentos/movimentacoes/preview',
        });
    }
}
