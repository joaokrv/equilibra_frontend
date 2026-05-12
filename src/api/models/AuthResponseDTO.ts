/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { OtpStatusResponseDTO } from './OtpStatusResponseDTO';
import type { UsuarioResponseDTO } from './UsuarioResponseDTO';
export type AuthResponseDTO = {
    accessToken?: string;
    refreshToken?: string;
    expiraEm?: number;
    usuario?: UsuarioResponseDTO;
    otpStatus?: OtpStatusResponseDTO;
};

