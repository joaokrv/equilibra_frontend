import type { AppLanguage } from '../store/useI18nStore';

/**
 * Módulo centralizado de formatação para toda a aplicação.
 *
 * Evita repetição de lógica de formatação de moeda e datas
 * espalhada por múltiplos componentes.
 */

/**
 * Formata um valor numérico para a moeda brasileira (BRL).
 * @param valor - Valor numérico a ser formatado
 * @param moeda - Código da moeda (BRL, USD, EUR)
 * @returns String formatada (ex: "R$ 1.234,56")
 */
export const formatarMoeda = (valor: number, moeda: 'BRL' | 'USD' | 'EUR' = 'BRL'): string =>
  new Intl.NumberFormat(moeda === 'BRL' ? 'pt-BR' : 'en-US', {
    style: 'currency',
    currency: moeda,
  }).format(valor);

export const getDateLocale = (language: AppLanguage): string =>
  language === 'en-US' ? 'en-US' : 'pt-BR';

/**
 * Formata um valor numérico como porcentagem.
 * @param valor - Valor numérico (0-100)
 * @param casasDecimais - Quantidade de casas decimais (padrão: 0)
 * @returns String formatada (ex: "42%")
 */
export const formatarPorcentagem = (
  valor: number,
  casasDecimais = 0,
): string => `${valor.toFixed(casasDecimais)}%`;
