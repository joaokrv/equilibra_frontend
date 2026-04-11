import { useQuery } from '@tanstack/react-query';
import {
  TransaEsService,
  ContaControllerService,
  InvestimentosService,
} from '../api';
import { TransacaoResponseDTO } from '../api/models/TransacaoResponseDTO';
import { useMarket } from './useMarket';
import { useAuthStore } from '../store/useAuthStore';
import { useMemo } from 'react';
import { patrimonioApi } from '../lib/patrimonioApi';

/**
 * Hook customizado que centraliza todas as queries e cálculos do Dashboard.
 *
 * Responsabilidades:
 * - Buscar transações, contas e investimentos do mês atual
 * - Calcular totais de receitas, gastos, saldo e investimentos
 * - Agrupar despesas por categoria para o gráfico de distribuição
 *
 * @returns Dados computados e estados de loading
 */
export const useDashboardData = () => {
  const user = useAuthStore(state => state.user);
  const { exchange, eurExchange } = useMarket();
  
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  // Transações do mês
  const {
    data: transacoes = [],
    isLoading: isLoadingTransactions,
    isError: isErrorTransactions,
  } = useQuery({
    queryKey: ['transactions', currentYear, currentMonth],
    queryFn: () =>
      TransaEsService.listarPaginado({}, currentYear, currentMonth) as Promise<any>,
  });

  // Contas (saldo total)
  const { data: contas = [] } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => ContaControllerService.listarContas(),
  });

  // Investimentos
  const { data: investimentos = [] } = useQuery({
    queryKey: ['investments'],
    queryFn: () => InvestimentosService.listarInvestimentos(),
  });

  // Evolução patrimonial (snapshots diários)
  const { data: evolucaoPatrimonioBruta = [] } = useQuery({
    queryKey: ['patrimony-evolution', 180],
    queryFn: () => patrimonioApi.listarEvolucao(180),
  });

  // Normalizar lista (paginação ou array direto)
  const transacoesList: TransacaoResponseDTO[] = Array.isArray(transacoes)
    ? transacoes
    : (transacoes as any).content || [];

  // Cálculos de resumo
  const totalReceitas = transacoesList
    .filter((t) => t.tipo === TransacaoResponseDTO.tipo.RECEITA)
    .reduce((acc, t) => acc + (t.valor || 0), 0);

  const totalGastos = transacoesList
    .filter((t) => t.tipo === TransacaoResponseDTO.tipo.DESPESA)
    .reduce((acc, t) => acc + (t.valor || 0), 0);

  const saldoTotalContas = (contas as any[]).reduce(
    (acc: number, c: any) => acc + (c.saldo || 0),
    0,
  );

  const totalInvestido = (investimentos as any[]).reduce(
    (acc: number, i: any) => acc + (i.valorAtual || 0),
    0,
  );

  // Agrupamento por Categoria para o Gráfico de Pizza
  const categoriasMap = transacoesList.reduce((acc, t) => {
    const catName = t.nomeCategoria || 'Outros';
    if (t.tipo === TransacaoResponseDTO.tipo.DESPESA) {
      acc[catName] = (acc[catName] || 0) + (t.valor || 0);
    }
    return acc;
  }, {} as Record<string, number>);

  const despesasPorCategoria = Object.keys(categoriasMap)
    .map((name) => ({ name, value: categoriasMap[name] }))
    .sort((a, b) => b.value - a.value);

  const receitasMap = transacoesList.reduce((acc, t) => {
    const catName = t.nomeCategoria || 'Outros';
    if (t.tipo === TransacaoResponseDTO.tipo.RECEITA) {
      acc[catName] = (acc[catName] || 0) + (t.valor || 0);
    }
    return acc;
  }, {} as Record<string, number>);

  const receitasPorCategoria = Object.keys(receitasMap)
    .map((name) => ({ name, value: receitasMap[name] }))
    .sort((a, b) => b.value - a.value);

  // Fator de Conversão Baseado na Preferência do Usuário
  const conversionRate = useMemo(() => {
    const moeda = user?.moeda || 'BRL';
    if (moeda === 'USD' && exchange) {
      const bid = parseFloat(exchange.bid);
      return bid > 0 ? 1 / bid : 1;
    }
    if (moeda === 'EUR' && eurExchange) {
      const bid = parseFloat(eurExchange.bid);
      return bid > 0 ? 1 / bid : 1;
    }
    return 1; // BRL ou fallback
  }, [user?.moeda, exchange, eurExchange]);

  return {
    transacoesList,
    totalReceitas: totalReceitas * conversionRate,
    totalGastos: totalGastos * conversionRate,
    saldoTotalContas: saldoTotalContas * conversionRate,
    totalInvestido: totalInvestido * conversionRate,
    despesasPorCategoria: despesasPorCategoria.map(d => ({ ...d, value: d.value * conversionRate })),
    receitasPorCategoria: receitasPorCategoria.map(r => ({ ...r, value: r.value * conversionRate })),
    evolucaoPatrimonio: evolucaoPatrimonioBruta.map(item => ({
      dataReferencia: item.dataReferencia,
      valorTotal: Number(item.valorTotal || 0) * conversionRate,
    })),
    isLoadingTransactions,
    isError: isErrorTransactions,
    currentMonth,
    currentYear,
    moeda: user?.moeda || 'BRL'
  };
};
