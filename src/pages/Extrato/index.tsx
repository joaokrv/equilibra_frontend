import { useEffect, useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Receipt, ChevronLeft, ChevronRight, Loader2, TrendingUp, TrendingDown, Pencil, Trash2, Repeat, FileDown } from 'lucide-react';
import { MainLayout } from '../../components/layout/MainLayout';
import { SortIcon } from '../../components/icons/SortIcon';
import { TransacoesService } from '../../api/services/TransacoesService';
import { transacoesApi } from '../../lib/transacoesApi';
import { invalidateTransacaoQueries } from '../../lib/queryInvalidation';
import { ContasService } from '../../api/services/ContasService';
import { TransacaoResponseDTO } from '../../api/models/TransacaoResponseDTO';
import { TransactionModal } from '../../components/modals/TransactionModal';
import { DeleteConfirmationModal } from '../../components/modals/DeleteConfirmationModal';
import { ErrorState } from '../../components/ui/StateViews';
import { ReportModal } from '../../components/modals/ReportModal';
import { formatarMoeda } from '../../lib/formatters';
import { METODO_PAGAMENTO_LABELS, STATUS_TRANSACAO_LABELS } from '../../lib/constants';
import { getApiErrorMessage } from '../../lib/errorMessage';
import { useAuthStore } from '../../store/useAuthStore';
import { toast } from '../../store/useToastStore';
import { useI18nStore } from '../../store/useI18nStore';
import { toLocalDateStr } from '../../lib/dateUtils';

interface ExtratoPageProps {
  filtroTipo?: TransacaoResponseDTO.tipo;
  titulo?: string;
  descricao?: string;
}

type SortField = 'data' | 'descricao' | 'categoria' | 'status' | 'valor' | 'metodoPagamento';
type SortDirection = 'asc' | 'desc';

