/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AuthResponseDTO } from '../models/AuthResponseDTO';
import type { ConfirmarAcaoContaRequestDTO } from '../models/ConfirmarAcaoContaRequestDTO';
import type { OtpStatusResponseDTO } from '../models/OtpStatusResponseDTO';
import type { ReativarContaRequestDTO } from '../models/ReativarContaRequestDTO';
import type { ReenviarCodigoRequestDTO } from '../models/ReenviarCodigoRequestDTO';
import type { ResetarSenhaRequestDTO } from '../models/ResetarSenhaRequestDTO';
import type { SolicitarAcaoContaRequestDTO } from '../models/SolicitarAcaoContaRequestDTO';
import type { SolicitarRecuperacaoSenhaRequestDTO } from '../models/SolicitarRecuperacaoSenhaRequestDTO';
import type { UsuarioLoginRequestDTO } from '../models/UsuarioLoginRequestDTO';
import type { UsuarioRegistroRequestDTO } from '../models/UsuarioRegistroRequestDTO';
import type { VerificarEmailRequestDTO } from '../models/VerificarEmailRequestDTO';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AutenticacaoService {
    /**
     * Verificar e-mail
     * @param requestBody
     * @returns any OK
     * @throws ApiError
     */
    public static verificarEmail(
        requestBody: VerificarEmailRequestDTO,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/auth/verificar-email',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Solicitar recuperação de senha
     * @param requestBody
     * @returns string OK
     * @throws ApiError
     */
    public static solicitarRecuperacao(
        requestBody: SolicitarRecuperacaoSenhaRequestDTO,
    ): CancelablePromise<string> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/auth/solicitar-recuperacao',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Solicitar ação de conta
     * @param requestBody
     * @returns any OK
     * @throws ApiError
     */
    public static solicitarAcaoConta(
        requestBody: SolicitarAcaoContaRequestDTO,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/auth/solicitar-acao-conta',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Resetar senha
     * @param requestBody
     * @returns string OK
     * @throws ApiError
     */
    public static resetarSenha(
        requestBody: ResetarSenhaRequestDTO,
    ): CancelablePromise<string> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/auth/resetar-senha',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Renovar token
     * @param refreshToken
     * @returns AuthResponseDTO OK
     * @throws ApiError
     */
    public static refresh(
        refreshToken?: string,
    ): CancelablePromise<AuthResponseDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/auth/refresh',
            cookies: {
                'refreshToken': refreshToken,
            },
        });
    }
    /**
     * Reenviar código
     * @param requestBody
     * @returns any OK
     * @throws ApiError
     */
    public static reenviarCodigo(
        requestBody: ReenviarCodigoRequestDTO,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/auth/reenviar-codigo',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Reativar conta
     * @param requestBody
     * @returns string OK
     * @throws ApiError
     */
    public static reativarConta(
        requestBody: ReativarContaRequestDTO,
    ): CancelablePromise<string> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/auth/reativar-conta',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Solicitar pré-registro
     * @param requestBody
     * @returns OtpStatusResponseDTO OK
     * @throws ApiError
     */
    public static preRegistrar(
        requestBody: UsuarioRegistroRequestDTO,
    ): CancelablePromise<OtpStatusResponseDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/auth/pre-registrar',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Logout
     * @param refreshToken
     * @returns any OK
     * @throws ApiError
     */
    public static logout(
        refreshToken?: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/auth/logout',
            cookies: {
                'refreshToken': refreshToken,
            },
        });
    }
    /**
     * Login de usuário
     * @param requestBody
     * @returns any OK
     * @throws ApiError
     */
    public static login(
        requestBody: UsuarioLoginRequestDTO,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/auth/login',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Desativar conta
     * @param requestBody
     * @returns any OK
     * @throws ApiError
     */
    public static desativarConta(
        requestBody: ConfirmarAcaoContaRequestDTO,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/auth/desativar-conta',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Validar token de recuperação
     * @param token
     * @returns string OK
     * @throws ApiError
     */
    public static validarToken(
        token: string,
    ): CancelablePromise<Record<string, string>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/auth/validar-token',
            query: {
                'token': token,
            },
        });
    }
    /**
     * Consultar status do OTP
     * @param registroId
     * @returns OtpStatusResponseDTO OK
     * @throws ApiError
     */
    public static getOtpStatus(
        registroId: string,
    ): CancelablePromise<OtpStatusResponseDTO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/auth/otp-status',
            query: {
                'registroId': registroId,
            },
        });
    }
    /**
     * Excluir conta
     * @param requestBody
     * @returns any OK
     * @throws ApiError
     */
    public static excluirConta(
        requestBody: ConfirmarAcaoContaRequestDTO,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/auth/excluir-conta',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
