import { useQuery } from '@tanstack/react-query';
import { TransacaoResponseDTO } from '../api/models/TransacaoResponseDTO';
import { useMarket } from './useMarket';
import { useAuthStore } from '../store/useAuthStore';
import { useMemo } from 'react';
import { patrimonioApi, type PatrimonioEvolucaoItem } from '../lib/patrimonioApi';
import {
  dashboardApi,
  type DashboardPeriodo,
  type DashboardResumoPeriodoResponse,
} from '../lib/dashboardApi';

const PERIODO_DIAS_EVOLUCAO: Record<DashboardPeriodo, number> = {
  '1M': 30,
  '3M': 90,
  '6M': 180,
  '1A': 365,
};

const calcularIntervalo = (periodo: DashboardPeriodo): { dataInicio: string; dataFim: string } => {
  const now = new Date();
  const mesAtual = now.getMonth();
  const anoAtual = now.getFullYear();
  const meses = { '1M': 1, '3M': 3, '6M': 6, '1A': 12 }[periodo];

  const inicioDate = new Date(anoAtual, mesAtual - (meses - 1), 1);
  const fimDate = new Date(anoAtual, mesAtual + 1, 0);

  const pad = (n: number) => String(n).padStart(2, '0');
  const formatDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  return { dataInicio: formatDate(inicioDate), dataFim: formatDate(fimDate) };
};

const ensureArray = <T,>(value: unknown): T[] => {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === 'object') {
    const maybeWithContent = value as { content?: unknown };
    if (Array.isArray(maybeWithContent.content)) {
      return maybeWithContent.content as T[];
    }
  }
  return [];
};

const toNumber = (value: number | null | undefined): number => Number(value || 0);

