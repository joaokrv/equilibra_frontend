import { useState, useMemo, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  TrendingDown, TrendingUp, ChevronLeft, ChevronRight,
  Loader2, Trash2, Pencil, X, FileDown, Sparkles, Filter,
} from 'lucide-react';
import { MainLayout } from '../../../components/layout/MainLayout';
import { ErrorState } from '../../../components/ui/StateViews';
import { DeleteConfirmationModal } from '../../../components/modals/DeleteConfirmationModal';
import { MovimentacaoInvestimentoModal } from '../../../components/modals/MovimentacaoInvestimentoModal';
import { InvestimentoReportModal } from '../../../components/modals/InvestimentoReportModal';
import { SortIcon } from '../../../components/icons/SortIcon';
import { useModalA11y } from '../../../hooks/useModalA11y';
import { formatarMoeda } from '../../../lib/formatters';
import { getApiErrorMessage } from '../../../lib/errorMessage';
import { useAuthStore } from '../../../store/useAuthStore';
import { useI18nStore } from '../../../store/useI18nStore';
import { toast } from '../../../store/useToastStore';
import { ContasService } from '../../../api/services/ContasService';
import { toLocalDateStr } from '../../../lib/dateUtils';
import { invalidateInvestmentQueries } from '../../../lib/queryInvalidation';
import {
  movimentacoesInvestimentoApi,
  MovimentacaoInvestimentoItem,
  TipoMovimentacao,
  MovimentacaoAtualizacaoPayload,
} from '../../../lib/movimentacoesInvestimentoApi';

const TIPO_LABEL: Record<TipoMovimentacao, string> = {
  APORTE: 'Aporte',
  RESGATE: 'Resgate',
  RENDIMENTO: 'Rendimento',
};

const TIPO_ICON: Record<TipoMovimentacao, React.ReactNode> = {
  APORTE: <TrendingDown size={14} className="text-blue-400" />,
  RESGATE: <TrendingUp size={14} className="text-success" />,
  RENDIMENTO: <Sparkles size={14} className="text-primary" />,
};

const TIPO_COLOR: Record<TipoMovimentacao, string> = {
  APORTE: 'text-blue-400',
  RESGATE: 'text-success',
  RENDIMENTO: 'text-primary',
};

const PAGE_SIZES = [10, 20, 50] as const;

type SortField = 'tipo' | 'investimento' | 'data' | 'conta' | 'valor';
type SortDirection = 'asc' | 'desc';

