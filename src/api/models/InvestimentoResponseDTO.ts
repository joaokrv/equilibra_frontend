/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type InvestimentoResponseDTO = {
    id?: number;
    descricao?: string;
    tipoInvestimento?: InvestimentoResponseDTO.tipoInvestimento;
    tipoPersonalizado?: string;
    valorInicial?: number;
    valorAtual?: number;
    metaAtual?: number;
    nomeContaOrigem?: string;
    nomeContaDestino?: string;
};
export namespace InvestimentoResponseDTO {
    export enum tipoInvestimento {
        CDB = 'CDB',
        CDI = 'CDI',
        LCI = 'LCI',
        LCA = 'LCA',
        POUPANCA = 'POUPANCA',
        TESOURO_DIRETO = 'TESOURO_DIRETO',
        FUNDO_DI = 'FUNDO_DI',
        ACAO = 'ACAO',
        FII = 'FII',
        CRIPTO = 'CRIPTO',
        OUTRO = 'OUTRO',
    }
}

