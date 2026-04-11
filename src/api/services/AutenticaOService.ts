/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AuthResponseDTO } from '../models/AuthResponseDTO';
import type { ReativarContaRequestDTO } from '../models/ReativarContaRequestDTO';
import type { ReenviarCodigoRequestDTO } from '../models/ReenviarCodigoRequestDTO';
import type { ResetarSenhaRequestDTO } from '../models/ResetarSenhaRequestDTO';
import type { SolicitarRecuperacaoSenhaRequestDTO } from '../models/SolicitarRecuperacaoSenhaRequestDTO';
import type { UsuarioLoginRequestDTO } from '../models/UsuarioLoginRequestDTO';
import type { UsuarioRegistroRequestDTO } from '../models/UsuarioRegistroRequestDTO';
import type { UsuarioResponseDTO } from '../models/UsuarioResponseDTO';
import type { VerificarEmailRequestDTO } from '../models/VerificarEmailRequestDTO';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AutenticaOService {
    /**
     * Verificar e-mail
     * Valida a conta do usuário usando o código de 6 dígitos enviado por e-mail.
     * @param requestBody
     * @returns string OK
     * @throws ApiError
     */
    public static verificarEmail(
        requestBody: VerificarEmailRequestDTO,
    ): CancelablePromise<string> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/auth/verificar-email',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Solicitar recuperação de senha
     * Envia um link de recuperação de senha para o e-mail informado.
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
     * Resetar senha
     * Redefine a senha do usuário usando o token de recuperação enviado por e-mail.
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
     * Registrar novo usuário
     * Cria uma conta pendente de verificação.
     * @param requestBody
     * @returns UsuarioResponseDTO OK
     * @throws ApiError
     */
    public static registrar(
        requestBody: UsuarioRegistroRequestDTO,
    ): CancelablePromise<UsuarioResponseDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/auth/registrar',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Renovar token
     * Gera um novo access token a partir de um refresh token válido.
     * @param requestBody
     * @returns AuthResponseDTO OK
     * @throws ApiError
     */
    public static refresh(
        requestBody: Record<string, string>,
    ): CancelablePromise<AuthResponseDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/auth/refresh',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Reenviar código
     * Gera um novo código de ativação e reenvia para o e-mail do usuário.
     * @param requestBody
     * @returns string OK
     * @throws ApiError
     */
    public static reenviarCodigo(
        requestBody: ReenviarCodigoRequestDTO,
    ): CancelablePromise<string> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/auth/reenviar-codigo',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Reativar conta
     * Reativa uma conta desativada após confirmação de identidade via senha.
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
     * Login de usuário
     * Autentica o usuário e retorna os tokens de acesso e renovação.
     * @param requestBody
     * @returns AuthResponseDTO OK
     * @throws ApiError
     */
    public static login(
        requestBody: UsuarioLoginRequestDTO,
    ): CancelablePromise<AuthResponseDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/auth/login',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Validar token de recuperação
     * Verifica se o token é válido e retorna o e-mail associado.
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
}
