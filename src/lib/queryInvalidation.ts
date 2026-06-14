import { QueryClient } from '@tanstack/react-query';

/**
 * Invalida todas as queries afetadas por uma movimentação de investimento
 * (aporte, resgate, rendimento, edição ou exclusão). Fonte única de verdade
 * para os efeitos colaterais de cache — usar tanto no modal quanto na página.
 */
export function invalidateInvestmentQueries(queryClient: QueryClient): void {
  const keys = [
    ['mov-investimentos-extrato'],
    ['mov-investimentos-preview'],
    ['investimentos'],
    ['patrimony-evolution'],
    ['accounts'],
    ['transacoes'],
    ['transactions'],
    ['dashboard-summary'],
  ];
  keys.forEach((queryKey) => queryClient.invalidateQueries({ queryKey }));
}

/**
 * Invalida todas as queries afetadas por criar/editar/excluir uma transação.
 * Fonte única para o efeito de cache — evita a duplicação dispersa do par de chaves
 * PT/EN (transacoes/transactions, contas/accounts) que vinha sendo repetida em cada site.
 */
export function invalidateTransacaoQueries(queryClient: QueryClient): void {
  const keys = [
    ['transacoes'],
    ['transactions'],
    ['transactions-period'],
    ['accounts'],
    ['contas'],
    ['investimentos'],
    ['dashboard-summary'],
    ['patrimony-evolution'],
  ];
  keys.forEach((queryKey) => queryClient.invalidateQueries({ queryKey }));
}
