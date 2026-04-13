import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Target, Plus, Trash2, X, Loader2, ArrowUpCircle, ArrowDownCircle, Pencil,
} from 'lucide-react';
import { MainLayout } from '../../components/layout/MainLayout';
import { DeleteConfirmationModal } from '../../components/modals/DeleteConfirmationModal';
import { ContaControllerService } from '../../api/services/ContaControllerService';
import { investimentosApi, InvestimentoItem, TipoInvestimento } from '../../lib/investimentosApi';
import { formatarMoeda } from '../../lib/formatters';
import { getApiErrorMessage } from '../../lib/errorMessage';
import { toast } from '../../store/useToastStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useI18nStore } from '../../store/useI18nStore';

type ModalTipo = 'criar' | 'depositar' | 'resgatar' | 'meta' | null;

const TIPOS_INVESTIMENTO: Array<{ value: TipoInvestimento; labelPt: string; labelEn: string }> = [
  { value: 'CDB', labelPt: 'CDB', labelEn: 'CDB' },
  { value: 'CDI', labelPt: 'CDI', labelEn: 'CDI' },
  { value: 'LCI', labelPt: 'LCI', labelEn: 'LCI' },
  { value: 'LCA', labelPt: 'LCA', labelEn: 'LCA' },
  { value: 'POUPANCA', labelPt: 'Poupanca', labelEn: 'Savings' },
  { value: 'TESOURO_DIRETO', labelPt: 'Tesouro Direto', labelEn: 'Treasury Bonds' },
  { value: 'FUNDO_DI', labelPt: 'Fundo DI', labelEn: 'DI Fund' },
  { value: 'ACAO', labelPt: 'Acao', labelEn: 'Stock' },
  { value: 'FII', labelPt: 'FII', labelEn: 'REIT' },
  { value: 'CRIPTO', labelPt: 'Cripto', labelEn: 'Crypto' },
  { value: 'OUTRO', labelPt: 'Personalizado', labelEn: 'Custom' },
];

