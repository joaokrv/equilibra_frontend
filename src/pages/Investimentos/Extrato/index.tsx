import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  TrendingDown, TrendingUp, Sparkles, ChevronLeft, ChevronRight,
  Loader2, Trash2, Filter,
} from 'lucide-react';
import { MainLayout } from '../../../components/layout/MainLayout';
import { ErrorState } from '../../../components/ui/StateViews';
import { DeleteConfirmationModal } from '../../../components/modals/DeleteConfirmationModal';
import { formatarMoeda } from '../../../lib/formatters';
import { getApiErrorMessage } from '../../../lib/errorMessage';
import { useAuthStore } from '../../../store/useAuthStore';
import { useI18nStore } from '../../../store/useI18nStore';
import { toast } from '../../../store/useToastStore';
import {
  movimentacoesInvestimentoApi,
  MovimentacaoInvestimentoItem,
  TipoMovimentacao,
} from '../../../lib/movimentacoesInvestimentoApi';

const TIPO_LABEL: Record<TipoMovimentacao, string> = {
  APORTE: 'Aporte',
  RESGATE: 'Resgate',
  RENDIMENTO: 'Rendimento',
};

const TIPO_ICON: Record<TipoMovimentacao, React.ReactNode> = {
  APORTE: <TrendingDown size={14} className="text-blue-400" />,
  RESGATE: <TrendingUp size={14} className="text-emerald-400" />,
  RENDIMENTO: <Sparkles size={14} className="text-purple-400" />,
};

const TIPO_COLOR: Record<TipoMovimentacao, string> = {
  APORTE: 'text-blue-400',
  RESGATE: 'text-emerald-400',
  RENDIMENTO: 'text-purple-400',
};

const PAGE_SIZES = [10, 20, 50] as const;

function toDateStr(d: Date) {
  return d.toISOString().split('T')[0];
}

