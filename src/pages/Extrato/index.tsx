import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Receipt, ChevronLeft, ChevronRight, Loader2, TrendingUp, TrendingDown, Search, Pencil, Trash2, Repeat } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { MainLayout } from '../../components/layout/MainLayout';
import { TransaEsService } from '../../api/services/TransaEsService';
import { TransacaoResponseDTO } from '../../api/models/TransacaoResponseDTO';
import { TransactionModal } from '../../components/modals/TransactionModal';
import { DeleteConfirmationModal } from '../../components/modals/DeleteConfirmationModal';
import { formatarMoeda } from '../../lib/formatters';
import { METODO_PAGAMENTO_LABELS, STATUS_TRANSACAO_LABELS } from '../../lib/constants';
import { getApiErrorMessage } from '../../lib/errorMessage';
import { useAuthStore } from '../../store/useAuthStore';
import { toast } from '../../store/useToastStore';
import { useI18nStore } from '../../store/useI18nStore';

interface ExtratoPageProps {
  filtroTipo?: TransacaoResponseDTO.tipo;
  titulo?: string;
  descricao?: string;
}

export const ExtratoPage = ({ filtroTipo, titulo, descricao }: ExtratoPageProps) => {
  const moeda = (useAuthStore((s) => s.user?.moeda) as 'BRL' | 'USD' | 'EUR') || 'BRL';
  const language = useI18nStore((s) => s.language);
  const tr = (pt: string, en: string) => (language === 'en-US' ? en : pt);
  const tituloPagina = titulo ?? tr('Extrato', 'Statement');
  const descricaoPagina = descricao ?? tr('Histórico completo de transações.', 'Complete transaction history.');
  const metodoLabel = (metodo: keyof typeof METODO_PAGAMENTO_LABELS) => {
    const enLabels: Partial<Record<keyof typeof METODO_PAGAMENTO_LABELS, string>> = {
      CARTAO_CREDITO: 'Credit Card',
      PIX: 'Pix',
      VALE_ALIMENTACAO: 'Meal Voucher',
      DINHEIRO: 'Cash',
      TRANSFERENCIA: 'Transfer',
      BOLETO: 'Bank Slip',
      CARTAO_DEBITO: 'Debit Card',
    };
    return language === 'en-US' ? (enLabels[metodo] ?? METODO_PAGAMENTO_LABELS[metodo]) : METODO_PAGAMENTO_LABELS[metodo];
  };
  const statusLabel = (status: keyof typeof STATUS_TRANSACAO_LABELS) => {
    const enLabels: Partial<Record<keyof typeof STATUS_TRANSACAO_LABELS, string>> = {
      PAGO: 'Paid',
      PENDENTE: 'Pending',
    };
    return language === 'en-US' ? (enLabels[status] ?? STATUS_TRANSACAO_LABELS[status]) : STATUS_TRANSACAO_LABELS[status];
  };
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const buscaParam = searchParams.get('busca') ?? '';
  const hoje = new Date();
  const [ano, setAno] = useState(hoje.getFullYear());
  const [mes, setMes] = useState(hoje.getMonth() + 1);
  const [busca, setBusca] = useState(buscaParam);

  useEffect(() => {
    setBusca(buscaParam);
  }, [buscaParam]);

  // Edição
  const [transacaoParaEditar, setTransacaoParaEditar] = useState<TransacaoResponseDTO | undefined>(undefined);
  const [modalEditarAberto, setModalEditarAberto] = useState(false);

  // Exclusão
  const [transacaoParaDeletar, setTransacaoParaDeletar] = useState<TransacaoResponseDTO | undefined>(undefined);

  const { data: transacoes = [], isLoading } = useQuery({
    queryKey: ['transacoes', ano, mes],
    queryFn: () => TransaEsService.listarPaginado({ page: 0, size: 500 }, ano, mes),
  });

  const deletarMutation = useMutation({
    mutationFn: (id: number) => TransaEsService.deletarTransacao(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transacoes'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success(tr('Transação excluída com sucesso.', 'Transaction deleted successfully.'));
      setTransacaoParaDeletar(undefined);
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, tr('Erro ao excluir a transação.', 'Error deleting transaction.')));
    },
  });

  const lista = Array.isArray(transacoes) ? transacoes : (transacoes as any)?.content ?? [];

  const filtradas = lista.filter((t: TransacaoResponseDTO) => {
    if (filtroTipo && t.tipo !== filtroTipo) return false;
    if (busca && !t.descricao?.toLowerCase().includes(busca.toLowerCase())) return false;
    return true;
  });

  const totalReceitas = filtradas.filter((t: TransacaoResponseDTO) => t.tipo === TransacaoResponseDTO.tipo.RECEITA).reduce((s: number, t: TransacaoResponseDTO) => s + (t.valor ?? 0), 0);
  const totalDespesas = filtradas.filter((t: TransacaoResponseDTO) => t.tipo === TransacaoResponseDTO.tipo.DESPESA).reduce((s: number, t: TransacaoResponseDTO) => s + (t.valor ?? 0), 0);

  const navMes = (dir: -1 | 1) => {
    let m = mes + dir;
    let a = ano;
    if (m < 1) { m = 12; a--; }
    if (m > 12) { m = 1; a++; }
    setMes(m);
    setAno(a);
  };

  const nomeMes = new Date(ano, mes - 1).toLocaleDateString(language, { month: 'long', year: 'numeric' });

  const handleBuscaChange = (valor: string) => {
    setBusca(valor);
    if (valor.trim()) {
      setSearchParams({ busca: valor });
    } else {
      setSearchParams({});
    }
  };

  const abrirEditar = (t: TransacaoResponseDTO) => {
    setTransacaoParaEditar(t);
    setModalEditarAberto(true);
  };

  const fecharEditar = () => {
    setModalEditarAberto(false);
    setTransacaoParaEditar(undefined);
  };

  return (
    <MainLayout>
      <div className="p-3 sm:p-4 lg:p-6 space-y-5 sm:space-y-6 animate-in fade-in duration-500">
        <div>
          <h1 className="text-2xl font-bold text-white">{tituloPagina}</h1>
          <p className="text-sm text-muted-foreground mt-1">{descricaoPagina}</p>
        </div>

        {/* Navegação por mês + busca */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-3 glass rounded-xl px-3 py-2">
            <button onClick={() => navMes(-1)} className="p-1 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-white transition-all"><ChevronLeft size={18} /></button>
            <span className="text-sm font-bold text-white capitalize min-w-[140px] text-center">{nomeMes}</span>
            <button onClick={() => navMes(1)} className="p-1 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-white transition-all"><ChevronRight size={18} /></button>
          </div>
          <div className="relative w-full sm:flex-1 sm:max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input type="text" value={busca} onChange={(e) => handleBuscaChange(e.target.value)} placeholder={tr('Buscar transação...', 'Search transaction...')} className="w-full bg-secondary/30 border border-white/5 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-medium placeholder:text-muted-foreground/30" />
          </div>
        </div>

        {/* Resumo */}
        {!filtroTipo && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass rounded-2xl p-4">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">{tr('Receitas', 'Income')}</p>
              <p className="text-xl font-bold text-emerald-400 mt-1">{formatarMoeda(totalReceitas, moeda)}</p>
            </div>
            <div className="glass rounded-2xl p-4">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">{tr('Despesas', 'Expenses')}</p>
              <p className="text-xl font-bold text-rose-400 mt-1">{formatarMoeda(totalDespesas, moeda)}</p>
            </div>
            <div className="glass rounded-2xl p-4">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">{tr('Balanço', 'Balance')}</p>
              <p className={`text-xl font-bold mt-1 ${totalReceitas - totalDespesas >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {formatarMoeda(totalReceitas - totalDespesas, moeda)}
              </p>
            </div>
          </div>
        )}

        {filtroTipo && (
          <div className="glass rounded-2xl p-4">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
              {tr('Total de', 'Total')} {filtroTipo === TransacaoResponseDTO.tipo.RECEITA ? tr('Receitas', 'Income') : tr('Despesas', 'Expenses')}
            </p>
            <p className={`text-2xl font-bold mt-1 ${filtroTipo === TransacaoResponseDTO.tipo.RECEITA ? 'text-emerald-400' : 'text-rose-400'}`}>
              {formatarMoeda(filtroTipo === TransacaoResponseDTO.tipo.RECEITA ? totalReceitas : totalDespesas, moeda)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {language === 'en-US'
                ? `${filtradas.length} transaction${filtradas.length !== 1 ? 's' : ''} in month`
                : `${filtradas.length} transaç${filtradas.length !== 1 ? 'ões' : 'ão'} no mês`}
            </p>
          </div>
        )}

        {/* Lista */}
        {isLoading ? (
          <div className="flex items-center justify-center h-48"><Loader2 className="animate-spin text-primary" size={32} /></div>
        ) : filtradas.length === 0 ? (
          <div className="glass rounded-2xl p-6 sm:p-10 lg:p-12 flex flex-col items-center justify-center gap-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary/50"><Receipt size={32} /></div>
            <p className="text-sm text-muted-foreground font-medium max-w-xs leading-relaxed">
              {busca ? tr('Nenhuma transação encontrada para esta busca.', 'No transactions found for this search.') : tr('Nenhuma transação neste mês.', 'No transactions in this month.')}
            </p>
          </div>
        ) : (
          <div className="glass rounded-2xl divide-y divide-white/5 overflow-hidden">
            {filtradas.map((t: TransacaoResponseDTO) => (
              <div key={t.id} className="group flex items-center gap-3 sm:gap-4 px-3 sm:px-5 py-4 hover:bg-white/5 transition-all">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  t.tipo === TransacaoResponseDTO.tipo.RECEITA ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                }`}>
                  {t.tipo === TransacaoResponseDTO.tipo.RECEITA ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-white truncate">{t.descricao}</p>
                    {t.isRecorrente && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-full flex-shrink-0">
                        <Repeat size={10} /> {tr('Fixa', 'Recurring')}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {t.nomeCategoria && <span className="text-[10px] text-muted-foreground bg-white/5 px-2 py-0.5 rounded-full">{t.nomeCategoria}</span>}
                    {t.metodoPagamento && <span className="text-[10px] text-muted-foreground">{metodoLabel(t.metodoPagamento)}</span>}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`text-sm font-bold ${t.tipo === TransacaoResponseDTO.tipo.RECEITA ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {t.tipo === TransacaoResponseDTO.tipo.RECEITA ? '+' : '-'} {formatarMoeda(t.valor ?? 0, moeda)}
                  </p>
                  <div className="flex items-center gap-2 justify-end mt-0.5">
                    <span className="text-[10px] text-muted-foreground">
                      {t.data ? new Date(t.data + 'T00:00:00').toLocaleDateString(language, { day: '2-digit', month: 'short' }) : ''}
                    </span>
                    {t.status && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        t.status === TransacaoResponseDTO.status.PAGO ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                      }`}>
                        {statusLabel(t.status)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Ações — visíveis no hover */}
                <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <button
                    onClick={() => abrirEditar(t)}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-primary transition-all"
                    title={tr('Editar transação', 'Edit transaction')}
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => setTransacaoParaDeletar(t)}
                    className="p-1.5 rounded-lg hover:bg-rose-500/10 text-muted-foreground hover:text-rose-400 transition-all"
                    title={tr('Excluir transação', 'Delete transaction')}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Edição */}
      <TransactionModal
        isOpen={modalEditarAberto}
        onClose={fecharEditar}
        onSuccess={fecharEditar}
        transacaoParaEditar={transacaoParaEditar}
      />

      <DeleteConfirmationModal
        isOpen={!!transacaoParaDeletar}
        title={tr('Excluir Transação?', 'Delete Transaction?')}
        description={
          <>
            {tr('Você está prestes a excluir', 'You are about to delete')} <span className="text-white font-semibold">"{transacaoParaDeletar?.descricao}"</span>.
            <br />
            {tr('Esta ação não pode ser desfeita e o impacto no saldo será revertido.', 'This action cannot be undone and the balance impact will be reverted.')}
          </>
        }
        confirmText={tr('CONFIRMAR', 'CONFIRM')}
        loadingText={tr('EXCLUINDO...', 'DELETING...')}
        isLoading={deletarMutation.isPending}
        onCancel={() => {
          if (!deletarMutation.isPending) {
            setTransacaoParaDeletar(undefined);
          }
        }}
        onConfirm={() => {
          if (!transacaoParaDeletar?.id) return;
          deletarMutation.mutate(transacaoParaDeletar.id);
        }}
      />
    </MainLayout>
  );
};