export const InvestimentosPage = () => {
  const queryClient = useQueryClient();
  const moeda = (useAuthStore((s) => s.user?.moeda) as 'BRL' | 'USD' | 'EUR') || 'BRL';
  const language = useI18nStore((s) => s.language);
  const tr = (pt: string, en: string) => (language === 'en-US' ? en : pt);
  const labelTipo = (tipo: TipoInvestimento) => {
    const item = TIPOS_INVESTIMENTO.find((t) => t.value === tipo);
    if (!item) return '-';
    return language === 'en-US' ? item.labelEn : item.labelPt;
  };
  const formatarTipoInvestimento = (tipo?: TipoInvestimento, personalizado?: string) => {
    if (tipo === 'OUTRO') return personalizado?.trim() || tr('Personalizado', 'Custom');
    return tipo ? labelTipo(tipo) : '-';
  };
  const [modal, setModal] = useState<ModalTipo>(null);
  const [investimentoSelecionado, setInvestimentoSelecionado] = useState<InvestimentoItem | null>(null);
  const [investimentoParaDeletar, setInvestimentoParaDeletar] = useState<{ id: number; descricao: string } | null>(null);
  const [deletandoId, setDeletandoId] = useState<number | null>(null);

  // Form states
  const [descricao, setDescricao] = useState('');
  const [valorInicial, setValorInicial] = useState('');
  const [meta, setMeta] = useState('');
  const [valor, setValor] = useState('');
  const [contaId, setContaId] = useState('');
  const [contaDestinoId, setContaDestinoId] = useState('');
  const [tipoInvestimento, setTipoInvestimento] = useState<TipoInvestimento>('CDB');
  const [tipoPersonalizado, setTipoPersonalizado] = useState('');

  const { data: investimentos = [], isLoading } = useQuery({
    queryKey: ['investimentos'],
    queryFn: () => investimentosApi.listar(),
  });

  const { data: contas = [] } = useQuery({
    queryKey: ['contas'],
    queryFn: () => ContaControllerService.listarContas(),
  });

  const ensureArray = <T,>(value: unknown): T[] => {
    if (Array.isArray(value)) return value as T[];
    if (value && typeof value === 'object' && Array.isArray((value as any).content)) {
      return (value as any).content as T[];
    }
    return [];
  };

  const investimentosList = ensureArray<InvestimentoItem>(investimentos);
  const contasList = ensureArray<any>(contas);

  const invalidar = () => {
    queryClient.invalidateQueries({ queryKey: ['investimentos'] });
    queryClient.invalidateQueries({ queryKey: ['contas'] });
  };

  const criarMutation = useMutation({
    mutationFn: () => investimentosApi.criar({
      descricao: descricao.trim(),
      valorInicial: Number(valorInicial) || 0,
      meta: meta ? Number(meta) : null,
      contaId: Number(contaId),
      contaDestinoId: contaDestinoId ? Number(contaDestinoId) : undefined,
      tipoInvestimento,
      tipoPersonalizado: tipoInvestimento === 'OUTRO' ? tipoPersonalizado.trim() : undefined,
    }),
    onSuccess: () => { invalidar(); toast.success(tr('Investimento criado.', 'Investment created.')); fecharModal(); },
    onError: (error: unknown) =>
      toast.error(getApiErrorMessage(error, tr('Não foi possível criar o investimento. Verifique o saldo da conta e tente novamente.', 'Could not create investment. Check account balance and try again.'))),
  });

  const depositarMutation = useMutation({
    mutationFn: () => investimentosApi.depositar(investimentoSelecionado!.id!, Number(valor), Number(contaId)),
    onSuccess: () => { invalidar(); toast.success(tr('Deposito realizado.', 'Deposit completed.')); fecharModal(); },
    onError: (error: unknown) =>
      toast.error(getApiErrorMessage(error, tr('Não foi possível concluir o depósito. Verifique o saldo da conta de origem.', 'Could not complete deposit. Check source account balance.'))),
  });

  const resgatarMutation = useMutation({
    mutationFn: () => investimentosApi.resgatar(investimentoSelecionado!.id!, Number(valor), Number(contaId)),
    onSuccess: () => { invalidar(); toast.success(tr('Resgate realizado.', 'Withdraw completed.')); fecharModal(); },
    onError: (error: unknown) =>
      toast.error(getApiErrorMessage(error, tr('Não foi possível concluir o resgate agora.', 'Could not complete withdraw right now.'))),
  });

  const metaMutation = useMutation({
    mutationFn: () => investimentosApi.atualizar(investimentoSelecionado!.id!, {
      descricao: descricao.trim(),
      meta: meta ? Number(meta) : null,
      tipoInvestimento,
      tipoPersonalizado: tipoInvestimento === 'OUTRO' ? tipoPersonalizado.trim() : undefined,
    }),
    onSuccess: () => { invalidar(); toast.success(tr('Investimento atualizado.', 'Investment updated.')); fecharModal(); },
    onError: (error: unknown) =>
      toast.error(getApiErrorMessage(error, tr('Não foi possível salvar a edição do investimento. Tente novamente.', 'Could not save investment changes. Please try again.'))),
  });

  const deletarMutation = useMutation({
    mutationFn: (id: number) => investimentosApi.deletar(id),
    onSuccess: () => {
      invalidar();
      toast.success(tr('Investimento removido.', 'Investment removed.'));
      setDeletandoId(null);
      setInvestimentoParaDeletar(null);
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, tr('So e possivel remover investimentos com saldo zerado.', 'Only investments with zero balance can be removed.')));
      setDeletandoId(null);
      setInvestimentoParaDeletar(null);
    },
  });

  const fecharModal = () => {
    setModal(null);
    setInvestimentoSelecionado(null);
    setDescricao('');
    setValorInicial('');
    setMeta('');
    setValor('');
    setContaId('');
    setContaDestinoId('');
    setTipoInvestimento('CDB');
    setTipoPersonalizado('');
  };

  const abrirDepositar = (inv: InvestimentoItem) => {
    setInvestimentoSelecionado(inv);
    setModal('depositar');
  };

  const abrirResgatar = (inv: InvestimentoItem) => {
    setInvestimentoSelecionado(inv);
    setModal('resgatar');
  };

  const abrirMeta = (inv: InvestimentoItem) => {
    setInvestimentoSelecionado(inv);
    setDescricao(inv.descricao ?? '');
    setMeta(inv.metaAtual != null ? String(inv.metaAtual) : '');
    setTipoInvestimento(inv.tipoInvestimento ?? 'OUTRO');
    setTipoPersonalizado(inv.tipoPersonalizado ?? '');
    setModal('meta');
  };

  const handleDeletar = (id: number, desc: string) => {
    setInvestimentoParaDeletar({ id, descricao: desc });
  };

  const totalInvestido = investimentosList.reduce((acc, i) => acc + (i.valorAtual ?? 0), 0);
  const totalMeta = investimentosList.reduce((acc, i) => acc + (i.metaAtual ?? 0), 0);
  const progressoGeral = totalMeta > 0 ? Math.min(100, (totalInvestido / totalMeta) * 100) : 0;

  return (
    <MainLayout>
      <div className="p-3 sm:p-4 lg:p-6 space-y-5 sm:space-y-6 animate-in fade-in duration-500">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">{tr('Investimentos', 'Investments')}</h1>
            <p className="text-sm text-muted-foreground mt-1">{tr('Acompanhe suas metas e faca aportes ou resgates.', 'Track your goals and make deposits or withdrawals.')}</p>
          </div>
          <button onClick={() => setModal('criar')} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-primary/20 active:scale-[0.98] text-sm">
            <Plus size={16} /> {tr('Novo Investimento', 'New Investment')}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="glass rounded-2xl p-4">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">{tr('Total Investido', 'Total Invested')}</p>
            <p className="text-xl font-bold text-primary mt-1">{formatarMoeda(totalInvestido, moeda)}</p>
          </div>
          <div className="glass rounded-2xl p-4">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">{tr('Meta Total', 'Total Goal')}</p>
            <p className="text-xl font-bold text-white mt-1">{formatarMoeda(totalMeta, moeda)}</p>
          </div>
          <div className="glass rounded-2xl p-4">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">{tr('Progresso Geral', 'Overall Progress')}</p>
            <p className="text-xl font-bold text-amber-400 mt-1">{progressoGeral.toFixed(1)}%</p>
            <div className="w-full h-1.5 bg-white/10 rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${progressoGeral}%` }} />
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-48"><Loader2 className="animate-spin text-primary" size={32} /></div>
        ) : investimentosList.length === 0 ? (
          <div className="glass rounded-2xl p-6 sm:p-10 lg:p-12 flex flex-col items-center justify-center gap-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary/50"><Target size={32} /></div>
            <p className="text-sm text-muted-foreground font-medium max-w-xs leading-relaxed">{tr('Nenhum investimento criado. Defina sua primeira meta.', 'No investments created. Set your first goal.')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {investimentosList.map((inv) => {
              const progresso = (inv.metaAtual ?? 0) > 0 ? Math.min(100, ((inv.valorAtual ?? 0) / (inv.metaAtual ?? 1)) * 100) : 0;
              const possuiMeta = inv.metaAtual != null && inv.metaAtual > 0;
              const atingiu = progresso >= 100;
              return (
                <div key={inv.id} className="glass rounded-2xl p-5 space-y-4 group">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${atingiu ? 'bg-emerald-500/10 text-emerald-400' : 'bg-primary/10 text-primary'}`}>
                        <Target size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{inv.descricao}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Inicial: {formatarMoeda(inv.valorInicial ?? 0, moeda)}
                          {inv.nomeContaOrigem && <span className="ml-2 text-primary/60">via {inv.nomeContaOrigem}</span>}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wide">
                          {formatarTipoInvestimento(inv.tipoInvestimento, inv.tipoPersonalizado)}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <button onClick={() => abrirMeta(inv)} className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all" title={tr('Editar meta', 'Edit goal')}><Pencil size={14} /></button>
                      <button onClick={() => handleDeletar(inv.id!, inv.descricao || '')} disabled={deletandoId === inv.id} className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition-all disabled:opacity-50" title={tr('Remover', 'Remove')}>
                        {deletandoId === inv.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-bold text-white">{formatarMoeda(inv.valorAtual ?? 0, moeda)}</span>
                      <span className="text-muted-foreground">{possuiMeta ? `${tr('de', 'of')} ${formatarMoeda(inv.metaAtual ?? 0, moeda)}` : tr('sem meta', 'no goal')}</span>
                    </div>
                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${(possuiMeta && atingiu) ? 'bg-emerald-400' : 'bg-primary'}`} style={{ width: `${possuiMeta ? progresso : 0}%` }} />
                    </div>
                    <p className={`text-[10px] font-bold mt-1 ${(possuiMeta && atingiu) ? 'text-emerald-400' : 'text-muted-foreground'}`}>
                      {possuiMeta ? (atingiu ? tr('Meta atingida!', 'Goal achieved!') : `${progresso.toFixed(1)}% ${tr('concluido', 'completed')}`) : tr('Sem meta definida', 'No goal defined')}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button onClick={() => abrirDepositar(inv)} className="flex-1 flex items-center justify-center gap-1.5 bg-primary/10 hover:bg-primary/20 text-primary font-bold py-2 rounded-xl transition-all text-xs">
                      <ArrowUpCircle size={14} /> {tr('Depositar', 'Deposit')}
                    </button>
                    <button onClick={() => abrirResgatar(inv)} disabled={(inv.valorAtual ?? 0) === 0} className="flex-1 flex items-center justify-center gap-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold py-2 rounded-xl transition-all text-xs disabled:opacity-30">
                      <ArrowDownCircle size={14} /> {tr('Resgatar', 'Withdraw')}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {modal === 'criar' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass w-full max-w-sm rounded-2xl p-6 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2"><Target size={18} className="text-primary" /><h3 className="font-bold text-white">{tr('Novo Investimento', 'New Investment')}</h3></div>
              <button onClick={fecharModal} className="text-muted-foreground hover:text-white transition-colors"><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">{tr('Nome da Meta', 'Goal Name')}</label>
                <input type="text" value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Ex: Reserva de emergencia" maxLength={100} autoFocus className="w-full bg-secondary/30 border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-medium placeholder:text-muted-foreground/30" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">{tr('Tipo de Investimento', 'Investment Type')}</label>
                <select value={tipoInvestimento} onChange={(e) => setTipoInvestimento(e.target.value as TipoInvestimento)} className="w-full bg-secondary/30 border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-medium appearance-none">
                  {TIPOS_INVESTIMENTO.map((tipo) => (
                    <option key={tipo.value} value={tipo.value} className="bg-card text-white">{labelTipo(tipo.value)}</option>
                  ))}
                </select>
              </div>
              {tipoInvestimento === 'OUTRO' && (
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">{tr('Tipo Personalizado', 'Custom Type')}</label>
                  <input type="text" value={tipoPersonalizado} onChange={(e) => setTipoPersonalizado(e.target.value)} placeholder="Ex: Debenture, CRA, Coe" maxLength={60} className="w-full bg-secondary/30 border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-medium placeholder:text-muted-foreground/30" />
                </div>
              )}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">{tr('Conta de Origem', 'Source Account')}</label>
                <select value={contaId} onChange={(e) => setContaId(e.target.value)} className="w-full bg-secondary/30 border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-medium appearance-none">
                  <option value="" className="bg-card text-white">{tr('Selecione a conta...', 'Select account...')}</option>
                  {contasList.map((c) => (
                    <option key={c.id} value={c.id} className="bg-card text-white">{c.nome} — {formatarMoeda(c.saldo ?? 0, moeda)}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">{tr('Valor Inicial', 'Initial Amount')}</label>
                <input type="number" step="0.01" value={valorInicial} onChange={(e) => setValorInicial(e.target.value)} placeholder="0,00" className="w-full bg-secondary/30 border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-medium placeholder:text-muted-foreground/30" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">{tr('Meta (Opcional)', 'Goal (Optional)')}</label>
                <input type="number" step="0.01" value={meta} onChange={(e) => setMeta(e.target.value)} placeholder="10000,00" className="w-full bg-secondary/30 border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-medium placeholder:text-muted-foreground/30" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">{tr('Conta de Destino', 'Destination Account')}</label>
                <select value={contaDestinoId} onChange={(e) => setContaDestinoId(e.target.value)} className="w-full bg-secondary/30 border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-medium appearance-none">
                  <option value="" className="bg-card text-white">{tr('Mesma da origem', 'Same as source')}</option>
                  {contasList.map((c) => (
                    <option key={c.id} value={c.id} className="bg-card text-white">{c.nome} — {formatarMoeda(c.saldo ?? 0, moeda)}</option>
                  ))}
                </select>
              </div>
            </div>
            <button onClick={() => criarMutation.mutate()} disabled={!descricao.trim() || !contaId || (tipoInvestimento === 'OUTRO' && !tipoPersonalizado.trim()) || criarMutation.isPending} className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-primary/20 active:scale-[0.98] text-sm disabled:opacity-50 flex items-center justify-center gap-2">
              {criarMutation.isPending ? <><Loader2 size={16} className="animate-spin" /> {tr('Criando...', 'Creating...')}</> : <><Plus size={16} /> {tr('Criar', 'Create')}</>}
            </button>
          </div>
        </div>
      )}

      {(modal === 'depositar' || modal === 'resgatar') && investimentoSelecionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass w-full max-w-sm rounded-2xl p-6 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {modal === 'depositar' ? <ArrowUpCircle size={18} className="text-primary" /> : <ArrowDownCircle size={18} className="text-rose-400" />}
                <h3 className="font-bold text-white">{modal === 'depositar' ? tr('Depositar', 'Deposit') : tr('Resgatar', 'Withdraw')}</h3>
              </div>
              <button onClick={fecharModal} className="text-muted-foreground hover:text-white transition-colors"><X size={18} /></button>
            </div>
            <div className="bg-white/5 rounded-xl p-3">
              <p className="text-xs text-muted-foreground">{investimentoSelecionado.descricao}</p>
              <p className="text-lg font-bold text-white mt-1">{tr('Saldo', 'Balance')}: {formatarMoeda(investimentoSelecionado.valorAtual ?? 0, moeda)}</p>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                  {modal === 'depositar' ? tr('Conta de Origem', 'Source Account') : tr('Conta de Destino', 'Destination Account')}
                </label>
                <select value={contaId} onChange={(e) => setContaId(e.target.value)} className="w-full bg-secondary/30 border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-medium appearance-none">
                  <option value="" className="bg-card text-white">{tr('Selecione...', 'Select...')}</option>
                  {contasList.map((c) => (
                    <option key={c.id} value={c.id} className="bg-card text-white">{c.nome} — {formatarMoeda(c.saldo ?? 0, moeda)}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">{tr('Valor', 'Amount')}</label>
                <input type="number" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="500,00" autoFocus className="w-full bg-secondary/30 border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-medium placeholder:text-muted-foreground/30" />
              </div>
            </div>
            <button
              onClick={() => modal === 'depositar' ? depositarMutation.mutate() : resgatarMutation.mutate()}
              disabled={!contaId || !valor || Number(valor) <= 0 || depositarMutation.isPending || resgatarMutation.isPending}
              className={`w-full font-bold py-3 rounded-xl transition-all active:scale-[0.98] text-sm disabled:opacity-50 flex items-center justify-center gap-2 ${
                modal === 'depositar'
                  ? 'bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20'
                  : 'bg-rose-500 hover:bg-rose-500/90 text-white shadow-lg shadow-rose-500/20'
              }`}
            >
              {(depositarMutation.isPending || resgatarMutation.isPending)
                ? <><Loader2 size={16} className="animate-spin" /> {tr('Processando...', 'Processing...')}</>
                : modal === 'depositar' ? <><ArrowUpCircle size={16} /> {tr('Depositar', 'Deposit')}</> : <><ArrowDownCircle size={16} /> {tr('Resgatar', 'Withdraw')}</>
              }
            </button>
          </div>
        </div>
      )}

      {modal === 'meta' && investimentoSelecionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass w-full max-w-sm rounded-2xl p-6 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2"><Pencil size={18} className="text-primary" /><h3 className="font-bold text-white">{tr('Editar Meta', 'Edit Goal')}</h3></div>
              <button onClick={fecharModal} className="text-muted-foreground hover:text-white transition-colors"><X size={18} /></button>
            </div>
            <div className="bg-white/5 rounded-xl p-3">
              <p className="text-xs text-muted-foreground">{tr('Meta atual', 'Current goal')}</p>
              <p className="text-sm font-bold text-white mt-1">{investimentoSelecionado.metaAtual != null ? formatarMoeda(investimentoSelecionado.metaAtual, moeda) : tr('Sem meta definida', 'No goal defined')}</p>
            </div>
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">{tr('Nome da Meta', 'Goal Name')}</label>
              <input type="text" value={descricao} onChange={(e) => setDescricao(e.target.value)} autoFocus maxLength={100} className="w-full bg-secondary/30 border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-medium placeholder:text-muted-foreground/30" />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">{tr('Tipo de Investimento', 'Investment Type')}</label>
              <select value={tipoInvestimento} onChange={(e) => setTipoInvestimento(e.target.value as TipoInvestimento)} className="w-full bg-secondary/30 border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-medium appearance-none">
                {TIPOS_INVESTIMENTO.map((tipo) => (
                  <option key={tipo.value} value={tipo.value} className="bg-card text-white">{labelTipo(tipo.value)}</option>
                ))}
              </select>
            </div>
            {tipoInvestimento === 'OUTRO' && (
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">{tr('Tipo Personalizado', 'Custom Type')}</label>
                <input type="text" value={tipoPersonalizado} onChange={(e) => setTipoPersonalizado(e.target.value)} maxLength={60} className="w-full bg-secondary/30 border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-medium placeholder:text-muted-foreground/30" />
              </div>
            )}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">{tr('Meta (Opcional)', 'Goal (Optional)')}</label>
              <input type="number" step="0.01" value={meta} onChange={(e) => setMeta(e.target.value)} placeholder={tr('Deixe em branco para sem meta', 'Leave blank for no goal')} className="w-full bg-secondary/30 border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-medium placeholder:text-muted-foreground/30" />
            </div>
            <button onClick={() => metaMutation.mutate()} disabled={!descricao.trim() || (meta && Number(meta) <= 0) || (tipoInvestimento === 'OUTRO' && !tipoPersonalizado.trim()) || metaMutation.isPending} className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-primary/20 active:scale-[0.98] text-sm disabled:opacity-50 flex items-center justify-center gap-2">
              {metaMutation.isPending ? <><Loader2 size={16} className="animate-spin" /> {tr('Salvando...', 'Saving...')}</> : <><Pencil size={16} /> {tr('Atualizar Meta', 'Update Goal')}</>}
            </button>
          </div>
        </div>
      )}

      <DeleteConfirmationModal
        isOpen={!!investimentoParaDeletar}
        title={tr('Remover Investimento?', 'Remove Investment?')}
        description={
          <>
            {tr('Você está prestes a remover', 'You are about to remove')} <span className="text-white font-semibold">"{investimentoParaDeletar?.descricao}"</span>.
            <br />
            {tr('Somente investimentos com saldo zerado podem ser removidos.', 'Only investments with zero balance can be removed.')}
          </>
        }
        confirmText={tr('CONFIRMAR', 'CONFIRM')}
        loadingText={tr('REMOVENDO...', 'REMOVING...')}
        isLoading={deletarMutation.isPending}
        onCancel={() => {
          if (!deletarMutation.isPending) {
            setInvestimentoParaDeletar(null);
          }
        }}
        onConfirm={() => {
          if (!investimentoParaDeletar) return;
          setDeletandoId(investimentoParaDeletar.id);
          deletarMutation.mutate(investimentoParaDeletar.id);
        }}
      />
    </MainLayout>
  );
};