export const InvestimentoExtratoPage = () => {
  const moeda = (useAuthStore((s) => s.user?.moeda) as 'BRL' | 'USD' | 'EUR') || 'BRL';
  const language = useI18nStore((s) => s.language);
  const tr = (pt: string, en: string) => (language === 'en-US' ? en : pt);
  const queryClient = useQueryClient();

  const hoje = new Date();
  const [dataInicio, setDataInicio] = useState(toDateStr(new Date(hoje.getTime() - 30 * 86400000)));
  const [dataFim, setDataFim] = useState(toDateStr(hoje));
  const [tipo, setTipo] = useState<TipoMovimentacao | ''>('');
  const [page, setPage] = useState(0);
  const [size, setSize] = useState<10 | 20 | 50>(10);
  const [paraExcluir, setParaExcluir] = useState<MovimentacaoInvestimentoItem | null>(null);

  const queryKey = ['mov-investimentos-extrato', dataInicio, dataFim, tipo, page, size];

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey,
    queryFn: () => movimentacoesInvestimentoApi.listar({
      dataInicio, dataFim,
      tipo: tipo || undefined,
      page, size,
    }),
  });

  const excluirMutation = useMutation({
    mutationFn: (id: number) => movimentacoesInvestimentoApi.excluir(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mov-investimentos-extrato'] });
      queryClient.invalidateQueries({ queryKey: ['mov-investimentos-preview'] });
      queryClient.invalidateQueries({ queryKey: ['investimentos'] });
      queryClient.invalidateQueries({ queryKey: ['patrimony-evolution'] });
      toast.success(tr('Movimentação excluída com sucesso.', 'Movement deleted successfully.'));
      setParaExcluir(null);
    },
    onError: (e: unknown) => toast.error(getApiErrorMessage(e, tr('Erro ao excluir.', 'Delete failed.'))),
  });

  const totalPages = data?.totalPages ?? 1;
  const totalElements = data?.totalElements ?? 0;
  const movs = data?.content ?? [];

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto px-4 pb-20">
        {/* Cabeçalho */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-white">
            {tr('Extrato de Investimentos', 'Investment Statement')}
          </h1>
          <p className="text-sm text-[#a0aec0] mt-1">
            {tr('Histórico de aportes, resgates e rendimentos.', 'History of contributions, withdrawals and earnings.')}
          </p>
        </div>

        {/* Filtros */}
        <div className="bg-[#15161e] border border-[#232431] rounded-2xl p-4 mb-4 flex flex-wrap gap-3 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[#5a667b] uppercase tracking-wide">
              {tr('De', 'From')}
            </label>
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => { setDataInicio(e.target.value); setPage(0); }}
              className="bg-[#0f1018] border border-[#2a2b3a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#b794f4]"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[#5a667b] uppercase tracking-wide">
              {tr('Até', 'To')}
            </label>
            <input
              type="date"
              value={dataFim}
              onChange={(e) => { setDataFim(e.target.value); setPage(0); }}
              className="bg-[#0f1018] border border-[#2a2b3a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#b794f4]"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[#5a667b] uppercase tracking-wide">
              {tr('Tipo', 'Type')}
            </label>
            <select
              value={tipo}
              onChange={(e) => { setTipo(e.target.value as TipoMovimentacao | ''); setPage(0); }}
              className="bg-[#0f1018] border border-[#2a2b3a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#b794f4]"
            >
              <option value="">{tr('Todos', 'All')}</option>
              <option value="APORTE">{tr('Aportes', 'Contributions')}</option>
              <option value="RESGATE">{tr('Resgates', 'Withdrawals')}</option>
              <option value="RENDIMENTO">{tr('Rendimentos', 'Earnings')}</option>
            </select>
          </div>
          <div className="flex flex-col gap-1 ml-auto">
            <label className="text-xs text-[#5a667b] uppercase tracking-wide">
              {tr('Por página', 'Per page')}
            </label>
            <select
              value={size}
              onChange={(e) => { setSize(Number(e.target.value) as 10 | 20 | 50); setPage(0); }}
              className="bg-[#0f1018] border border-[#2a2b3a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#b794f4]"
            >
              {PAGE_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* Conteúdo */}
        {isLoading && (
          <div className="flex justify-center py-16">
            <Loader2 size={28} className="animate-spin text-[#b794f4]" />
          </div>
        )}

        {isError && <ErrorState title="Erro ao carregar movimentações" onRetry={refetch} />}

        {!isLoading && !isError && movs.length === 0 && (
          <div className="bg-[#15161e] border border-[#232431] rounded-2xl p-12 text-center">
            <Filter size={36} className="text-[#3b2566] mx-auto mb-3" />
            <p className="text-[#a0aec0] text-sm">
              {tr('Nenhuma movimentação encontrada para o período.', 'No movements found for the selected period.')}
            </p>
          </div>
        )}

        {!isLoading && !isError && movs.length > 0 && (
          <>
            {/* Tabela — desktop */}
            <div className="hidden xl:block bg-[#15161e] border border-[#232431] rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#232431] text-[#5a667b] text-xs uppercase tracking-wide">
                    <th className="px-4 py-3 text-left">{tr('Tipo', 'Type')}</th>
                    <th className="px-4 py-3 text-left">{tr('Investimento', 'Investment')}</th>
                    <th className="px-4 py-3 text-left">{tr('Data', 'Date')}</th>
                    <th className="px-4 py-3 text-left">{tr('Conta', 'Account')}</th>
                    <th className="px-4 py-3 text-left">{tr('Observação', 'Notes')}</th>
                    <th className="px-4 py-3 text-right">{tr('Valor', 'Amount')}</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {movs.map((m) => (
                    <tr key={m.id} className="border-b border-[#1e1f2e] hover:bg-[#0f1018] transition-colors">
                      <td className="px-4 py-3">
                        <span className={`flex items-center gap-1.5 ${TIPO_COLOR[m.tipo]}`}>
                          {TIPO_ICON[m.tipo]}
                          {TIPO_LABEL[m.tipo]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-white font-medium">{m.descricaoInvestimento}</td>
                      <td className="px-4 py-3 text-[#a0aec0]">
                        {new Date(m.data + 'T00:00:00').toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-4 py-3 text-[#a0aec0]">{m.nomeContaOrigem ?? '—'}</td>
                      <td className="px-4 py-3 text-[#718096] max-w-[140px] truncate">{m.observacao ?? '—'}</td>
                      <td className={`px-4 py-3 text-right font-semibold ${m.valor < 0 ? 'text-red-400' : TIPO_COLOR[m.tipo]}`}>
                        {m.valor < 0 ? '−' : m.tipo === 'RESGATE' ? '−' : '+'}
                        {formatarMoeda(Math.abs(m.valor), moeda)}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setParaExcluir(m)}
                          className="opacity-40 hover:opacity-100 transition-opacity text-red-400"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Cards — mobile */}
            <div className="xl:hidden flex flex-col gap-2">
              {movs.map((m) => (
                <div key={m.id} className="bg-[#15161e] border border-[#232431] rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`flex items-center gap-1.5 text-sm font-medium ${TIPO_COLOR[m.tipo]}`}>
                      {TIPO_ICON[m.tipo]} {TIPO_LABEL[m.tipo]}
                    </span>
                    <span className={`font-bold ${m.valor < 0 ? 'text-red-400' : TIPO_COLOR[m.tipo]}`}>
                      {m.valor < 0 ? '−' : m.tipo === 'RESGATE' ? '−' : '+'}
                      {formatarMoeda(Math.abs(m.valor), moeda)}
                    </span>
                  </div>
                  <p className="text-white text-sm font-medium">{m.descricaoInvestimento}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-[#718096]">
                      {new Date(m.data + 'T00:00:00').toLocaleDateString('pt-BR')}
                      {m.nomeContaOrigem ? ` · ${m.nomeContaOrigem}` : ''}
                    </span>
                    <button
                      onClick={() => setParaExcluir(m)}
                      className="text-red-400 opacity-60 hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  {m.observacao && (
                    <p className="text-xs text-[#718096] mt-1 italic">{m.observacao}</p>
                  )}
                </div>
              ))}
            </div>

            {/* Paginação */}
            <div className="flex items-center justify-between mt-4 text-sm text-[#a0aec0]">
              <span>
                {totalElements} {tr('registro(s)', 'record(s)')} · {tr('Página', 'Page')} {page + 1} {tr('de', 'of')} {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="min-h-11 min-w-11 flex items-center justify-center rounded-lg border border-[#2a2b3a] bg-[#0f1018] disabled:opacity-30 hover:border-[#b794f4] transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="min-h-11 min-w-11 flex items-center justify-center rounded-lg border border-[#2a2b3a] bg-[#0f1018] disabled:opacity-30 hover:border-[#b794f4] transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal exclusão */}
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
    </MainLayout>
  );
};
