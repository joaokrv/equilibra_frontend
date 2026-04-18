/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type TransacaoRecorrenteResponseDTO = {
    id?: number;
    descricao?: string;
    valor?: number;
    tipo?: TransacaoRecorrenteResponseDTO.tipo;
    metodoPagamento?: TransacaoRecorrenteResponseDTO.metodoPagamento;
    nomeConta?: string;
    nomeCartao?: string;
    nomeCategoria?: string;
    diaLancamento?: number;
    dataInicio?: string;
    dataFim?: string;
    ativo?: boolean;
};
export namespace TransacaoRecorrenteResponseDTO {
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

