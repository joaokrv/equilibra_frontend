/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { UsuarioResponseDTO } from '../models/UsuarioResponseDTO';
import type { UsuarioAtualizacaoRequestDTO } from '../models/UsuarioAtualizacaoRequestDTO';
import type { PerfilResumoResponseDTO } from '../models/PerfilResumoResponseDTO';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export class PerfilService {

    /**
     * Obter dados do perfil logado
     * @returns UsuarioResponseDTO OK
     * @throws ApiError
     */
    public static getPerfil(): CancelablePromise<UsuarioResponseDTO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/usuarios/perfil/me',
        });
    }

    /**
     * Atualizar dados de perfil
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
     * Atualizar foto de perfil
     * @param formData 
     * @returns any OK
     * @throws ApiError
     */
    public static atualizarFoto(
        file: Blob,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/usuarios/perfil/me/foto',
            formData: {
                'file': file,
            },
        });
    }

    /**
     * Obter resumo financeiro consolidado
     * @returns PerfilResumoResponseDTO OK
     * @throws ApiError
     */
    public static obterResumo(): CancelablePromise<PerfilResumoResponseDTO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/usuarios/perfil/me/resumo',
        });
    }
}
