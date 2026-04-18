import type { AppLanguage } from '../store/useI18nStore';
import { usePrivacyStore } from '../store/usePrivacyStore';

const currencySymbols: Record<'BRL' | 'USD' | 'EUR', string> = {
  BRL: 'R$',
  USD: '$',
  EUR: '€',
};

const privacyMask = '******';

export const formatarMoeda = (valor: number, moeda: 'BRL' | 'USD' | 'EUR' = 'BRL'): string => {
  if (usePrivacyStore.getState().hideValues) {
    return `${currencySymbols[moeda]} ${privacyMask}`;
  }

  return new Intl.NumberFormat(moeda === 'BRL' ? 'pt-BR' : 'en-US', {
    style: 'currency',
    currency: moeda,
  }).format(valor);
};

export const getDateLocale = (language: AppLanguage): string =>
  language === 'en-US' ? 'en-US' : 'pt-BR';

export const formatarPorcentagem = (
  valor: number,
  casasDecimais = 0,
): string => `${valor.toFixed(casasDecimais)}%`;
