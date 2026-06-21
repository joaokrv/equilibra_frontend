/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AlterarSenhaRequestDTO } from '../models/AlterarSenhaRequestDTO';
import type { ConfirmarAlteracaoEmailRequestDTO } from '../models/ConfirmarAlteracaoEmailRequestDTO';
import type { FotoResponseDTO } from '../models/FotoResponseDTO';
import type { PerfilResumoResponseDTO } from '../models/PerfilResumoResponseDTO';
import type { SolicitarAlteracaoEmailRequestDTO } from '../models/SolicitarAlteracaoEmailRequestDTO';
import type { UsuarioAtualizacaoRequestDTO } from '../models/UsuarioAtualizacaoRequestDTO';
import type { UsuarioResponseDTO } from '../models/UsuarioResponseDTO';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class PerfilService {
    /**
     * Obter dados do perfil
     * Retorna os dados do usuário autenticado através do token.
     * @returns UsuarioResponseDTO OK
     * @throws ApiError
     */
    public static obterPerfil(): CancelablePromise<UsuarioResponseDTO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/usuarios/perfil/me',
        });
    }
    /**
     * Atualizar perfil
     * Atualiza nome, celular e preferência de moeda do usuário logado.
     * @param requestBody
     * @returns UsuarioResponseDTO OK
     * @throws ApiError
     */
    public static atualizarPerfil(
        requestBody: UsuarioAtualizacaoRequestDTO,
    ): CancelablePromise<UsuarioResponseDTO> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/usuarios/perfil/me',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Alterar senha
     * Altera a senha do usuário logado. Exige a senha atual para confirmação.
     * @param requestBody
     * @returns string OK
     * @throws ApiError
     */
    public static alterarSenha(
        requestBody: AlterarSenhaRequestDTO,
    ): CancelablePromise<string> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/usuarios/perfil/me/senha',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Confirmar alteração de e-mail
     * Valida o código OTP e efetiva a troca de e-mail.
     * @param requestBody
     * @returns string OK
     * @throws ApiError
     */
    public static confirmarAlteracaoEmail(
        requestBody: ConfirmarAlteracaoEmailRequestDTO,
    ): CancelablePromise<string> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/usuarios/perfil/me/confirmar-alteracao-email',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Solicitar alteração de e-mail
     * Valida a senha atual e envia código de verificação ao novo e-mail.
     * @param requestBody
     * @returns string OK
     * @throws ApiError
     */
    public static solicitarAlteracaoEmail(
        requestBody: SolicitarAlteracaoEmailRequestDTO,
    ): CancelablePromise<string> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/usuarios/perfil/me/solicitar-alteracao-email',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Upload de foto
     * Realiza o upload real da foto de perfil para armazenamento local.
     * @param formData
     * @returns any OK
     * @throws ApiError
     */
    public static atualizarFoto(
        formData?: {
            file: Blob;
        },
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/usuarios/perfil/me/foto',
            formData: formData,
            mediaType: 'multipart/form-data',
        });
    }
    /**
     * Obter foto
     * @returns FotoResponseDTO OK
     * @throws ApiError
     */
    public static obterFoto(): CancelablePromise<FotoResponseDTO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/usuarios/perfil/me/foto',
        });
    }
    /**
     * Remover foto
     * @returns any OK
     * @throws ApiError
     */
    public static removerFoto(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/usuarios/perfil/me/foto',
        });
    }
    /**
     * Obter balanço geral
     * Retorna o balanço consolidado para exibição no perfil.
     * @returns PerfilResumoResponseDTO OK
     * @throws ApiError
     */
    public static obterResumoFinanceiro(): CancelablePromise<PerfilResumoResponseDTO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/usuarios/perfil/me/resumo',
        });
    }
}
