/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { UsuarioResponseDTO } from './UsuarioResponseDTO';
import type { OtpStatusResponseDTO } from './OtpStatusResponseDTO';
export type AuthResponseDTO = {
    accessToken?: string;
    refreshToken?: string;
    expiresIn?: number;
    user?: UsuarioResponseDTO;
    otpStatus?: OtpStatusResponseDTO;
};

