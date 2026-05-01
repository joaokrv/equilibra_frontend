/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PageableObject } from './PageableObject';
import type { SortObject } from './SortObject';
import type { TransacaoResponseDTO } from './TransacaoResponseDTO';
export type PageTransacaoResponseDTO = {
    totalPages?: number;
    totalElements?: number;
    size?: number;
    content?: Array<TransacaoResponseDTO>;
    number?: number;
    first?: boolean;
    last?: boolean;
    sort?: SortObject;
    pageable?: PageableObject;
    numberOfElements?: number;
    empty?: boolean;
};