export const ExtratoPage = ({ filtroTipo, titulo, descricao }: ExtratoPageProps) => {
  const moeda = (useAuthStore((s) => s.user?.moeda) as 'BRL' | 'USD' | 'EUR') || 'BRL';
  const language = useI18nStore((s) => s.language);
  const tr = (pt: string, en: string) => (language === 'en-US' ? en : pt);
  const tituloPagina = titulo ?? tr('Extrato', 'Statement');
  const descricaoPagina = descricao ?? tr('Histórico completo de transações.', 'Complete transaction history.');

  const metodoLabel = (metodo: keyof typeof METODO_PAGAMENTO_LABELS) => {
    const enLabels: Partial<Record<keyof typeof METODO_PAGAMENTO_LABELS, string>> = {
      CARTAO_CREDITO: 'Credit Card', PIX: 'Pix', VALE_ALIMENTACAO: 'Meal Voucher',
      DINHEIRO: 'Cash', TRANSFERENCIA: 'Transfer', BOLETO: 'Bank Slip', CARTAO_DEBITO: 'Debit Card',
    };
    return language === 'en-US' ? (enLabels[metodo] ?? METODO_PAGAMENTO_LABELS[metodo]) : METODO_PAGAMENTO_LABELS[metodo];
  };

  const statusLabel = (status: keyof typeof STATUS_TRANSACAO_LABELS) => {
    const enLabels: Partial<Record<keyof typeof STATUS_TRANSACAO_LABELS, string>> = { PAGO: 'Paid', PENDENTE: 'Pending' };
    return language === 'en-US' ? (enLabels[status] ?? STATUS_TRANSACAO_LABELS[status]) : STATUS_TRANSACAO_LABELS[status];
  };

  const queryClient = useQueryClient();
  const hoje = new Date();
  const primeiroDiaDoMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

  const [dataInicio, setDataInicio] = useState(toLocalDateStr(primeiroDiaDoMes));
  const [dataFim, setDataFim] = useState(toLocalDateStr(hoje));
  const [tipoFiltro, setTipoFiltro] = useState<'RECEITA' | 'DESPESA' | ''>('');
  const [contaFiltro, setContaFiltro] = useState('');
  const [statusFiltro, setStatusFiltro] = useState<'PAGO' | 'PENDENTE' | ''>('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('');
  const [metodoPagamentoFiltro, setMetodoPagamentoFiltro] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(0);

  const [sortField, setSortField] = useState<SortField>('data');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [modalRelatorioAberto, setModalRelatorioAberto] = useState(false);

  const tipoContextoFixo = filtroTipo === TransacaoResponseDTO.tipo.RECEITA ? 'RECEITA'
    : (filtroTipo === TransacaoResponseDTO.tipo.DESPESA ? 'DESPESA' : 'GERAL');

  const [transacaoParaEditar, setTransacaoParaEditar] = useState<TransacaoResponseDTO | undefined>(undefined);
  const [modalEditarAberto, setModalEditarAberto] = useState(false);
  const [transacaoParaDeletar, setTransacaoParaDeletar] = useState<TransacaoResponseDTO | undefined>(undefined);

  const ano = Number(dataInicio.slice(0, 4));
  const mes = Number(dataInicio.slice(5, 7));

  const resetPage = () => setCurrentPage(0);

  const { data: transacoes = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['transacoes', ano, mes],
    queryFn: () => TransacoesService.listarMensal(ano, mes),
  });

  const { data: contasRaw = [] } = useQuery({
    queryKey: ['contas'],
    queryFn: () => ContasService.listarContas(),
  });

  const contasList = useMemo(() => {
    const arr = Array.isArray(contasRaw)
      ? contasRaw
      : Array.isArray((contasRaw as unknown as { content: unknown[] }).content)
        ? (contasRaw as unknown as { content: unknown[] }).content
        : [];
    return (arr as { id?: number; nome?: string }[])
      .filter((c) => c.id != null && c.nome != null)
      .map((c) => ({ id: c.id as number, nome: c.nome as string }));
  }, [contasRaw]);

  const deletarMutation = useMutation({
    mutationFn: ({ id, grupo }: { id: number; grupo: boolean }) => transacoesApi.excluir(id, grupo),
    onSuccess: () => {
      invalidateTransacaoQueries(queryClient);
      toast.success(tr('Transação excluída com sucesso.', 'Transaction deleted successfully.'));
      setTransacaoParaDeletar(undefined);
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, tr('Erro ao excluir a transação.', 'Error deleting transaction.')));
    },
  });

  const lista = transacoes;
  const listaSemTransferencias = lista.filter((t: TransacaoResponseDTO) => !t.isTransferencia);
  const listaBase = filtroTipo
    ? listaSemTransferencias.filter((t: TransacaoResponseDTO) => t.tipo === filtroTipo)
    : lista;

  const categorias = useMemo(() => {
    const set = new Set<string>();
    listaBase.forEach((t: TransacaoResponseDTO) => { if (t.nomeCategoria) set.add(t.nomeCategoria); });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transacoes, filtroTipo]);

  const metodos = useMemo(() => {
    const set = new Set<string>();
    listaBase.forEach((t: TransacaoResponseDTO) => { if (t.metodoPagamento) set.add(t.metodoPagamento); });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transacoes, filtroTipo]);

  useEffect(() => {
    if (lista.length >= 500) {
      toast.error(tr(
        'Muitas transações neste mês. Exibindo apenas as 500 primeiras. Use o Relatório para exportar todos os dados.',
        'Many transactions this month. Showing first 500 only. Use the Report feature to export all.'
      ));
    }
  }, [lista.length]);

  const filtradas = listaBase.filter((t: TransacaoResponseDTO) => {
    if (t.data && t.data < dataInicio) return false;
    if (t.data && t.data > dataFim) return false;
    if (!filtroTipo && tipoFiltro && t.tipo !== tipoFiltro) return false;
    if (contaFiltro && t.nomeConta !== contaFiltro) return false;
    if (statusFiltro && t.status !== statusFiltro) return false;
    if (categoriaFiltro && t.nomeCategoria !== categoriaFiltro) return false;
    if (metodoPagamentoFiltro && t.metodoPagamento !== metodoPagamentoFiltro) return false;
    return true;
  });

  const filtradasEOrdenadas = [...filtradas].sort((a: TransacaoResponseDTO, b: TransacaoResponseDTO) => {
    let cmp = 0;
    switch (sortField) {
      case 'data': {
        const dateA = a.data ? new Date(a.data).getTime() : -Infinity;
        const dateB = b.data ? new Date(b.data).getTime() : -Infinity;
        cmp = dateA - dateB;
        break;
      }
      case 'descricao': cmp = (a.descricao || '').localeCompare(b.descricao || ''); break;
      case 'categoria': cmp = (a.nomeCategoria || '').localeCompare(b.nomeCategoria || ''); break;
      case 'metodoPagamento': cmp = (a.metodoPagamento || '').localeCompare(b.metodoPagamento || ''); break;
      case 'status': cmp = (a.status || '').localeCompare(b.status || ''); break;
      case 'valor': {
        const valA = a.tipo === TransacaoResponseDTO.tipo.DESPESA ? -(a.valor || 0) : (a.valor || 0);
        const valB = b.tipo === TransacaoResponseDTO.tipo.DESPESA ? -(b.valor || 0) : (b.valor || 0);
        cmp = valA - valB;
        break;
      }
    }
    return sortDirection === 'asc' ? cmp : -cmp;
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const totalPages = Math.max(1, Math.ceil(filtradasEOrdenadas.length / pageSize));
  const paginadas = filtradasEOrdenadas.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

  const resumoBase = filtroTipo ? filtradas : listaSemTransferencias.filter((t: TransacaoResponseDTO) => {
    if (t.data && t.data < dataInicio) return false;
    if (t.data && t.data > dataFim) return false;
    return true;
  });

  const totalReceitas = resumoBase.filter((t: TransacaoResponseDTO) => t.tipo === TransacaoResponseDTO.tipo.RECEITA).reduce((s: number, t: TransacaoResponseDTO) => s + (t.valor ?? 0), 0);
  const totalDespesas = resumoBase.filter((t: TransacaoResponseDTO) => t.tipo === TransacaoResponseDTO.tipo.DESPESA).reduce((s: number, t: TransacaoResponseDTO) => s + (t.valor ?? 0), 0);
  const totalPendentes = resumoBase.filter((t: TransacaoResponseDTO) => t.status === TransacaoResponseDTO.status.PENDENTE).reduce((s: number, t: TransacaoResponseDTO) => s + (t.valor ?? 0), 0);
  const totalPagos = resumoBase.filter((t: TransacaoResponseDTO) => t.status === TransacaoResponseDTO.status.PAGO).reduce((s: number, t: TransacaoResponseDTO) => s + (t.valor ?? 0), 0);

  const abrirEditar = (t: TransacaoResponseDTO) => { setTransacaoParaEditar(t); setModalEditarAberto(true); };
  const fecharEditar = () => { setModalEditarAberto(false); setTransacaoParaEditar(undefined); };

  return (
    <MainLayout>
      <div className="p-3 sm:p-4 lg:p-6 space-y-5 sm:space-y-6 animate-in fade-in duration-500 relative">

        <div>
          <h1 className="text-2xl font-bold text-foreground">{tituloPagina}</h1>
          <p className="text-sm text-muted-foreground mt-1">{descricaoPagina}</p>
        </div>

        <div className="flex justify-end">
          <button
            onClick={() => setModalRelatorioAberto(true)}
            className="bg-primary/10 border-transparent text-primary hover:bg-primary/20 transition-all font-bold text-2xs uppercase tracking-wider px-6 rounded-xl flex items-center gap-2 h-[44px]"
          >
            <FileDown size={16} />
            {tr('Relatório', 'Report')}
          </button>
        </div>

        {!filtroTipo && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-card border border-border rounded-2xl p-4">
              <p className="text-2xs font-bold text-muted-foreground uppercase tracking-[0.2em]">{tr('Receitas', 'Income')}</p>
              <p className="text-xl font-bold text-success mt-1">{formatarMoeda(totalReceitas, moeda)}</p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-4">
              <p className="text-2xs font-bold text-muted-foreground uppercase tracking-[0.2em]">{tr('Despesas', 'Expenses')}</p>
              <p className="text-xl font-bold text-danger mt-1">{formatarMoeda(totalDespesas, moeda)}</p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-4">
              <p className="text-2xs font-bold text-muted-foreground uppercase tracking-[0.2em]">{tr('Balanço', 'Balance')}</p>
              <p className={`text-xl font-bold mt-1 ${totalReceitas - totalDespesas >= 0 ? 'text-success' : 'text-danger'}`}>
                {formatarMoeda(totalReceitas - totalDespesas, moeda)}
              </p>
            </div>
          </div>
        )}

        {filtroTipo && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-card border border-border rounded-2xl p-4">
              <p className="text-2xs font-bold text-muted-foreground uppercase tracking-[0.2em]">
                {tr('Total de', 'Total')} {filtroTipo === TransacaoResponseDTO.tipo.RECEITA ? tr('Receitas', 'Income') : tr('Despesas', 'Expenses')}
              </p>
              <p className={`text-xl sm:text-2xl font-bold mt-1 ${filtroTipo === TransacaoResponseDTO.tipo.RECEITA ? 'text-success' : 'text-danger'}`}>
                {formatarMoeda(filtroTipo === TransacaoResponseDTO.tipo.RECEITA ? totalReceitas : totalDespesas, moeda)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {language === 'en-US'
                  ? `${filtradas.length} transaction${filtradas.length !== 1 ? 's' : ''} in period`
                  : `${filtradas.length} transaç${filtradas.length !== 1 ? 'ões' : 'ão'} no período`}
              </p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-4">
              <p className="text-2xs font-bold text-muted-foreground uppercase tracking-[0.2em]">
                {filtroTipo === TransacaoResponseDTO.tipo.RECEITA ? tr('Recebido', 'Received') : tr('Pago', 'Paid')}
              </p>
              <p className={`text-xl sm:text-2xl font-bold mt-1 ${filtroTipo === TransacaoResponseDTO.tipo.RECEITA ? 'text-success' : 'text-danger'}`}>
                {formatarMoeda(totalPagos, moeda)}
              </p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-4">
              <p className="text-2xs font-bold text-muted-foreground uppercase tracking-[0.2em]">{tr('Pendente', 'Pending')}</p>
              <p className="text-xl sm:text-2xl font-bold mt-1 text-amber-400">{formatarMoeda(totalPendentes, moeda)}</p>
            </div>
          </div>
        )}

        <div className="bg-card border border-border rounded-2xl p-4 mb-4 flex flex-wrap gap-3 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-2xs font-bold text-muted-foreground uppercase tracking-[0.2em]">{tr('De', 'From')}</label>
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => { setDataInicio(e.target.value); resetPage(); }}
              className="bg-secondary/30 border border-foreground/5 rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-medium"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-2xs font-bold text-muted-foreground uppercase tracking-[0.2em]">{tr('Até', 'To')}</label>
            <input
              type="date"
              value={dataFim}
              onChange={(e) => { setDataFim(e.target.value); resetPage(); }}
              className="bg-secondary/30 border border-foreground/5 rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-medium"
            />
          </div>
          {!filtroTipo && (
            <div className="flex flex-col gap-1">
              <label className="text-2xs font-bold text-muted-foreground uppercase tracking-[0.2em]">{tr('Tipo', 'Type')}</label>
              <select
                value={tipoFiltro}
                onChange={(e) => { setTipoFiltro(e.target.value as 'RECEITA' | 'DESPESA' | ''); resetPage(); }}
                className="bg-secondary/30 border border-foreground/5 rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-medium appearance-none"
              >
                <option value="">{tr('Todos', 'All')}</option>
                <option value="RECEITA">{tr('Receitas', 'Income')}</option>
                <option value="DESPESA">{tr('Despesas', 'Expenses')}</option>
              </select>
            </div>
          )}
          <div className="flex flex-col gap-1">
            <label className="text-2xs font-bold text-muted-foreground uppercase tracking-[0.2em]">{tr('Status', 'Status')}</label>
            <select
              value={statusFiltro}
              onChange={(e) => { setStatusFiltro(e.target.value as 'PAGO' | 'PENDENTE' | ''); resetPage(); }}
              className="bg-secondary/30 border border-foreground/5 rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-medium appearance-none"
            >
              <option value="">{tr('Todos', 'All')}</option>
              <option value="PAGO">{tr('Pago', 'Paid')}</option>
              <option value="PENDENTE">{tr('Pendente', 'Pending')}</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-2xs font-bold text-muted-foreground uppercase tracking-[0.2em]">{tr('Conta', 'Account')}</label>
            <select
              value={contaFiltro}
              onChange={(e) => { setContaFiltro(e.target.value); resetPage(); }}
              className="bg-secondary/30 border border-foreground/5 rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-medium appearance-none"
            >
              <option value="">{tr('Todas', 'All')}</option>
              {contasList.map((c) => (
                <option key={c.id} value={c.nome}>{c.nome}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-2xs font-bold text-muted-foreground uppercase tracking-[0.2em]">{tr('Categoria', 'Category')}</label>
            <select
              value={categoriaFiltro}
              onChange={(e) => { setCategoriaFiltro(e.target.value); resetPage(); }}
              className="bg-secondary/30 border border-foreground/5 rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-medium appearance-none"
            >
              <option value="">{tr('Todas', 'All')}</option>
              {categorias.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-2xs font-bold text-muted-foreground uppercase tracking-[0.2em]">{tr('Método', 'Method')}</label>
            <select
              value={metodoPagamentoFiltro}
              onChange={(e) => { setMetodoPagamentoFiltro(e.target.value); resetPage(); }}
              className="bg-secondary/30 border border-foreground/5 rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-medium appearance-none"
            >
              <option value="">{tr('Todos', 'All')}</option>
              {metodos.map((m) => (
                <option key={m} value={m}>{metodoLabel(m as keyof typeof METODO_PAGAMENTO_LABELS)}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1 ml-auto">
            <label className="text-2xs font-bold text-muted-foreground uppercase tracking-[0.2em]">{tr('Por página', 'Per page')}</label>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); resetPage(); }}
              className="bg-secondary/30 border border-foreground/5 rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-medium appearance-none"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-48"><Loader2 className="animate-spin text-primary" size={32} /></div>
        ) : isError ? (
          <ErrorState
            title={tr('Não foi possível carregar as transações', 'Could not load transactions')}
            description={tr('Verifique sua conexão e tente novamente.', 'Check your connection and try again.')}
            retryLabel={tr('Tentar novamente', 'Try again')}
            onRetry={() => refetch()}
          />
        ) : paginadas.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-6 sm:p-10 lg:p-12 flex flex-col items-center justify-center gap-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary/50"><Receipt size={32} /></div>
            <p className="text-sm text-muted-foreground font-medium max-w-xs leading-relaxed">
              {tr('Nenhuma transação encontrada para este período.', 'No transactions found for this period.')}
            </p>
          </div>
        ) : (
          <div className="bg-card border border-border flex flex-col rounded-2xl overflow-hidden">
            <div className="w-full overflow-x-auto">
              <div className="w-full xl:min-w-max">
                <div className="hidden xl:grid xl:grid-cols-[40px_minmax(120px,1fr)_90px_100px_80px_70px_100px_70px] items-center gap-4 px-4 sm:px-6 py-4 bg-foreground/5 border-b border-foreground/5 select-none font-bold text-2xs uppercase text-muted-foreground tracking-widest z-10 w-full">
                  <div />
                  <div className="flex items-center gap-1 xl:gap-2 cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort('descricao')}>
                    <span>{tr('Nome', 'Name')}</span>
                    <SortIcon currentField={sortField} field="descricao" direction={sortDirection} />
                  </div>
                  <div className="flex items-center gap-1 xl:gap-2 cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort('categoria')}>
                    <span>{tr('Categoria', 'Category')}</span>
                    <SortIcon currentField={sortField} field="categoria" direction={sortDirection} />
                  </div>
                  <div className="flex items-center gap-1 xl:gap-2 cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort('metodoPagamento')}>
                    <span>{tr('Método', 'Method')}</span>
                    <SortIcon currentField={sortField} field="metodoPagamento" direction={sortDirection} />
                  </div>
                  <div className="flex justify-start items-center gap-1 xl:gap-2 cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort('data')}>
                    <span>{tr('Data', 'Date')}</span>
                    <SortIcon currentField={sortField} field="data" direction={sortDirection} />
                  </div>
                  <div className="flex justify-start items-center gap-1 xl:gap-2 cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort('status')}>
                    <span>{tr('Status', 'Status')}</span>
                    <SortIcon currentField={sortField} field="status" direction={sortDirection} />
                  </div>
                  <div className="flex items-center gap-1 xl:gap-2 cursor-pointer hover:text-foreground transition-colors justify-end pr-1 xl:pr-2" onClick={() => handleSort('valor')}>
                    <SortIcon currentField={sortField} field="valor" direction={sortDirection} />
                    <span>{tr('Valor', 'Value')}</span>
                  </div>
                  <div className="text-right pr-1 xl:pr-2">{tr('Ações', 'Actions')}</div>
                </div>

                <div className="flex-1 w-full bg-foreground/5">
                  {paginadas.map((t: TransacaoResponseDTO) => (
                    <div key={t.id} className="group relative flex flex-col xl:grid xl:grid-cols-[40px_minmax(120px,1fr)_90px_100px_80px_70px_100px_70px] xl:items-center gap-3 xl:gap-4 px-4 sm:px-6 py-4 hover:bg-foreground/5 transition-all outline-none border-b border-foreground/5 last:border-0 border-transparent">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        t.isTransferencia ? 'bg-sky-500/10 text-sky-500'
                        : t.tipo === TransacaoResponseDTO.tipo.RECEITA ? 'bg-success-muted text-success' : 'bg-danger-muted text-danger'
                      }`}>
                        {t.isTransferencia ? <Repeat size={18} /> : (t.tipo === TransacaoResponseDTO.tipo.RECEITA ? <TrendingUp size={18} /> : <TrendingDown size={18} />)}
                      </div>

                      <div className="flex flex-col justify-center min-w-0 pr-1 xl:pr-2">
                        <p className="text-sm xl:text-base font-bold text-foreground truncate">{t.descricao}</p>
                        {t.isRecorrente && (
                          <span className="block mt-1 sm:mt-1 xl:mt-0 max-w-fit items-center gap-1 text-2xs font-bold text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-md truncate">
                            <Repeat size={10} className="inline mr-1 mb-0.5" /> {tr('Fixa', 'Recurring')}
                          </span>
                        )}
                        {(t.totalParcelas ?? 0) > 1 && (
                          <span className="block mt-1 xl:mt-0 max-w-fit items-center text-2xs font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-md truncate">
                            {tr('Parcela', 'Installment')} {t.numeroParcela}/{t.totalParcelas}
                          </span>
                        )}
                      </div>

                      <div className="hidden xl:flex flex-col items-start gap-1 justify-center min-w-0 pr-1 xl:pr-2">
                        <span className="text-2xs text-muted-foreground bg-foreground/5 px-2 py-1 rounded w-full truncate uppercase tracking-wider font-semibold">
                          {t.nomeCategoria || 'Sem cat'}
                        </span>
                      </div>

                      <div className="hidden xl:flex flex-col items-start gap-1 justify-center min-w-0 pr-1 xl:pr-2">
                        {t.metodoPagamento ? (
                          <span className="text-2xs text-muted-foreground/80 font-semibold px-1 truncate w-full">
                            {metodoLabel(t.metodoPagamento)}
                          </span>
                        ) : (
                          <span className="text-2xs text-muted-foreground/30 px-1">—</span>
                        )}
                      </div>

                      <div className="hidden xl:flex justify-start text-xs text-muted-foreground font-medium min-w-0 truncate">
                        {t.data ? new Date(t.data + 'T12:00:00').toLocaleDateString(language, { day: '2-digit', month: '2-digit', year: 'numeric' }) : ''}
                      </div>

                      <div className="hidden xl:flex justify-start">
                        {t.status && (
                          <span className={`text-2xs uppercase tracking-wider font-bold px-1.5 xl:px-2 py-1 rounded w-[70px] text-center truncate ${
                            t.status === TransacaoResponseDTO.status.PAGO ? 'bg-success-muted text-success' : 'bg-amber-500/10 text-amber-400'
                          }`}>
                            {statusLabel(t.status)}
                          </span>
                        )}
                      </div>

                      <div className="hidden xl:flex justify-end pr-1 xl:pr-3 truncate">
                        <p className={`text-sm xl:text-base font-bold tabular-nums tracking-tight whitespace-nowrap truncate ${
                          t.isTransferencia ? 'text-sky-500' : t.tipo === TransacaoResponseDTO.tipo.RECEITA ? 'text-success' : 'text-danger'
                        }`}>
                          {t.isTransferencia ? '' : t.tipo === TransacaoResponseDTO.tipo.RECEITA ? '+' : ''} {formatarMoeda(t.valor ?? 0, moeda)}
                        </p>
                      </div>

                      <div className="hidden xl:flex items-center justify-end gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => abrirEditar(t)} className="p-1.5 xl:p-2 rounded-lg text-muted-foreground hover:bg-foreground/10 hover:text-primary transition-all" title={tr('Editar transação', 'Edit transaction')}>
                          <Pencil size={18} />
                        </button>
                        <button onClick={() => setTransacaoParaDeletar(t)} className="p-1.5 xl:p-2 rounded-lg text-muted-foreground hover:bg-danger-muted hover:text-danger transition-all" title={tr('Excluir transação', 'Delete transaction')}>
                          <Trash2 size={18} />
                        </button>
                      </div>

                      <div className="xl:hidden flex flex-col gap-2 mt-1 px-1 w-full border-t border-foreground/5 pt-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-2xs text-muted-foreground bg-foreground/5 px-2 py-1 rounded inline-flex uppercase tracking-wider font-semibold">
                              {t.nomeCategoria || 'S/Categoria'}
                            </span>
                            {t.metodoPagamento && (
                              <span className="text-2xs text-muted-foreground/80 font-semibold px-1 max-w-[80px] truncate">
                                {metodoLabel(t.metodoPagamento)}
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">
                            {t.data ? new Date(t.data + 'T12:00:00').toLocaleDateString(language, { day: '2-digit', month: 'short' }) : ''}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-1 pt-1">
                          {t.status && (
                            <span className={`text-2xs uppercase tracking-wider font-bold px-2 py-1 rounded ${
                              t.status === TransacaoResponseDTO.status.PAGO ? 'text-success bg-success-muted' : 'text-amber-400 bg-amber-500/10'
                            }`}>
                              {statusLabel(t.status)}
                            </span>
                          )}
                          <p className={`text-lg font-bold tabular-nums tracking-tight ${
                            t.isTransferencia ? 'text-sky-500' : t.tipo === TransacaoResponseDTO.tipo.RECEITA ? 'text-success' : 'text-danger'
                          }`}>
                            {t.isTransferencia ? '' : t.tipo === TransacaoResponseDTO.tipo.RECEITA ? '+' : ''} {formatarMoeda(t.valor ?? 0, moeda)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <button onClick={() => abrirEditar(t)} className="flex-1 py-2 bg-secondary/30 rounded-lg flex items-center justify-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors">
                            <Pencil size={14} /> {tr('Editar', 'Edit')}
                          </button>
                          <button onClick={() => setTransacaoParaDeletar(t)} className="flex-1 py-2 bg-danger-muted rounded-lg flex items-center justify-center gap-2 text-xs font-bold text-danger/80 hover:text-danger transition-colors">
                            <Trash2 size={14} /> {tr('Excluir', 'Delete')}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {!isLoading && !isError && filtradasEOrdenadas.length > 0 && (
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {filtradasEOrdenadas.length} {tr('registro(s)', 'record(s)')} · {tr('Página', 'Page')} {currentPage + 1} {tr('de', 'of')} {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                disabled={currentPage === 0}
                className="min-h-11 min-w-11 flex items-center justify-center rounded-lg border border-foreground/5 bg-secondary/30 disabled:opacity-30 hover:border-primary/40 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={currentPage >= totalPages - 1}
                className="min-h-11 min-w-11 flex items-center justify-center rounded-lg border border-foreground/5 bg-secondary/30 disabled:opacity-30 hover:border-primary/40 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      <ReportModal isOpen={modalRelatorioAberto} onClose={() => setModalRelatorioAberto(false)} tipoContextoFixo={tipoContextoFixo} />

      <TransactionModal isOpen={modalEditarAberto} onClose={fecharEditar} onSuccess={fecharEditar} transacaoParaEditar={transacaoParaEditar} />

      <DeleteConfirmationModal
        isOpen={!!transacaoParaDeletar}
        title={tr('Excluir Transação?', 'Delete Transaction?')}
        description={
          (transacaoParaDeletar?.totalParcelas ?? 0) > 1 ? (
            <>
              {tr('Esta é a parcela', 'This is installment')}{' '}
              <span className="text-foreground font-semibold">{transacaoParaDeletar?.numeroParcela}/{transacaoParaDeletar?.totalParcelas}</span>{' '}
              {tr('da compra', 'of the purchase')} <span className="text-foreground font-semibold">"{transacaoParaDeletar?.descricao}"</span>.
              <br />
              {tr('Escolha excluir apenas esta parcela ou a compra inteira (todas as parcelas).', 'Choose to delete only this installment or the entire purchase (all installments).')}
            </>
          ) : (
            <>
              {tr('Você está prestes a excluir', 'You are about to delete')} <span className="text-foreground font-semibold">"{transacaoParaDeletar?.descricao}"</span>.
              <br />
              {tr('Esta ação não pode ser desfeita e o impacto no saldo será revertido.', 'This action cannot be undone and the balance impact will be reverted.')}
            </>
          )
        }
        confirmText={(transacaoParaDeletar?.totalParcelas ?? 0) > 1 ? tr('EXCLUIR ESTA PARCELA', 'DELETE THIS INSTALLMENT') : tr('CONFIRMAR', 'CONFIRM')}
        loadingText={tr('EXCLUINDO...', 'DELETING...')}
        isLoading={deletarMutation.isPending}
        secondaryActionText={(transacaoParaDeletar?.totalParcelas ?? 0) > 1 ? tr('EXCLUIR A COMPRA INTEIRA', 'DELETE ENTIRE PURCHASE') : undefined}
        onSecondary={() => { if (!transacaoParaDeletar?.id) return; deletarMutation.mutate({ id: transacaoParaDeletar.id, grupo: true }); }}
        onCancel={() => { if (!deletarMutation.isPending) setTransacaoParaDeletar(undefined); }}
        onConfirm={() => { if (!transacaoParaDeletar?.id) return; deletarMutation.mutate({ id: transacaoParaDeletar.id, grupo: false }); }}
      />
    </MainLayout>
  );
};
