/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BrapiResponseDTO } from '../models/BrapiResponseDTO';
import type { MercadoIndicadoresResponseDTO } from '../models/MercadoIndicadoresResponseDTO';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class MercadoService {
    /**
     * Buscar indicadores consolidados
     * Retorna SELIC, CDI, IPCA, câmbio e índices (IBOVESPA, IFIX) consolidados do banco de dados.
     * @returns MercadoIndicadoresResponseDTO OK
     * @throws ApiError
     */
    public static getIndicadores(): CancelablePromise<MercadoIndicadoresResponseDTO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/mercado/indicadores',
        });
    }
    /**
     * Buscar cotações de ativos
     * Retorna os preços atuais e variação percentual de ativos da B3.
     * @param tickers
     * @returns BrapiResponseDTO OK
     * @throws ApiError
     */
    public static getCotacoes(
        tickers: string,
    ): CancelablePromise<BrapiResponseDTO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/mercado/cotacoes',
            query: {
                'tickers': tickers,
            },
        });
    }
    /**
     * Buscar taxas de câmbio
     * Retorna a cotação atual e variação para o par de moedas informado.
     * @param pair
     * @returns any OK
     * @throws ApiError
     */
    public static getCambio(
        pair: string = 'USD-BRL',
    ): CancelablePromise<Record<string, Record<string, any>>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/mercado/cambio',
            query: {
                'pair': pair,
            },
        });
    }
}
