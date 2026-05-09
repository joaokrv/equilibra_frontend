/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type TransacaoResponseDTO = {
    id?: number;
    descricao?: string;
    valor?: number;
    data?: string;
    tipo?: TransacaoResponseDTO.tipo;
    status?: TransacaoResponseDTO.status;
    metodoPagamento?: TransacaoResponseDTO.metodoPagamento;
    nomeCategoria?: string;
    categoriaId?: number;
    nomeConta?: string;
    contaId?: number;
    nomeCartao?: string;
    cartaoId?: number;
    isRecorrente?: boolean;
    numeroParcela?: number;
    totalParcelas?: number;
    isTransferencia?: boolean;
};
export namespace TransacaoResponseDTO {
    export enum tipo {
        RECEITA = 'RECEITA',
        DESPESA = 'DESPESA',
    }
    export enum status {
        PAGO = 'PAGO',
        PENDENTE = 'PENDENTE',
    }
    export enum metodoPagamento {
        CARTAO_CREDITO = 'CARTAO_CREDITO',
        PIX = 'PIX',
        VALE_ALIMENTACAO = 'VALE_ALIMENTACAO',
        DINHEIRO = 'DINHEIRO',
        TRANSFERENCIA = 'TRANSFERENCIA',
        BOLETO = 'BOLETO',
        CARTAO_DEBITO = 'CARTAO_DEBITO',
    }
}

