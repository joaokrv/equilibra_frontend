import { useQuery } from '@tanstack/react-query';
import { MercadoService } from '../api';
import type { StockQuote, ExchangeRate, MercadoIndicadoresResponse } from '../lib/types/market';

/**
 * Hook para gerenciar dados de mercado (Ações e Câmbio).
 * Centraliza as chamadas ao MarketService e gerencia o cache no lado do cliente.
 */
export const useMarket = (tickers: string = 'PETR4,VALE3,ITUB4,BBDC4,WEGE3,BBAS3,ABEV3,RENT3') => {

  const stocksQuery = useQuery<{ results: StockQuote[] }>({
    queryKey: ['market-quotes', tickers],
    queryFn: () => MercadoService.getCotacoes(tickers),
    refetchInterval: 1000 * 60 * 5,
    staleTime: 1000 * 60 * 2,
  });

  const exchangeQuery = useQuery<Record<string, ExchangeRate>>({
    queryKey: ['market-exchange', 'USD-BRL,EUR-BRL'],
    queryFn: () => MercadoService.getCambio('USD-BRL,EUR-BRL'),
    refetchInterval: 1000 * 60 * 30,
    staleTime: 1000 * 60 * 15,
  });

  const indicadoresQuery = useQuery<MercadoIndicadoresResponse>({
    queryKey: ['market-indicadores'],
    queryFn: () => MercadoService.getIndicadores(),
    refetchInterval: 1000 * 60 * 30,
    staleTime: 1000 * 60 * 15,
  });

  return {
    stocks: stocksQuery.data?.results || [] as StockQuote[],
    exchange: exchangeQuery.data?.USDBRL || null,
    eurExchange: exchangeQuery.data?.EURBRL || null,
    indicadores: indicadoresQuery.data || null,
    isLoading: stocksQuery.isLoading || exchangeQuery.isLoading || indicadoresQuery.isLoading,
    isError: stocksQuery.isError || exchangeQuery.isError || indicadoresQuery.isError,
  };
};
