/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type InvestimentoAtualizacaoRequestDTO = {
    descricao: string;
    meta?: number;
    tipoInvestimento: InvestimentoAtualizacaoRequestDTO.tipoInvestimento;
    tipoPersonalizado?: string;
};
export namespace InvestimentoAtualizacaoRequestDTO {
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

