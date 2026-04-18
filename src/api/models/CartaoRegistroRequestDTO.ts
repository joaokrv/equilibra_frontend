/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type CartaoRegistroRequestDTO = {
    nome: string;
    limite: number;
    diaFechamento: number;
    diaVencimento: number;
    bandeira: CartaoRegistroRequestDTO.bandeira;
    contaId?: number;
};
export namespace CartaoRegistroRequestDTO {
    export enum bandeira {
        VISA = 'VISA',
        MASTERCARD = 'MASTERCARD',
        ELO = 'ELO',
        AMERICAN_EXPRESS = 'AMERICAN_EXPRESS',
        DINERS_CLUB = 'DINERS_CLUB',
        HIPERCARD = 'HIPERCARD',
        NUBANK = 'NUBANK',
        INTER = 'INTER',
        SICREDI = 'SICREDI',
        OUROCARD = 'OUROCARD',
        DIGIO = 'DIGIO',
        C6_BANK = 'C6_BANK',
        BTG_PACTUAL = 'BTG_PACTUAL',
        XP_INVESTIMENTOS = 'XP_INVESTIMENTOS',
        OUTROS = 'OUTROS',
    }
}

