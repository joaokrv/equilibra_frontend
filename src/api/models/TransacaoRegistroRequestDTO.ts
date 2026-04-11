/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type TransacaoRegistroRequestDTO = {
    descricao: string;
    valor: number;
    data: string;
    tipo: TransacaoRegistroRequestDTO.tipo;
    status?: TransacaoRegistroRequestDTO.status;
    metodoPagamento?: TransacaoRegistroRequestDTO.metodoPagamento;
    contaId?: number;
    cartaoId?: number;
    categoriaId?: number;
    numeroParcela?: number;
    totalParcelas?: number;
    idempotencyKey: string;
};
export namespace TransacaoRegistroRequestDTO {
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

