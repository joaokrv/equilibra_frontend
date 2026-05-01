/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type RelatorioFiltroDTO = {
    dataInicio: string;
    dataFim: string;
    tipoFiltro: RelatorioFiltroDTO.tipoFiltro;
    statusTransacao?: RelatorioFiltroDTO.statusTransacao;
    dataFimValida?: boolean;
    intervaloValido?: boolean;
};
export namespace RelatorioFiltroDTO {
    export enum tipoFiltro {
        RECEITA = 'RECEITA',
        DESPESA = 'DESPESA',
        GERAL = 'GERAL',
    }
    export enum statusTransacao {
        PAGO = 'PAGO',
        PENDENTE = 'PENDENTE',
    }
}