export const InvestimentoExtratoPage = () => {
  const moeda = (useAuthStore((s) => s.user?.moeda) as 'BRL' | 'USD' | 'EUR') || 'BRL';
  const language = useI18nStore((s) => s.language);
  const tr = (pt: string, en: string) => (language === 'en-US' ? en : pt);
  const queryClient = useQueryClient();

  const hoje = new Date();
  const primeiroDiaDoMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const [dataInicio, setDataInicio] = useState(toLocalDateStr(primeiroDiaDoMes));
  const [dataFim, setDataFim] = useState(toLocalDateStr(hoje));
  const [tipo, setTipo] = useState<TipoMovimentacao | ''>('');
  const [contaFiltro, setContaFiltro] = useState('');
  const [page, setPage] = useState(0);
  const [size, setSize] = useState<10 | 20 | 50>(10);

  const [sortField, setSortField] = useState<SortField>('data');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const [paraExcluir, setParaExcluir] = useState<MovimentacaoInvestimentoItem | null>(null);

  const [modalMovimentacaoAberto, setModalMovimentacaoAberto] = useState(false);
  const [modalRelatorioAberto, setModalRelatorioAberto] = useState(false);

  useEffect(() => {
    const abrir = () => setModalMovimentacaoAberto(true);
    window.addEventListener('abrir-modal-movimentacao-investimento', abrir);
    return () => window.removeEventListener('abrir-modal-movimentacao-investimento', abrir);
  }, []);

  const [paraEditar, setParaEditar] = useState<MovimentacaoInvestimentoItem | null>(null);
  const [editValor, setEditValor] = useState('');
  const [editData, setEditData] = useState('');
  const [editContaId, setEditContaId] = useState('');
  const [editObs, setEditObs] = useState('');

  function abrirEditar(m: MovimentacaoInvestimentoItem) {
    setParaEditar(m);
    setEditValor(String(Math.abs(m.valor)));
    setEditData(m.data);
    setEditContaId('');
    setEditObs(m.observacao ?? '');
  }
  function fecharEditar() { setParaEditar(null); }

  const modalEditarRef = useModalA11y(!!paraEditar, fecharEditar);

  const queryKey = ['mov-investimentos-extrato', dataInicio, dataFim, tipo, page, size];

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey,
    queryFn: () => movimentacoesInvestimentoApi.listar({
      dataInicio, dataFim,
      tipo: tipo || undefined,
      page, size,
    }),
  });

  const { data: contas = [] } = useQuery({
    queryKey: ['contas'],
    queryFn: () => ContasService.listarContas(),
  });

  const ensureArray = <T,>(value: unknown): T[] => {
    if (Array.isArray(value)) return value as T[];
    if (value && typeof value === 'object' && Array.isArray((value as unknown as { content: T[] }).content)) {
      return (value as unknown as { content: T[] }).content;
    }
    return [];
  };

  const contasList = ensureArray<{ id: number; nome: string; saldo?: number }>(contas);

  const totalPages = data?.totalPages ?? 1;
  const totalElements = data?.totalElements ?? 0;
  const movs = data?.content ?? [];

  const movsProcessados = useMemo(() => {
    let result = [...movs];

    if (contaFiltro) {
      result = result.filter((m) => m.nomeContaOrigem === contaFiltro);
    }

    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'tipo': cmp = a.tipo.localeCompare(b.tipo); break;
        case 'investimento': cmp = a.descricaoInvestimento.localeCompare(b.descricaoInvestimento); break;
        case 'data': cmp = a.data.localeCompare(b.data); break;
        case 'conta': cmp = (a.nomeContaOrigem ?? '').localeCompare(b.nomeContaOrigem ?? ''); break;
        case 'valor': cmp = Math.abs(a.valor) - Math.abs(b.valor); break;
      }
      return sortDirection === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [movs, contaFiltro, sortField, sortDirection]);

  const resumo = useMemo(() => {
    let aportado = 0;
    let resgatado = 0;
    let rendimentos = 0;
    movs.forEach((m) => {
      if (m.tipo === 'APORTE') aportado += Math.abs(m.valor);
      else if (m.tipo === 'RESGATE') resgatado += Math.abs(m.valor);
      else if (m.tipo === 'RENDIMENTO') rendimentos += m.valor;
    });
    return { aportado, resgatado, rendimentos };
  }, [movs]);

  const invalidarTudo = () => invalidateInvestmentQueries(queryClient);

  const excluirMutation = useMutation({
    mutationFn: (id: number) => movimentacoesInvestimentoApi.excluir(id),
    onSuccess: () => {
      invalidarTudo();
      toast.success(tr('Movimentação excluída com sucesso.', 'Movement deleted successfully.'));
      setParaExcluir(null);
    },
    onError: (e: unknown) => toast.error(getApiErrorMessage(e, tr('Erro ao excluir.', 'Delete failed.'))),
  });

  const editarMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: MovimentacaoAtualizacaoPayload }) =>
      movimentacoesInvestimentoApi.editar(id, payload),
    onSuccess: () => {
      invalidarTudo();
      toast.success(tr('Movimentação atualizada.', 'Movement updated.'));
      fecharEditar();
    },
    onError: (e: unknown) => toast.error(getApiErrorMessage(e, tr('Erro ao editar.', 'Update failed.'))),
  });

  function submitEditar() {
    if (!paraEditar || !editValor || !editData) return;
    editarMutation.mutate({
      id: paraEditar.id,
      payload: {
        valor: Number(editValor),
        data: editData,
        observacao: editObs.trim() || undefined,
        contaId: editContaId ? Number(editContaId) : undefined,
      },
    });
  }

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto px-4 pb-20">

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">
            {tr('Histórico de Investimentos', 'Investment History')}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {tr('Histórico de aportes, resgates e rendimentos.', 'History of contributions, withdrawals and earnings.')}
          </p>
        </div>

        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1" />
          <button
            onClick={() => setModalRelatorioAberto(true)}
            className="bg-primary/10 border border-transparent text-primary hover:bg-primary/20 transition-all font-bold text-2xs uppercase tracking-wider px-6 rounded-xl flex items-center gap-2 h-[44px]"
          >
            <FileDown size={16} />
            {tr('Relatório', 'Report')}
          </button>
        </div>

        {!isLoading && !isError && movs.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
            <div className="bg-card border border-border rounded-2xl p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                {tr('Total Aportado', 'Total Contributed')}
              </p>
              <p className="text-lg font-bold text-blue-400">{formatarMoeda(resumo.aportado, moeda)}</p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                {tr('Total Resgatado', 'Total Withdrawn')}
              </p>
              <p className="text-lg font-bold text-success">{formatarMoeda(resumo.resgatado, moeda)}</p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                {tr('Rendimentos no período', 'Earnings in period')}
              </p>
              <p className={`text-lg font-bold ${resumo.rendimentos < 0 ? 'text-red-400' : 'text-primary'}`}>
                {resumo.rendimentos < 0 ? '−' : '+'}{formatarMoeda(Math.abs(resumo.rendimentos), moeda)}
              </p>
            </div>
          </div>
        )}

        <div className="bg-card border border-border rounded-2xl p-4 mb-4 flex flex-wrap gap-3 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground uppercase tracking-wide">
              {tr('De', 'From')}
            </label>
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => { setDataInicio(e.target.value); setPage(0); }}
              className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground uppercase tracking-wide">
              {tr('Até', 'To')}
            </label>
            <input
              type="date"
              value={dataFim}
              onChange={(e) => { setDataFim(e.target.value); setPage(0); }}
              className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground uppercase tracking-wide">
              {tr('Tipo', 'Type')}
            </label>
            <select
              value={tipo}
              onChange={(e) => { setTipo(e.target.value as TipoMovimentacao | ''); setPage(0); }}
              className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
            >
              <option value="">{tr('Todos', 'All')}</option>
              <option value="APORTE">{tr('Aportes', 'Contributions')}</option>
              <option value="RESGATE">{tr('Resgates', 'Withdrawals')}</option>
              <option value="RENDIMENTO">{tr('Rendimentos', 'Earnings')}</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground uppercase tracking-wide">
              {tr('Conta', 'Account')}
            </label>
            <select
              value={contaFiltro}
              onChange={(e) => setContaFiltro(e.target.value)}
              className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
            >
              <option value="">{tr('Todas', 'All')}</option>
              {contasList.map((c) => (
                <option key={c.id} value={c.nome}>{c.nome}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1 ml-auto">
            <label className="text-xs text-muted-foreground uppercase tracking-wide">
              {tr('Por página', 'Per page')}
            </label>
            <select
              value={size}
              onChange={(e) => { setSize(Number(e.target.value) as 10 | 20 | 50); setPage(0); }}
              className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
            >
              {PAGE_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {isLoading && (
          <div className="flex justify-center py-16">
            <Loader2 size={28} className="animate-spin text-primary" />
          </div>
        )}

        {isError && <ErrorState title="Erro ao carregar movimentações" onRetry={refetch} />}

        {!isLoading && !isError && movsProcessados.length === 0 && (
          <div className="bg-card border border-border rounded-2xl p-12 text-center">
            <Filter size={36} className="text-primary/40 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">
              {tr('Nenhuma movimentação encontrada para o período.', 'No movements found for the selected period.')}
            </p>
          </div>
        )}

        {!isLoading && !isError && movsProcessados.length > 0 && (
          <>
            <div className="hidden xl:block bg-card border border-border rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wide">
                    <th className="px-4 py-3 text-left">
                      <div className="flex items-center gap-1 cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort('tipo')}>
                        <span>{tr('Tipo', 'Type')}</span>
                        <SortIcon currentField={sortField} field="tipo" direction={sortDirection} />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left">
                      <div className="flex items-center gap-1 cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort('investimento')}>
                        <span>{tr('Investimento', 'Investment')}</span>
                        <SortIcon currentField={sortField} field="investimento" direction={sortDirection} />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left">
                      <div className="flex items-center gap-1 cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort('data')}>
                        <span>{tr('Data', 'Date')}</span>
                        <SortIcon currentField={sortField} field="data" direction={sortDirection} />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left">
                      <div className="flex items-center gap-1 cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort('conta')}>
                        <span>{tr('Conta', 'Account')}</span>
                        <SortIcon currentField={sortField} field="conta" direction={sortDirection} />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left">{tr('Observação', 'Notes')}</th>
                    <th className="px-4 py-3 text-right">
                      <div className="flex items-center gap-1 cursor-pointer hover:text-foreground transition-colors justify-end" onClick={() => handleSort('valor')}>
                        <SortIcon currentField={sortField} field="valor" direction={sortDirection} />
                        <span>{tr('Valor', 'Amount')}</span>
                      </div>
                    </th>
                    <th className="px-4 py-3 text-right text-muted-foreground">{tr('Ações', 'Actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {movsProcessados.map((m) => (
                    <tr key={m.id} className="border-b border-border hover:bg-background transition-colors">
                      <td className="px-4 py-3">
                        <span className={`flex items-center gap-1.5 ${TIPO_COLOR[m.tipo]}`}>
                          {TIPO_ICON[m.tipo]}
                          {TIPO_LABEL[m.tipo]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-foreground font-medium">{m.descricaoInvestimento}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(m.data + 'T00:00:00').toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{m.nomeContaOrigem ?? '—'}</td>
                      <td className="px-4 py-3 text-muted-foreground max-w-[140px] truncate">{m.observacao ?? '—'}</td>
                      <td className={`px-4 py-3 text-right font-semibold ${m.valor < 0 ? 'text-red-400' : TIPO_COLOR[m.tipo]}`}>
                        {m.valor < 0 ? '−' : m.tipo === 'RESGATE' ? '−' : '+'}
                        {formatarMoeda(Math.abs(m.valor), moeda)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => abrirEditar(m)}
                            className="opacity-40 hover:opacity-100 transition-opacity text-primary min-h-11 min-w-11 flex items-center justify-center"
                            aria-label={tr('Editar', 'Edit')}
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => setParaExcluir(m)}
                            className="opacity-40 hover:opacity-100 transition-opacity text-red-400 min-h-11 min-w-11 flex items-center justify-center"
                            aria-label={tr('Excluir', 'Delete')}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="xl:hidden flex flex-col gap-2">
              {movsProcessados.map((m) => (
                <div key={m.id} className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`flex items-center gap-1.5 text-sm font-medium ${TIPO_COLOR[m.tipo]}`}>
                      {TIPO_ICON[m.tipo]} {TIPO_LABEL[m.tipo]}
                    </span>
                    <span className={`font-bold ${m.valor < 0 ? 'text-red-400' : TIPO_COLOR[m.tipo]}`}>
                      {m.valor < 0 ? '−' : m.tipo === 'RESGATE' ? '−' : '+'}
                      {formatarMoeda(Math.abs(m.valor), moeda)}
                    </span>
                  </div>
                  <p className="text-foreground text-sm font-medium">{m.descricaoInvestimento}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-muted-foreground">
                      {new Date(m.data + 'T00:00:00').toLocaleDateString('pt-BR')}
                      {m.nomeContaOrigem ? ` · ${m.nomeContaOrigem}` : ''}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => abrirEditar(m)}
                        className="text-primary opacity-60 hover:opacity-100 transition-opacity min-h-11 min-w-11 flex items-center justify-center"
                        aria-label={tr('Editar', 'Edit')}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => setParaExcluir(m)}
                        className="text-red-400 opacity-60 hover:opacity-100 transition-opacity min-h-11 min-w-11 flex items-center justify-center"
                        aria-label={tr('Excluir', 'Delete')}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  {m.observacao && (
                    <p className="text-xs text-muted-foreground mt-1 italic">{m.observacao}</p>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
              <span>
                {totalElements} {tr('registro(s)', 'record(s)')} · {tr('Página', 'Page')} {page + 1} {tr('de', 'of')} {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="min-h-11 min-w-11 flex items-center justify-center rounded-lg border border-border bg-background disabled:opacity-30 hover:border-primary transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="min-h-11 min-w-11 flex items-center justify-center rounded-lg border border-border bg-background disabled:opacity-30 hover:border-primary transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {paraExcluir && (
        <DeleteConfirmationModal
          isOpen={!!paraExcluir}
          onCancel={() => setParaExcluir(null)}
          onConfirm={() => excluirMutation.mutate(paraExcluir.id)}
          isLoading={excluirMutation.isPending}
          title={tr('Excluir movimentação', 'Delete movement')}
          description={tr(
            `Deseja excluir este ${TIPO_LABEL[paraExcluir.tipo].toLowerCase()} de ${formatarMoeda(Math.abs(paraExcluir.valor), moeda)}? O efeito financeiro será revertido.`,
            `Delete this ${TIPO_LABEL[paraExcluir.tipo].toLowerCase()} of ${formatarMoeda(Math.abs(paraExcluir.valor), moeda)}? The financial effect will be reversed.`,
          )}
        />
      )}

      <MovimentacaoInvestimentoModal
        isOpen={modalMovimentacaoAberto}
        onClose={() => setModalMovimentacaoAberto(false)}
      />

      <InvestimentoReportModal
        isOpen={modalRelatorioAberto}
        onClose={() => setModalRelatorioAberto(false)}
        dados={movsProcessados}
        dataInicio={dataInicio}
        dataFim={dataFim}
      />

      {paraEditar && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-overlay backdrop-blur-sm animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-label={tr('Editar movimentação', 'Edit movement')}
        >
          <div ref={modalEditarRef} className="glass w-full max-w-sm rounded-2xl p-6 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Pencil size={18} className={TIPO_COLOR[paraEditar.tipo]} />
                <h3 className="font-bold text-foreground">
                  {tr('Editar', 'Edit')} {TIPO_LABEL[paraEditar.tipo]}
                </h3>
              </div>
              <button onClick={fecharEditar} className="text-muted-foreground hover:text-foreground transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="bg-foreground/5 rounded-xl p-3">
              <p className="text-xs text-muted-foreground">{paraEditar.descricaoInvestimento}</p>
            </div>

            {(paraEditar.tipo === 'APORTE' || paraEditar.tipo === 'RESGATE') && (
              <p className="text-xs text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded-lg px-3 py-2">
                {tr(
                  'Editar um aporte ou resgate reverte e recria o lançamento na conta. Selecione a conta corretamente.',
                  'Editing a contribution or withdrawal reverses and recreates the entry in the account. Select the account carefully.',
                )}
              </p>
            )}

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-2xs font-bold text-muted-foreground uppercase tracking-[0.2em]">
                  {paraEditar.tipo === 'RENDIMENTO'
                    ? tr('Valor (negativo = perda)', 'Amount (negative = loss)')
                    : tr('Valor', 'Amount')}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={editValor}
                  onChange={(e) => setEditValor(e.target.value)}
                  min={paraEditar.tipo !== 'RENDIMENTO' ? '0.01' : undefined}
                  autoFocus
                  className="w-full bg-secondary/30 border border-foreground/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-2xs font-bold text-muted-foreground uppercase tracking-[0.2em]">
                  {tr('Data', 'Date')}
                </label>
                <input
                  type="date"
                  value={editData}
                  max={toLocalDateStr(new Date())}
                  onChange={(e) => setEditData(e.target.value)}
                  className="w-full bg-secondary/30 border border-foreground/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-medium"
                />
              </div>

              {(paraEditar.tipo === 'APORTE' || paraEditar.tipo === 'RESGATE') && (
                <div className="space-y-1.5">
                  <label className="block text-2xs font-bold text-muted-foreground uppercase tracking-[0.2em]">
                    {paraEditar.tipo === 'APORTE'
                      ? tr('Conta de Origem', 'Source Account')
                      : tr('Conta de Destino', 'Destination Account')}
                  </label>
                  <select
                    value={editContaId}
                    onChange={(e) => setEditContaId(e.target.value)}
                    className="w-full bg-secondary/30 border border-foreground/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-medium appearance-none"
                  >
                    <option value="" className="bg-card text-foreground">{tr('Selecione...', 'Select...')}</option>
                    {contasList.map((c) => (
                      <option key={c.id} value={c.id} className="bg-card text-foreground">
                        {c.nome}{c.saldo !== undefined ? ` — ${formatarMoeda(c.saldo, moeda)}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-2xs font-bold text-muted-foreground uppercase tracking-[0.2em]">
                  {tr('Observação (opcional)', 'Notes (optional)')}
                </label>
                <input
                  type="text"
                  value={editObs}
                  onChange={(e) => setEditObs(e.target.value)}
                  maxLength={255}
                  className="w-full bg-secondary/30 border border-foreground/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-medium placeholder:text-muted-foreground/30"
                />
              </div>
            </div>

            <button
              onClick={submitEditar}
              disabled={
                !editValor || !editData ||
                ((paraEditar.tipo === 'APORTE' || paraEditar.tipo === 'RESGATE') && !editContaId) ||
                editarMutation.isPending
              }
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 rounded-xl transition-all shadow-lg shadow-primary/20 active:scale-[0.98] text-sm disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {editarMutation.isPending
                ? <><Loader2 size={16} className="animate-spin" /> {tr('Salvando...', 'Saving...')}</>
                : <><Pencil size={16} /> {tr('Salvar alterações', 'Save changes')}</>}
            </button>
          </div>
        </div>
      )}
    </MainLayout>
  );
};
