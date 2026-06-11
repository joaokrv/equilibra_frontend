import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Wallet, Plus, Trash2, X, Loader2, Pencil, Search } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MainLayout } from '../../components/layout/MainLayout';
import { ErrorState } from '../../components/ui/StateViews';
import { DeleteConfirmationModal } from '../../components/modals/DeleteConfirmationModal';
import { useModalA11y } from '../../hooks/useModalA11y';
import { ContasService } from '../../api/services/ContasService';
import { ContaResponseDTO } from '../../api/models/ContaResponseDTO';
import { investimentosApi } from '../../lib/investimentosApi';
import { formatarMoeda } from '../../lib/formatters';
import { getApiErrorMessage } from '../../lib/errorMessage';
import { toast } from '../../store/useToastStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useI18nStore } from '../../store/useI18nStore';

export const ContasPage = () => {
  const navigate = useNavigate();
  const language = useI18nStore((s) => s.language);
  const tr = (pt: string, en: string) => (language === 'en-US' ? en : pt);
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const buscaParam = searchParams.get('busca') ?? '';
  const moeda = (useAuthStore((s) => s.user?.moeda) as 'BRL' | 'USD' | 'EUR') || 'BRL';
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<ContaResponseDTO | null>(null);
  const [contaParaDeletar, setContaParaDeletar] = useState<{ id: number; nome: string } | null>(null);
  const [nome, setNome] = useState('');
  const [saldo, setSaldo] = useState('');
  const [investimentoInicial, setInvestimentoInicial] = useState('');
  const [maisDeUmInvestimento, setMaisDeUmInvestimento] = useState(false);
  const [deletandoId, setDeletandoId] = useState<number | null>(null);
  const [busca, setBusca] = useState(buscaParam);

  function fecharModal() {
    setModalAberto(false);
    setEditando(null);
    setNome('');
    setSaldo('');
    setInvestimentoInicial('');
    setMaisDeUmInvestimento(false);
  }

  const modalRef = useModalA11y(modalAberto, fecharModal);

  useEffect(() => {
    setBusca(buscaParam);
  }, [buscaParam]);

  useEffect(() => {
    const handleAbrir = () => {
      setModalAberto(true);
    };
    window.addEventListener('abrir-modal-conta', handleAbrir);
    return () => window.removeEventListener('abrir-modal-conta', handleAbrir);
  }, []);

  const { data: contas = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['contas'],
    queryFn: () => ContasService.listarContas(),
  });

  const { data: investimentos = [] } = useQuery({
    queryKey: ['investimentos'],
    queryFn: () => investimentosApi.listar(),
  });

  const ensureArray = <T,>(value: unknown): T[] => {
    if (Array.isArray(value)) return value as T[];
    if (value && typeof value === 'object' && Array.isArray((value as any).content)) {
      return (value as any).content as T[];
    }
    return [];
  };

  const contasList = ensureArray<ContaResponseDTO>(contas);
  const investimentosList = ensureArray<any>(investimentos);

  const criarMutation = useMutation({
    mutationFn: () =>
      ContasService.criarConta({
        nome: nome.trim(),
        saldo: (saldo ? Number(saldo) : 0) + (investimentoInicial ? Number(investimentoInicial) : 0),
      }),
    onSuccess: async (contaCriada: any) => {
      queryClient.invalidateQueries({ queryKey: ['contas'] });

      const valorInvestimentoInicial = Number(investimentoInicial || 0);
      if (valorInvestimentoInicial > 0 && contaCriada?.id) {
        try {
          await investimentosApi.criar({
            descricao: tr(`Investimento Inicial - ${nome.trim()}`, `Initial Investment - ${nome.trim()}`),
            valorInicial: valorInvestimentoInicial,
            meta: null,
            contaId: Number(contaCriada.id),
            tipoInvestimento: 'OUTRO',
            tipoPersonalizado: tr('Investimento Inicial', 'Initial Investment'),
          });
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: ['contas'] }),
            queryClient.invalidateQueries({ queryKey: ['investimentos'] }),
          ]);
          toast.success(tr('Conta e investimento inicial criados com sucesso.', 'Account and initial investment created successfully.'));
        } catch (error: unknown) {
          if (contaCriada?.id) {
            try {
              await ContasService.atualizarSaldo(Number(contaCriada.id), Number(saldo || 0));
              await queryClient.invalidateQueries({ queryKey: ['contas'] });
              toast.warning(getApiErrorMessage(
                error,
                tr(
                  'Conta criada, mas o investimento inicial falhou. O saldo da conta foi restaurado automaticamente.',
                  'Account created, but initial investment failed. The account balance was automatically restored.'
                )
              ));
            } catch {
              toast.error(tr(
                'Conta criada, mas o investimento inicial falhou e nao foi possivel restaurar o saldo automaticamente. Ajuste o saldo manualmente.',
                'Account created, but initial investment failed and balance could not be restored automatically. Please adjust the balance manually.'
              ));
            }
          }
        }
      } else {
        toast.success(tr(`Conta "${nome.trim()}" criada com sucesso.`, `Account "${nome.trim()}" created successfully.`));
      }

      if (maisDeUmInvestimento && contaCriada?.id) {
        toast.info(tr('Conta criada. Agora adicione os demais investimentos dessa conta.', 'Account created. Now add the remaining investments for this account.'));
        navigate(`/investimentos?contaId=${contaCriada.id}&origem=contas-iniciais`);
      }

      fecharModal();
    },
    onError: (error: unknown) =>
      toast.error(getApiErrorMessage(error, tr('Não foi possível criar a conta agora. Confira os dados e tente novamente.', 'Could not create account now. Please review the data and try again.'))),
  });

  const editarMutation = useMutation({
    mutationFn: () => ContasService.atualizarSaldo(editando!.id!, Number(saldo)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contas'] });
      toast.success(tr('Saldo atualizado com sucesso.', 'Balance updated successfully.'));
      fecharModal();
    },
    onError: (error: unknown) =>
      toast.error(getApiErrorMessage(error, tr('Não foi possível atualizar o saldo desta conta. Tente novamente em instantes.', 'Could not update this account balance. Please try again shortly.'))),
  });

  const deletarMutation = useMutation({
    mutationFn: (id: number) => ContasService.deletarConta(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contas'] });
      toast.success(tr('Conta removida.', 'Account removed.'));
      setDeletandoId(null);
      setContaParaDeletar(null);
    },
    onError: (error: unknown) => {
      toast.error(
        getApiErrorMessage(
          error,
          tr(
            'Não foi possível remover a conta. Para excluir, o saldo da conta deve estar zerado.',
            'Could not remove account. To delete it, the account balance must be zero.'
          )
        )
      );
      setDeletandoId(null);
      setContaParaDeletar(null);
    },
  });

  const abrirEdicao = (conta: ContaResponseDTO) => {
    setEditando(conta);
    setNome(conta.nome || '');
    setSaldo(String(conta.saldo ?? 0));
    setModalAberto(true);
  };

  const handleSalvar = () => {
    if (editando) editarMutation.mutate();
    else {
      if (!nome.trim()) return;
      criarMutation.mutate();
    }
  };

  const saldoInformado = Number(saldo || 0);
  const valorInvestimentoInformado = Number(investimentoInicial || 0);
  const saldoTotalInicial = saldoInformado + valorInvestimentoInformado;

  const handleDeletar = (id: number, nomeConta: string) => {
    setContaParaDeletar({ id, nome: nomeConta });
  };

  const saldoContas = contasList.reduce((acc, c) => acc + (c.saldo ?? 0), 0);
  const saldoInvestimentos = investimentosList.reduce((acc, i) => acc + (i.valorAtual ?? 0), 0);
  const saldoTotal = saldoContas + saldoInvestimentos;
  const investidoPorConta = investimentosList.reduce((acc, inv) => {
    const contaOrigem = (inv.nomeContaOrigem ?? '').trim();
    if (!contaOrigem) return acc;
    acc[contaOrigem] = (acc[contaOrigem] ?? 0) + (inv.valorAtual ?? 0);
    return acc;
  }, {} as Record<string, number>);
  const contasFiltradas = contasList.filter((conta) =>
    (conta.nome ?? '').toLowerCase().includes(busca.toLowerCase().trim())
  );

  const handleBuscaChange = (valor: string) => {
    setBusca(valor);
    if (valor.trim()) {
      setSearchParams({ busca: valor });
    } else {
      setSearchParams({});
    }
  };

  return (
    <MainLayout>
      <div className="p-3 sm:p-4 lg:p-6 space-y-5 sm:space-y-6 animate-in fade-in duration-500">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Minhas Contas</h1>
            <p className="text-sm text-muted-foreground mt-1">{tr('Gerencie suas contas bancárias e acompanhe seus saldos.', 'Manage your bank accounts and track your balances.')}</p>
          </div>
        </div>

        <div className="relative max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={busca}
            onChange={(e) => handleBuscaChange(e.target.value)}
            placeholder={tr('Buscar conta...', 'Search account...')}
            className="w-full bg-secondary/30 border border-white/5 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-medium placeholder:text-muted-foreground/30"
          />
        </div>

        <div className="glass rounded-2xl p-6">
          <p className="text-2xs font-bold text-muted-foreground uppercase tracking-[0.2em]">{tr('Saldo Total (Contas + Investimentos)', 'Total Balance (Accounts + Investments)')}</p>
          <p className={`text-2xl sm:text-3xl font-bold mt-1 ${saldoTotal >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatarMoeda(saldoTotal, moeda)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">{language === 'en-US' ? `${contasFiltradas.length} account${contasFiltradas.length !== 1 ? 's' : ''} shown` : `${contasFiltradas.length} conta${contasFiltradas.length !== 1 ? 's' : ''} exibida${contasFiltradas.length !== 1 ? 's' : ''}`}</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-48"><Loader2 className="animate-spin text-primary" size={32} /></div>
        ) : isError ? (
          <ErrorState
            title={tr('Não foi possível carregar as contas', 'Could not load accounts')}
            description={tr('Verifique sua conexão e tente novamente.', 'Check your connection and try again.')}
            retryLabel={tr('Tentar novamente', 'Try again')}
            onRetry={() => refetch()}
          />
        ) : contasFiltradas.length === 0 ? (
          <div className="glass rounded-2xl p-6 sm:p-10 lg:p-12 flex flex-col items-center justify-center gap-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary/50"><Wallet size={32} /></div>
            <p className="text-sm text-muted-foreground font-medium max-w-xs leading-relaxed">
              {busca.trim() ? tr('Nenhuma conta encontrada para esta busca.', 'No account found for this search.') : tr('Você ainda não tem contas cadastradas. Crie sua primeira conta para começar.', 'You do not have any accounts yet. Create your first account to get started.')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {contasFiltradas.map((conta) => {
              const investidoNaConta = investidoPorConta[conta.nome ?? ''] ?? 0;

              return (
                <div key={conta.id} className="glass rounded-2xl p-5 group hover:ring-1 hover:ring-primary/20 transition-all">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><Wallet size={18} /></div>
                      <div>
                        <p className="text-sm font-bold text-white">{conta.nome}</p>
                        <p className={`text-lg font-bold mt-0.5 ${(conta.saldo ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {formatarMoeda(conta.saldo ?? 0, moeda)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {tr('Investido:', 'Invested:')} <span className="font-bold text-primary">{formatarMoeda(investidoNaConta, moeda)}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <button onClick={() => abrirEdicao(conta)} className="min-h-11 min-w-11 sm:min-h-0 sm:min-w-0 p-2.5 sm:p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all flex items-center justify-center" aria-label={tr('Editar', 'Edit')}><Pencil size={14} /></button>
                      <button onClick={() => handleDeletar(conta.id!, conta.nome!)} disabled={deletandoId === conta.id} className="min-h-11 min-w-11 sm:min-h-0 sm:min-w-0 p-2.5 sm:p-1.5 rounded-lg text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition-all disabled:opacity-50 flex items-center justify-center" aria-label={tr('Remover', 'Remove')}>
                        {deletandoId === conta.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {modalAberto && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" role="dialog" aria-modal="true">
          <div ref={modalRef} className="glass w-full max-w-sm rounded-2xl p-6 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2"><Wallet size={18} className="text-primary" /><h3 className="font-bold text-white">{editando ? tr('Editar Saldo', 'Edit Balance') : tr('Nova Conta', 'New Account')}</h3></div>
              <button onClick={fecharModal} className="text-muted-foreground hover:text-white transition-colors"><X size={18} /></button>
            </div>
            <div className="space-y-4">
              {!editando && (
                <>
                  <div className="space-y-1.5">
                    <label className="block text-2xs font-bold text-muted-foreground uppercase tracking-[0.2em]">{tr('Nome', 'Name')}</label>
                    <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSalvar()} placeholder={tr('Ex: Nubank, Itaú...', 'e.g. Nubank, Chase...')} maxLength={50} autoFocus className="w-full bg-secondary/30 border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-medium placeholder:text-muted-foreground/30" />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-2xs font-bold text-muted-foreground uppercase tracking-[0.2em]">{tr('Investimento Inicial (Opcional)', 'Initial Investment (Optional)')}</label>
                    <input type="number" step="0.01" value={investimentoInicial} onChange={(e) => setInvestimentoInicial(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSalvar()} placeholder="0.00" className="w-full bg-secondary/30 border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-medium placeholder:text-muted-foreground/30" />
                    <p className="text-2xs text-muted-foreground/80 leading-relaxed">
                      {tr('Não precisa somar manualmente: informe o saldo em conta e o investimento inicial separados. O sistema envia o total e debita automaticamente o valor investido da conta.', 'No need to add manually: enter account balance and initial investment separately. The system sends the total and automatically debits the invested amount from the account.')}
                    </p>
                    <p className="text-2xs text-primary leading-relaxed font-semibold">
                      {tr('Patrimônio inicial esperado (conta + investimento):', 'Expected initial net worth (account + investment):')} {formatarMoeda(saldoTotalInicial, moeda)}
                    </p>
                  </div>

                  <label className="flex items-start gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={maisDeUmInvestimento}
                      onChange={(e) => setMaisDeUmInvestimento(e.target.checked)}
                      className="mt-0.5 rounded border-white/20 bg-secondary/30"
                    />
                    <span className="text-xs text-muted-foreground leading-relaxed">
                      {tr('Tenho mais de um investimento nesta conta e quero cadastrar todos em seguida.', 'I have more than one investment in this account and want to register all of them next.')}
                    </span>
                  </label>
                </>
              )}
              <div className="space-y-1.5">
                <label className="block text-2xs font-bold text-muted-foreground uppercase tracking-[0.2em]">{editando ? tr('Novo Saldo', 'New Balance') : tr('Saldo em Conta (sem investimentos)', 'Account Balance (without investments)')}</label>
                <input type="number" step="0.01" value={saldo} onChange={(e) => setSaldo(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSalvar()} placeholder="0.00" autoFocus={!!editando} className="w-full bg-secondary/30 border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-medium placeholder:text-muted-foreground/30" />
              </div>
            </div>
            <button onClick={handleSalvar} disabled={(!editando && !nome.trim()) || criarMutation.isPending || editarMutation.isPending} className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-primary/20 active:scale-[0.98] text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {(criarMutation.isPending || editarMutation.isPending) ? <><Loader2 size={16} className="animate-spin" /> {tr('Salvando...', 'Saving...')}</> : <>{editando ? <Pencil size={16} /> : <Plus size={16} />} {editando ? tr('Atualizar', 'Update') : tr('Criar Conta', 'Create Account')}</>}
            </button>
          </div>
        </div>
      )}

      <DeleteConfirmationModal
        isOpen={!!contaParaDeletar}
        title={tr('Remover Conta?', 'Remove Account?')}
        description={
          <>
            {tr('Você está prestes a remover', 'You are about to remove')} <span className="text-white font-semibold">"{contaParaDeletar?.nome}"</span>.
            <br />
            {tr('Investimentos, transações e recorrências vinculados serão desativados em cascata. A conta só pode ser removida com saldo zerado.', 'Linked investments, transactions, and recurrences will be deactivated in cascade. The account can only be removed when balance is zero.')}
          </>
        }
        confirmText="CONFIRMAR"
        loadingText="REMOVENDO..."
        isLoading={deletarMutation.isPending}
        onCancel={() => {
          if (!deletarMutation.isPending) {
            setContaParaDeletar(null);
          }
        }}
        onConfirm={() => {
          if (!contaParaDeletar) return;
          setDeletandoId(contaParaDeletar.id);
          deletarMutation.mutate(contaParaDeletar.id);
        }}
      />
    </MainLayout>
  );
};
