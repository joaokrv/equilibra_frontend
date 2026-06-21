/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { MovimentacaoInvestimentoResponseDTO } from './MovimentacaoInvestimentoResponseDTO';
import type { PageableObject } from './PageableObject';
import type { SortObject } from './SortObject';
export type PageMovimentacaoInvestimentoResponseDTO = {
    totalPages?: number;
    totalElements?: number;
    size?: number;
    content?: Array<MovimentacaoInvestimentoResponseDTO>;
    number?: number;
    first?: boolean;
    last?: boolean;
    numberOfElements?: number;
    sort?: SortObject;
    pageable?: PageableObject;
    empty?: boolean;
};

