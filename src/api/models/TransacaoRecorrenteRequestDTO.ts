export type TransacaoRecorrenteRequestDTO = {
    descricao: string;
    valor: number;
    tipo: 'RECEITA' | 'DESPESA';
    metodoPagamento?: string;
    contaId: number;
    cartaoId?: number;
    categoriaId?: number;
    diaLancamento: number;
    dataInicio?: string;
    dataFim?: string;
};
