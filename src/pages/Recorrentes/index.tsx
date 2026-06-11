import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { useModalA11y } from '../../hooks/useModalA11y';
import {
  Repeat, Plus, Trash2, X, Loader2, Pencil, Calendar, TrendingUp, TrendingDown,
} from 'lucide-react';
import { MainLayout } from '../../components/layout/MainLayout';
import { ErrorState } from '../../components/ui/StateViews';
import { DeleteConfirmationModal } from '../../components/modals/DeleteConfirmationModal';
import { TransacoesRecorrentesService, ContasService, CartoesService, CategoriasService, TransacaoRecorrenteResponseDTO, TransacaoRecorrenteRequestDTO } from '../../api';
import { formatarMoeda } from '../../lib/formatters';
import { METODO_PAGAMENTO_LABELS } from '../../lib/constants';
import { getApiErrorMessage } from '../../lib/errorMessage';
import { toast } from '../../store/useToastStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useI18nStore } from '../../store/useI18nStore';

type AbaAtiva = 'DESPESA' | 'RECEITA';

export const RecorrentesPage = () => {
  const queryClient = useQueryClient();
  const moeda = (useAuthStore((s) => s.user?.moeda) as 'BRL' | 'USD' | 'EUR') || 'BRL';
  const language = useI18nStore((s) => s.language);
  const tr = (pt: string, en: string) => (language === 'en-US' ? en : pt);
  const [searchParams, setSearchParams] = useSearchParams();
  const aba = (searchParams.get('tipo') === 'RECEITA' ? 'RECEITA' : 'DESPESA') as AbaAtiva;
  const setAba = (novaAba: AbaAtiva) => {
    setSearchParams({ tipo: novaAba });
  };
  const [modalAberto, setModalAberto] = useState(false);
  const modalRef = useModalA11y(modalAberto, fecharModal);
  const [editando, setEditando] = useState<TransacaoRecorrenteResponseDTO | null>(null);
  const [recorrenteParaDeletar, setRecorrenteParaDeletar] = useState<{ id: number; descricao: string } | null>(null);
  const [deletandoId, setDeletandoId] = useState<number | null>(null);
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [metodoPagamento, setMetodoPagamento] = useState<TransacaoRecorrenteRequestDTO.metodoPagamento | ''>('');
  const [contaId, setContaId] = useState('');
  const [cartaoId, setCartaoId] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [diaLancamento, setDiaLancamento] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  const { data: recorrentes = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['recorrentes'],
    queryFn: () => TransacoesRecorrentesService.listar(),
  });

  const { data: contas = [] } = useQuery({ queryKey: ['contas'], queryFn: () => ContasService.listarContas() });
  const { data: cartoes = [] } = useQuery({ queryKey: ['cartoes'], queryFn: () => CartoesService.listarCartoes() });
  const { data: categorias = [] } = useQuery({ queryKey: ['categorias'], queryFn: () => CategoriasService.listarCategorias() });

  const categoriasFiltradas = (categorias as any[]).filter((c: any) => c.tipo === aba);

  const invalidar = () => queryClient.invalidateQueries({ queryKey: ['recorrentes'] });

  useEffect(() => {
    const handleAbrir = () => {
      setModalAberto(true);
    };
    window.addEventListener('abrir-modal-recorrente', handleAbrir);
    return () => window.removeEventListener('abrir-modal-recorrente', handleAbrir);
  }, []);

  const criarMutation = useMutation({
    mutationFn: () => {
      const finalContaId = metodoPagamento === 'CARTAO_CREDITO' ? undefined : (contaId ? Number(contaId) : undefined);
      const finalCartaoId = metodoPagamento === 'CARTAO_CREDITO' ? (cartaoId ? Number(cartaoId) : undefined) : undefined;
      return TransacoesRecorrentesService.criar({
        descricao: descricao.trim(),
        valor: Number(valor),
        tipo: aba as TransacaoRecorrenteRequestDTO.tipo,
        metodoPagamento: metodoPagamento || undefined,
        contaId: finalContaId as any,
        cartaoId: finalCartaoId,
        categoriaId: categoriaId ? Number(categoriaId) : undefined,
        diaLancamento: Number(diaLancamento),
        dataInicio: dataInicio || undefined,
        dataFim: dataFim || undefined,
      });
    },
    onSuccess: () => { invalidar(); toast.success(tr('Recorrência criada.', 'Recurring transaction created.')); fecharModal(); },
    onError: (error: unknown) =>
      toast.error(getApiErrorMessage(error, tr('Não foi possível criar a recorrência. Confira os dados informados.', 'Could not create recurring transaction. Please review input values.'))),
  });

  const editarMutation = useMutation({
    mutationFn: () => {
      const finalContaId = metodoPagamento === 'CARTAO_CREDITO' ? undefined : (contaId ? Number(contaId) : undefined);
      const finalCartaoId = metodoPagamento === 'CARTAO_CREDITO' ? (cartaoId ? Number(cartaoId) : undefined) : undefined;
      return TransacoesRecorrentesService.atualizar(editando!.id!, {
        descricao: descricao.trim(),
        valor: Number(valor),
        tipo: aba as TransacaoRecorrenteRequestDTO.tipo,
        metodoPagamento: metodoPagamento || undefined,
        contaId: finalContaId as any,
        cartaoId: finalCartaoId,
        categoriaId: categoriaId ? Number(categoriaId) : undefined,
        diaLancamento: Number(diaLancamento),
        dataInicio: dataInicio || undefined,
        dataFim: dataFim || undefined,
      });
    },
    onSuccess: () => { invalidar(); toast.success(tr('Recorrência atualizada.', 'Recurring transaction updated.')); fecharModal(); },
    onError: (error: unknown) =>
      toast.error(getApiErrorMessage(error, tr('Não foi possível salvar a edição da recorrência. Tente novamente.', 'Could not save recurring transaction changes. Please try again.'))),
  });

  const deletarMutation = useMutation({
    mutationFn: (id: number) => TransacoesRecorrentesService.deletar(id),
    onSuccess: () => {
      invalidar();
      toast.success(tr('Recorrência desativada.', 'Recurring transaction disabled.'));
      setDeletandoId(null);
      setRecorrenteParaDeletar(null);
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, tr('Não foi possível desativar a recorrência agora.', 'Could not disable recurring transaction right now.')));
      setDeletandoId(null);
      setRecorrenteParaDeletar(null);
    },
  });

  function fecharModal() {
    setModalAberto(false);
    setEditando(null);
    setDescricao('');
    setValor('');
    setMetodoPagamento('');
    setContaId('');
    setCartaoId('');
    setCategoriaId('');
    setDiaLancamento('');
    setDataInicio('');
    setDataFim('');
  }

  const abrirEdicao = (rec: TransacaoRecorrenteResponseDTO) => {
    setEditando(rec);
    setDescricao(rec.descricao || '');
    setValor(String(rec.valor ?? 0));
    setDiaLancamento(String(rec.diaLancamento ?? 1));
    setDataInicio(rec.dataInicio || '');
    setDataFim(rec.dataFim || '');
    setMetodoPagamento((rec.metodoPagamento as unknown as TransacaoRecorrenteRequestDTO.metodoPagamento | '') || '');
    
    const c = contas.find((x) => x.nome === rec.nomeConta);
    if (c) setContaId(String(c.id));
    else setContaId('');

    const card = cartoes.find((x) => x.nome === rec.nomeCartao);
    if (card) setCartaoId(String(card.id));
    else setCartaoId('');

    const cat = categorias.find((x) => x.nome === rec.nomeCategoria);
    if (cat) setCategoriaId(String(cat.id));
    else setCategoriaId('');

    setModalAberto(true);
  };

  const handleDeletar = (id: number, desc: string) => {
    setRecorrenteParaDeletar({ id, descricao: desc });
  };

  const handleSalvar = () => {
    if (editando) editarMutation.mutate();
    else criarMutation.mutate();
  };

  const filtradas = recorrentes.filter((r) => r.tipo === aba);
  const totalFixo = filtradas.reduce((acc, r) => acc + (r.valor ?? 0), 0);

  return (
    <MainLayout>
      <div className="p-3 sm:p-4 lg:p-6 space-y-5 sm:space-y-6 animate-in fade-in duration-500">
        <div>
          <h1 className="text-2xl font-bold text-white">{tr('Receitas & Despesas Fixas', 'Recurring Income & Expenses')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{tr('Gerencie suas transações recorrentes mensais.', 'Manage your monthly recurring transactions.')}</p>
        </div>

        {/* Abas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button onClick={() => setAba('DESPESA')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${aba === 'DESPESA' ? 'bg-rose-500/20 text-rose-400 ring-1 ring-rose-500/30' : 'bg-white/5 text-muted-foreground hover:text-white'}`}>
            <TrendingDown size={16} /> {tr('Despesas Fixas', 'Recurring Expenses')}
          </button>
          <button onClick={() => setAba('RECEITA')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${aba === 'RECEITA' ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30' : 'bg-white/5 text-muted-foreground hover:text-white'}`}>
            <TrendingUp size={16} /> {tr('Receitas Fixas', 'Recurring Income')}
          </button>
        </div>

        {/* Resumo */}
        <div className="glass rounded-2xl p-4">
          <p className="text-2xs font-bold text-muted-foreground uppercase tracking-[0.2em]">
            {tr('Total Mensal de', 'Monthly Total of')} {aba === 'DESPESA' ? tr('Despesas', 'Expenses') : tr('Receitas', 'Income')} {tr('Fixas', 'Recurring')}
          </p>
          <p className={`text-2xl font-bold mt-1 ${aba === 'DESPESA' ? 'text-rose-400' : 'text-emerald-400'}`}>
            {formatarMoeda(totalFixo, moeda)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {language === 'en-US'
              ? `${filtradas.length} recurring item${filtradas.length !== 1 ? 's' : ''}`
              : `${filtradas.length} recorrência${filtradas.length !== 1 ? 's' : ''}`}
          </p>
        </div>

        {/* Lista */}
        {isLoading ? (
          <div className="flex items-center justify-center h-48"><Loader2 className="animate-spin text-primary" size={32} /></div>
        ) : isError ? (
          <ErrorState
            title={language === 'en-US' ? 'Could not load recurring entries' : 'Não foi possível carregar as recorrências'}
            description={language === 'en-US' ? 'Check your connection and try again.' : 'Verifique sua conexão e tente novamente.'}
            retryLabel={language === 'en-US' ? 'Try again' : 'Tentar novamente'}
            onRetry={() => refetch()}
          />
        ) : filtradas.length === 0 ? (
          <div className="glass rounded-2xl p-6 sm:p-10 lg:p-12 flex flex-col items-center justify-center gap-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary/50"><Repeat size={32} /></div>
            <p className="text-sm text-muted-foreground font-medium max-w-xs leading-relaxed">
              {language === 'en-US'
                ? `No recurring ${aba === 'DESPESA' ? 'expense' : 'income'} registered.`
                : `Nenhuma ${aba === 'DESPESA' ? 'despesa' : 'receita'} fixa cadastrada.`}
            </p>
          </div>
        ) : (
          <div className="glass rounded-2xl divide-y divide-white/5 overflow-hidden">
            {filtradas.map((rec) => (
              <div key={rec.id} className="flex items-center gap-3 sm:gap-4 px-3 sm:px-5 py-4 hover:bg-white/5 transition-all group">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  aba === 'RECEITA' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                }`}>
                  <Repeat size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{rec.descricao}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-2xs text-muted-foreground flex items-center gap-1"><Calendar size={10} /> {tr('Dia', 'Day')} {rec.diaLancamento}</span>
                    {rec.nomeCategoria && <span className="text-2xs text-muted-foreground bg-white/5 px-2 py-0.5 rounded-full">{rec.nomeCategoria}</span>}
                    {rec.nomeConta && <span className="text-2xs text-primary/60">{rec.nomeConta}</span>}
                    {rec.dataFim && <span className="text-2xs text-amber-400">{tr('até', 'until')} {new Date(rec.dataFim + 'T00:00:00').toLocaleDateString(language)}</span>}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`text-sm font-bold ${aba === 'RECEITA' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {formatarMoeda(rec.valor ?? 0, moeda)}
                  </p>
                  <p className="text-2xs text-muted-foreground">{tr('/mês', '/month')}</p>
                </div>
                <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <button onClick={() => abrirEdicao(rec)} className="min-h-11 min-w-11 sm:min-h-0 sm:min-w-0 p-2 sm:p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all flex items-center justify-center" aria-label={tr('Editar recorrência', 'Edit recurring')}><Pencil size={14} /></button>
                  <button onClick={() => handleDeletar(rec.id!, rec.descricao!)} disabled={deletandoId === rec.id} className="min-h-11 min-w-11 sm:min-h-0 sm:min-w-0 p-2 sm:p-1.5 rounded-lg text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition-all disabled:opacity-50 flex items-center justify-center" aria-label={tr('Deletar recorrência', 'Delete recurring')}>
                    {deletandoId === rec.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
 
      {/* Modal Criar/Editar */}
      {modalAberto && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" role="dialog" aria-modal="true">
          <div ref={modalRef} className="glass w-full max-w-md rounded-2xl p-6 space-y-5 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2"><Repeat size={18} className="text-primary" /><h3 className="font-bold text-white">{editando ? tr('Editar', 'Edit') : tr('Nova', 'New')} {aba === 'DESPESA' ? tr('Despesa', 'Expense') : tr('Receita', 'Income')} {tr('Fixa', 'Recurring')}</h3></div>
              <button onClick={fecharModal} className="text-muted-foreground hover:text-white transition-colors"><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-2xs font-bold text-muted-foreground uppercase tracking-[0.2em]">{tr('Descrição', 'Description')}</label>
                <input type="text" value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder={aba === 'DESPESA' ? tr('Ex: Aluguel, Luz, Internet...', 'Ex: Rent, Electricity, Internet...') : tr('Ex: Salário, Vale...', 'Ex: Salary, Benefits...')} maxLength={100} autoFocus className="w-full bg-secondary/30 border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-medium placeholder:text-muted-foreground/30" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-2xs font-bold text-muted-foreground uppercase tracking-[0.2em]">{tr('Valor', 'Amount')}</label>
                  <input type="number" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="1500,00" className="w-full bg-secondary/30 border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-medium placeholder:text-muted-foreground/30" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-2xs font-bold text-muted-foreground uppercase tracking-[0.2em]">{tr('Dia do Mês', 'Day of Month')}</label>
                  <input type="number" min={1} max={31} value={diaLancamento} onChange={(e) => setDiaLancamento(e.target.value)} placeholder="5" className="w-full bg-secondary/30 border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-medium placeholder:text-muted-foreground/30" />
                </div>
              </div>
              {metodoPagamento !== 'CARTAO_CREDITO' && (
                <div className="space-y-1.5">
                  <label className="block text-2xs font-bold text-muted-foreground uppercase tracking-[0.2em]">{tr('Conta', 'Account')}</label>
                  <select value={contaId} onChange={(e) => setContaId(e.target.value)} className="w-full bg-secondary/30 border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-medium appearance-none">
                    <option value="" className="bg-card text-white">{tr('Selecione...', 'Select...')}</option>
                    {contas.map((c) => <option key={c.id} value={c.id} className="bg-card text-white">{c.nome}</option>)}
                  </select>
                </div>
              )}
              <div className="space-y-1.5">
                <label className="block text-2xs font-bold text-muted-foreground uppercase tracking-[0.2em]">{tr('Categoria', 'Category')}</label>
                <select value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)} className="w-full bg-secondary/30 border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-medium appearance-none">
                  <option value="" className="bg-card text-white">{tr('Nenhuma', 'None')}</option>
                  {categoriasFiltradas.map((c: any) => <option key={c.id} value={c.id} className="bg-card text-white">{c.nome}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-2xs font-bold text-muted-foreground uppercase tracking-[0.2em]">{tr('Método de Pagamento', 'Payment Method')}</label>
                <select value={metodoPagamento} onChange={(e) => {
                    const novoMetodo = e.target.value as TransacaoRecorrenteRequestDTO.metodoPagamento | '';
                    setMetodoPagamento(novoMetodo);
                    if (novoMetodo === 'CARTAO_CREDITO') setContaId('');
                    else setCartaoId('');
                }} className="w-full bg-secondary/30 border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-medium appearance-none">
                  <option value="" className="bg-card text-white">{tr('Nenhum', 'None')}</option>
                  {Object.entries(METODO_PAGAMENTO_LABELS).map(([val, label]) => <option key={val} value={val} className="bg-card text-white">{label}</option>)}
                </select>
              </div>
              {metodoPagamento === 'CARTAO_CREDITO' && cartoes.length > 0 && (
                <div className="space-y-1.5">
                  <label className="block text-2xs font-bold text-muted-foreground uppercase tracking-[0.2em]">{tr('Cartão', 'Card')}</label>
                  <select value={cartaoId} onChange={(e) => setCartaoId(e.target.value)} className="w-full bg-secondary/30 border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-medium appearance-none">
                    <option value="" className="bg-card text-white">{tr('Selecione...', 'Select...')}</option>
                    {cartoes.map((c) => <option key={c.id} value={c.id} className="bg-card text-white">{c.nome}</option>)}
                  </select>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-2xs font-bold text-muted-foreground uppercase tracking-[0.2em]">{tr('Início', 'Start')}</label>
                  <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className="w-full bg-secondary/30 border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-medium" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-2xs font-bold text-muted-foreground uppercase tracking-[0.2em]">{tr('Fim (Opcional)', 'End (Optional)')}</label>
                  <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} className="w-full bg-secondary/30 border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-medium" />
                </div>
              </div>
            </div>
            <button onClick={handleSalvar} disabled={!descricao.trim() || !valor || !diaLancamento || !metodoPagamento || (metodoPagamento === 'CARTAO_CREDITO' ? !cartaoId : !contaId) || criarMutation.isPending || editarMutation.isPending} className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-primary/20 active:scale-[0.98] text-sm disabled:opacity-50 flex items-center justify-center gap-2">
              {(criarMutation.isPending || editarMutation.isPending) ? <><Loader2 size={16} className="animate-spin" /> {tr('Salvando...', 'Saving...')}</> : <>{editando ? <Pencil size={16} /> : <Plus size={16} />} {editando ? tr('Atualizar', 'Update') : tr('Criar', 'Create')}</>}
            </button>
          </div>
        </div>
      )}

      <DeleteConfirmationModal
        isOpen={!!recorrenteParaDeletar}
        title={tr('Desativar Recorrência?', 'Disable Recurring Transaction?')}
        description={
          <>
            {tr('Você está prestes a desativar', 'You are about to disable')} <span className="text-white font-semibold">"{recorrenteParaDeletar?.descricao}"</span>.
            <br />
            {tr('Transações já geradas permanecerão no histórico.', 'Transactions already generated will remain in history.')}
          </>
        }
        confirmText={tr('CONFIRMAR', 'CONFIRM')}
        loadingText={tr('DESATIVANDO...', 'DISABLING...')}
        isLoading={deletarMutation.isPending}
        onCancel={() => {
          if (!deletarMutation.isPending) {
            setRecorrenteParaDeletar(null);
          }
        }}
        onConfirm={() => {
          if (!recorrenteParaDeletar) return;
          setDeletandoId(recorrenteParaDeletar.id);
          deletarMutation.mutate(recorrenteParaDeletar.id);
        }}
      />
    </MainLayout>
  );
};
