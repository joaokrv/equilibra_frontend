/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type FaturaResponseDTO = {
    id?: number;
    cartaoId?: number;
    cartaoNome?: string;
    mes?: number;
    ano?: number;
    valorTotal?: number;
    valorPago?: number;
    valorRestante?: number;
    status?: FaturaResponseDTO.status;
    dataVencimento?: string;
    dataFechamento?: string;
};
export namespace FaturaResponseDTO {
    export enum status {
        ABERTA = 'ABERTA',
        FECHADA = 'FECHADA',
        PAGA = 'PAGA',
        ATRASADA = 'ATRASADA',
    }
}

