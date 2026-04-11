export type TransacaoRecorrenteResponseDTO = {
    id?: number;
    descricao?: string;
    valor?: number;
    tipo?: 'RECEITA' | 'DESPESA';
    metodoPagamento?: string;
    nomeConta?: string;
    nomeCartao?: string;
    nomeCategoria?: string;
    diaLancamento?: number;
    dataInicio?: string;
    dataFim?: string;
    ativo?: boolean;
};
