/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type MovimentacaoInvestimentoResponseDTO = {
    id?: number;
    tipo?: MovimentacaoInvestimentoResponseDTO.tipo;
    valor?: number;
    data?: string;
    descricaoInvestimento?: string;
    investimentoId?: number;
    nomeContaOrigem?: string;
    observacao?: string;
};
export namespace MovimentacaoInvestimentoResponseDTO {
    export enum tipo {
        APORTE = 'APORTE',
        RESGATE = 'RESGATE',
        RENDIMENTO = 'RENDIMENTO',
    }
}

