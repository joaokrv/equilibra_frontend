import { QueryClient } from '@tanstack/react-query';

/**
 * Pares de chaves PT/EN que coexistem no app. O cache é invalidado por prefixo,
 * então invalidar ['transacoes'] cobre ['transacoes', ano, mes] etc. Centralizar
 * aqui evita o cache stale clássico de invalidar uma convenção e esquecer a outra.
 */
const CONTAS = [['contas'], ['accounts']];
const CARTOES = [['cartoes'], ['cards']];
const FATURAS = [['faturas'], ['fatura']];
const TRANSACOES = [['transacoes'], ['transactions'], ['transactions-period']];
const DASHBOARD = [['dashboard-summary'], ['patrimony-evolution']];
const INVESTIMENTOS = [['investimentos'], ['mov-investimentos-extrato'], ['mov-investimentos-preview']];

function invalidar(queryClient: QueryClient, grupos: string[][]): void {
  grupos.forEach((queryKey) => queryClient.invalidateQueries({ queryKey }));
}

/**
 * Invalida todas as queries afetadas por uma movimentação de investimento
 * (aporte, resgate, rendimento, edição ou exclusão). Aporte/resgate movimentam
 * o saldo da conta e geram transação, logo contas e transações também entram.
 */
export function invalidateInvestmentQueries(queryClient: QueryClient): void {
  invalidar(queryClient, [...INVESTIMENTOS, ...CONTAS, ...TRANSACOES, ...DASHBOARD]);
}

/**
 * Invalida todas as queries afetadas por criar/editar/excluir uma transação.
 * Inclui cartões (limite recalculado) e faturas (criação lazy / ghost closing)
 * porque uma transação via cartão impacta ambos.
 */
export function invalidateTransacaoQueries(queryClient: QueryClient): void {
  invalidar(queryClient, [...TRANSACOES, ...CONTAS, ...CARTOES, ...FATURAS, ...INVESTIMENTOS, ...DASHBOARD]);
}

/**
 * Invalida as queries afetadas pelo pagamento de uma fatura — debita conta,
 * altera limite do cartão e a movimentação aparece no extrato/dashboard.
 */
export function invalidateFaturaQueries(queryClient: QueryClient): void {
  invalidar(queryClient, [...FATURAS, ...CARTOES, ...CONTAS, ...TRANSACOES, ...DASHBOARD]);
}
