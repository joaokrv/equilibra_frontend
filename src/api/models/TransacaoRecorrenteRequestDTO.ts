/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type TransacaoRecorrenteRequestDTO = {
    descricao: string;
    valor: number;
    tipo: TransacaoRecorrenteRequestDTO.tipo;
    metodoPagamento?: TransacaoRecorrenteRequestDTO.metodoPagamento;
    contaId: number;
    cartaoId?: number;
    categoriaId?: number;
    diaLancamento: number;
    dataInicio?: string;
    dataFim?: string;
};
export namespace TransacaoRecorrenteRequestDTO {
    export enum tipo {
        RECEITA = 'RECEITA',
        DESPESA = 'DESPESA',
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

