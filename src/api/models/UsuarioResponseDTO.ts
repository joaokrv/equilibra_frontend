/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type UsuarioResponseDTO = {
    id?: number;
    nome?: string;
    email?: string;
    isEmailVerificado?: boolean;
    celular?: string;
    moeda?: UsuarioResponseDTO.moeda;
};
export namespace UsuarioResponseDTO {
    export enum moeda {
        BRL = 'BRL',
        USD = 'USD',
    }
}

