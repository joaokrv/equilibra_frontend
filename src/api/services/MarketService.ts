import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
import type { CancelablePromise } from '../core/CancelablePromise';

/**
 * Service para integração com o motor de mercado do backend.
 * Fornece cotações da B3 e taxas de câmbio.
 */
export class MarketService {

    /**
     * Buscar cotações de ativos (B3)
     * @param tickers Lista de ativos separados por vírgula (Ex: PETR4,VALE3)
     * @returns any Dados da Brapi
     */
    public static getQuotes(tickers: string): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/mercado/cotacoes',
            query: {
                'tickers': tickers,
            },
        });
    }

    /**
     * Buscar taxas de câmbio em tempo real
     * @param pair Par de moedas (Ex: USD-BRL)
     * @returns any Dados da AwesomeAPI
     */
    public static getExchangeRates(pair: string = 'USD-BRL'): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/mercado/cambio',
            query: {
                'pair': pair,
            },
        });
    }

    /**
     * Buscar indicadores macroeconômicos consolidados do banco de dados.
     * Retorna SELIC, CDI, IPCA, USD, EUR, IBOVESPA e IFIX.
     */
    public static getIndicadores(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/mercado/indicadores',
        });
    }
}
