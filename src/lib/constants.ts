import { TransacaoResponseDTO } from '../api/models/TransacaoResponseDTO';
import { CartaoResponseDTO } from '../api/models/CartaoResponseDTO';

/**
 * Utilitário para mapeamento de Enums do Backend para labels amigáveis no Frontend.
 * Centraliza as traduções para garantir consistência e fácil manutenção.
 */

export const TIPO_TRANSACAO_LABELS: Record<TransacaoResponseDTO.tipo, string> = {
  [TransacaoResponseDTO.tipo.RECEITA]: 'Receita',
  [TransacaoResponseDTO.tipo.DESPESA]: 'Despesa',
};

export const STATUS_TRANSACAO_LABELS: Record<TransacaoResponseDTO.status, string> = {
  [TransacaoResponseDTO.status.PAGO]: 'Pago',
  [TransacaoResponseDTO.status.PENDENTE]: 'Pendente',
};

export const METODO_PAGAMENTO_LABELS: Record<TransacaoResponseDTO.metodoPagamento, string> = {
  [TransacaoResponseDTO.metodoPagamento.CARTAO_CREDITO]: 'Cartão de Crédito',
  [TransacaoResponseDTO.metodoPagamento.PIX]: 'Pix',
  [TransacaoResponseDTO.metodoPagamento.VALE_ALIMENTACAO]: 'Vale Alimentação',
  [TransacaoResponseDTO.metodoPagamento.DINHEIRO]: 'Dinheiro',
  [TransacaoResponseDTO.metodoPagamento.TRANSFERENCIA]: 'Transferência',
  [TransacaoResponseDTO.metodoPagamento.BOLETO]: 'Boleto',
  [TransacaoResponseDTO.metodoPagamento.CARTAO_DEBITO]: 'Cartão de Débito',
};

export const BANDEIRA_CARTAO_LABELS: Record<CartaoResponseDTO.bandeira, string> = {
  [CartaoResponseDTO.bandeira.VISA]: 'Visa',
  [CartaoResponseDTO.bandeira.MASTERCARD]: 'Mastercard',
  [CartaoResponseDTO.bandeira.ELO]: 'Elo',
  [CartaoResponseDTO.bandeira.AMERICAN_EXPRESS]: 'American Express',
  [CartaoResponseDTO.bandeira.DINERS_CLUB]: 'Diners Club',
  [CartaoResponseDTO.bandeira.HIPERCARD]: 'Hipercard',
  [CartaoResponseDTO.bandeira.NUBANK]: 'Nubank',
  [CartaoResponseDTO.bandeira.INTER]: 'Inter',
  [CartaoResponseDTO.bandeira.OUROCARD]: 'Ourocard',
  [CartaoResponseDTO.bandeira.DIGIO]: 'Digio',
  [CartaoResponseDTO.bandeira.C6_BANK]: 'C6 Bank',
  [CartaoResponseDTO.bandeira.BTG_PACTUAL]: 'BTG Pactual',
  [CartaoResponseDTO.bandeira.XP_INVESTIMENTOS]: 'XP Investimentos',
  [CartaoResponseDTO.bandeira.OUTROS]: 'Outros',
};
