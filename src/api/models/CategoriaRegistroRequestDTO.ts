/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type CategoriaRegistroRequestDTO = {
    nome: string;
    tipo: CategoriaRegistroRequestDTO.tipo;
};
export namespace CategoriaRegistroRequestDTO {
    export enum tipo {
        RECEITA = 'RECEITA',
        DESPESA = 'DESPESA',
    }
}