export const useDashboardData = (
  periodo: DashboardPeriodo = '1M',
  periodoPatrimonio: DashboardPeriodo = '6M',
) => {

  const user = useAuthStore(state => state.user);
  const { exchange, eurExchange } = useMarket();
  
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const diasEvolucao = PERIODO_DIAS_EVOLUCAO[periodoPatrimonio];
  const intervaloTransacoes = useMemo(() => calcularIntervalo(periodo), [periodo]);

  // Resumo consolidado de cards para o período selecionado
  const {
    data: resumoPeriodo,
    isLoading: isLoadingResumo,
    isError: isErrorResumo,
  } = useQuery({
    queryKey: ['dashboard-summary', periodo],
    queryFn: () => dashboardApi.obterResumoPorPeriodo(periodo),
  });

  // Transações do período para distribuição por categoria e lançamentos recentes
  const {
    data: transacoesPeriodoResponse = [],
    isLoading: isLoadingTransactionsPeriodo,
    isError: isErrorTransactionsPeriodo,
  } = useQuery({
    queryKey: ['transactions-period', periodo, intervaloTransacoes.dataInicio, intervaloTransacoes.dataFim],
    queryFn: () =>
      dashboardApi.listarPorIntervalo(intervaloTransacoes.dataInicio, intervaloTransacoes.dataFim),
  });

  // Evolução patrimonial (snapshots diários)
  const { data: evolucaoPatrimonioBruta = [] } = useQuery({
    queryKey: ['patrimony-evolution', diasEvolucao],
    queryFn: () => patrimonioApi.listarEvolucao(diasEvolucao),
  });

  // Normalizar lista (paginação ou array direto)
  const transacoesPeriodoList = (Array.isArray(transacoesPeriodoResponse)
    ? transacoesPeriodoResponse
    : [])
    .sort((a, b) => {
      const dataA = new Date(a.data || 0).getTime();
      const dataB = new Date(b.data || 0).getTime();
      return dataB - dataA;
    });
  const evolucaoPatrimonioList = ensureArray<PatrimonioEvolucaoItem>(evolucaoPatrimonioBruta);

  const resumo = resumoPeriodo as DashboardResumoPeriodoResponse | undefined;

  const totalReceitas = toNumber(resumo?.totalReceitasAtual);
  const totalReceitasAnterior = toNumber(resumo?.totalReceitasAnterior);
  const totalGastos = toNumber(resumo?.totalDespesasAtual);
  const totalGastosAnterior = toNumber(resumo?.totalDespesasAnterior);
  const totalReceitasPendentes = toNumber(resumo?.totalReceitasPendentesAtual);
  const totalGastosPendentes = toNumber(resumo?.totalDespesasPendentesAtual);
  const variacaoReceitasPercent = resumo?.variacaoReceitasPercentual ?? null;
  const variacaoGastosPercent = resumo?.variacaoDespesasPercentual ?? null;
  const saldoTotalContas = toNumber(resumo?.saldoContasAtual);
  const saldoTotalContasAnterior = toNumber(resumo?.saldoContasAnterior);
  const totalInvestido = toNumber(resumo?.totalInvestidoAtual);
  const totalInvestidoAnterior = toNumber(resumo?.totalInvestidoAnterior);
  const variacaoSaldoContasPercent = resumo?.variacaoSaldoContasPercentual ?? null;
  const variacaoInvestimentosPercent = resumo?.variacaoInvestimentosPercentual ?? null;

  // Agrupamento por Categoria para o Gráfico de Pizza
  const categoriasMap = transacoesPeriodoList.reduce((acc, t) => {
    const catName = t.nomeCategoria || 'Outros';
    if (t.tipo === TransacaoResponseDTO.tipo.DESPESA) {
      acc[catName] = (acc[catName] || 0) + (t.valor || 0);
    }
    return acc;
  }, {} as Record<string, number>);

  const despesasPorCategoria = Object.keys(categoriasMap)
    .map((name) => ({ name, value: categoriasMap[name] }))
    .sort((a, b) => b.value - a.value);

  const receitasMap = transacoesPeriodoList.reduce((acc, t) => {
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

  const isLoadingTransactions = isLoadingTransactionsPeriodo || isLoadingResumo;
  const isErrorTransactions = isErrorTransactionsPeriodo || isErrorResumo;

  const intervaloAtual = {
    inicio: resumo?.inicioPeriodoAtual || null,
    fim: resumo?.fimPeriodoAtual || null,
  };

  const intervaloAnterior = {
    inicio: resumo?.inicioPeriodoAnterior || null,
    fim: resumo?.fimPeriodoAnterior || null,
  };

  return {
    periodo,
    periodoPatrimonio,
    transacoesList: transacoesPeriodoList,
    totalReceitas: totalReceitas * conversionRate,
    totalReceitasAnterior: totalReceitasAnterior * conversionRate,
    totalGastos: totalGastos * conversionRate,
    totalGastosAnterior: totalGastosAnterior * conversionRate,
    totalReceitasPendentes: totalReceitasPendentes * conversionRate,
    totalGastosPendentes: totalGastosPendentes * conversionRate,
    variacaoReceitasPercent,
    variacaoGastosPercent,
    variacaoInvestimentosPercent,
    variacaoSaldoContasPercent,
    saldoTotalContas: saldoTotalContas * conversionRate,
    saldoTotalContasAnterior: saldoTotalContasAnterior * conversionRate,
    totalInvestido: totalInvestido * conversionRate,
    totalInvestidoAnterior: totalInvestidoAnterior * conversionRate,
    despesasPorCategoria: despesasPorCategoria.map(d => ({ ...d, value: d.value * conversionRate })),
    receitasPorCategoria: receitasPorCategoria.map(r => ({ ...r, value: r.value * conversionRate })),
    evolucaoPatrimonio: evolucaoPatrimonioList.map(item => ({
      dataReferencia: item.dataReferencia,
      valorTotal: Number(item.valorTotal || 0) * conversionRate,
    })),
    isLoadingTransactions,
    isError: isErrorTransactions,
    intervaloAtual,
    intervaloAnterior,
    diasEvolucao,
    currentMonth,
    currentYear,
    moeda: user?.moeda || 'BRL'
  };
};
