/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type UsuarioAtualizacaoRequestDTO = {
    nome: string;
    celular?: string;
    moeda: UsuarioAtualizacaoRequestDTO.moeda;
};
export namespace UsuarioAtualizacaoRequestDTO {
    export enum moeda {
        BRL = 'BRL',
        USD = 'USD',
    }
}

