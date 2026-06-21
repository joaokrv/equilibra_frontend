/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class JobControllerService {
    /**
     * @param xJobToken
     * @returns any OK
     * @throws ApiError
     */
    public static executarLembreteFaturas(
        xJobToken?: string,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/internal/jobs/faturas/lembrar',
            headers: {
                'X-Job-Token': xJobToken,
            },
        });
    }
}
