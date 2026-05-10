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
     * @returns string OK
     * @throws ApiError
     */
    public static registrar(
        requestBody: UsuarioRegistroRequestDTO,
    ): CancelablePromise<string> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/auth/registrar',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Renovar token
     * Gera novo access token + rotaciona refresh token via cookie HttpOnly.
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
     * Logout
     * Invalida a sessão do usuário e remove o cookie de refresh token.
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
     * Autentica o usuário, seta refresh token em cookie HttpOnly e retorna access token.
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
    /**
     * Solicitar pré-registro
     * Inicia o fluxo de cadastro com OTP. Retorna registroId para validação.
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
     * Consultar status do OTP
     * Retorna o estado atual do pré-registro.
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
     * Solicitar ação de conta
     * Valida senha e envia OTP tipado para excluir ou desativar conta.
     * @param requestBody
     * @returns any OK
     * @throws ApiError
     */
    public static solicitarAcaoConta(
        requestBody: SolicitarAcaoContaRequestDTO,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/auth/solicitar-acao-conta',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Excluir conta
     * Confirma exclusão permanente da conta via senha + OTP.
     * @param requestBody
     * @returns any OK
     * @throws ApiError
     */
    public static excluirConta(
        requestBody: ConfirmarAcaoContaRequestDTO,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/auth/excluir-conta',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Desativar conta
     * Confirma desativação da conta via senha + OTP.
     * @param requestBody
     * @returns any OK
     * @throws ApiError
     */
    public static desativarConta(
        requestBody: ConfirmarAcaoContaRequestDTO,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/auth/desativar-conta',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
