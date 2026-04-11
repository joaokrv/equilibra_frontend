/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type CategoriaResponseDTO = {
    id?: number;
    nome?: string;
    tipo?: CategoriaResponseDTO.tipo;
};
export namespace CategoriaResponseDTO {
    export enum tipo {
        RECEITA = 'RECEITA',
        DESPESA = 'DESPESA',
    }
}

