import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CreditCard, Plus, Trash2, X, Loader2, ChevronRight, ChevronDown,
  Calendar, DollarSign, AlertTriangle, CheckCircle2, Clock, Pencil, Eye,
} from 'lucide-react';
import imgVisa from '../../assets/cartoes/cartao-visa-removebg-preview.png';
import imgMastercard from '../../assets/cartoes/cartao-mastercard-removebg-preview.png';
import imgElo from '../../assets/cartoes/cartao-elo-removebg-preview.png';
import imgAmex from '../../assets/cartoes/cartao-americana-express-removebg-preview.png';
import imgDiners from '../../assets/cartoes/cartao-diners-removebg-preview.png';
import imgHipercard from '../../assets/cartoes/cartao-hipercard-removebg-preview.png';
import imgNubank from '../../assets/cartoes/caartao-nubank-removebg-preview.png';
import imgInter from '../../assets/cartoes/cartao-inter-removebg-preview.png';
import imgOurocard from '../../assets/cartoes/cartao-ourocard-removebg-preview.png';
import imgDigio from '../../assets/cartoes/cartao-digio-removebg-preview.png';
import imgC6 from '../../assets/cartoes/cartao-c6bank-removebg-preview.png';
import imgBtg from '../../assets/cartoes/cartao-btg-removebg-preview.png';
import imgXp from '../../assets/cartoes/cartao-xpinvestimentos-removebg-preview.png';
import imgOutros from '../../assets/cartoes/cartao-outros-removebg-preview.png';

const BANDEIRA_IMAGENS: Record<string, string> = {
  VISA: imgVisa,
  MASTERCARD: imgMastercard,
  ELO: imgElo,
  AMERICAN_EXPRESS: imgAmex,
  DINERS_CLUB: imgDiners,
  HIPERCARD: imgHipercard,
  NUBANK: imgNubank,
  INTER: imgInter,
  OUROCARD: imgOurocard,
  DIGIO: imgDigio,
  C6_BANK: imgC6,
  BTG_PACTUAL: imgBtg,
  XP_INVESTIMENTOS: imgXp,
  OUTROS: imgOutros,
};
import { MainLayout } from '../../components/layout/MainLayout';
import { ErrorState } from '../../components/ui/StateViews';
import { DeleteConfirmationModal } from '../../components/modals/DeleteConfirmationModal';
import { CartoesService } from '../../api/services/CartoesService';
import { FaturasService } from '../../api/services/FaturasService';
import { ContasService } from '../../api/services/ContasService';
import { CartaoRegistroRequestDTO } from '../../api/models/CartaoRegistroRequestDTO';
import { CartaoResponseDTO } from '../../api/models/CartaoResponseDTO';
import { FaturaResponseDTO } from '../../api/models/FaturaResponseDTO';
import { formatarMoeda } from '../../lib/formatters';
import { BANDEIRA_CARTAO_LABELS } from '../../lib/constants';
import { useModalA11y } from '../../hooks/useModalA11y';
import { cartoesApi } from '../../lib/cartoesApi';
import { getApiErrorMessage } from '../../lib/errorMessage';
import { toast } from '../../store/useToastStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useI18nStore } from '../../store/useI18nStore';
import { useEffect } from 'react';

export const CartoesPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const moeda = (useAuthStore((s) => s.user?.moeda) as 'BRL' | 'USD' | 'EUR') || 'BRL';
  const language = useI18nStore((s) => s.language);
  const tr = (pt: string, en: string) => (language === 'en-US' ? en : pt);
  const statusFaturaConfig: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
    ABERTA: { label: tr('Aberta', 'Open'), color: 'text-blue-400 bg-blue-500/10', icon: Clock },
    FECHADA: { label: tr('Fechada', 'Closed'), color: 'text-amber-400 bg-amber-500/10', icon: Calendar },
    PAGA: { label: tr('Paga', 'Paid'), color: 'text-emerald-400 bg-emerald-500/10', icon: CheckCircle2 },
    ATRASADA: { label: tr('Atrasada', 'Overdue'), color: 'text-rose-400 bg-rose-500/10', icon: AlertTriangle },
  };
  const [modalAberto, setModalAberto] = useState(false);
  const [cartaoEditando, setCartaoEditando] = useState<CartaoResponseDTO | null>(null);
  const [cartaoExpandido, setCartaoExpandido] = useState<number | null>(null);
  const [modalPagar, setModalPagar] = useState<FaturaResponseDTO | null>(null);
  const [valorPagamento, setValorPagamento] = useState('');
  const [contaPagamentoId, setContaPagamentoId] = useState('');
  const [cartaoParaDeletar, setCartaoParaDeletar] = useState<{ id: number; nome: string } | null>(null);
  const [nome, setNome] = useState('');
  const [limite, setLimite] = useState('');
  const [diaFechamento, setDiaFechamento] = useState('');
  const [diaVencimento, setDiaVencimento] = useState('');
  const [bandeira, setBandeira] = useState<CartaoRegistroRequestDTO.bandeira>(CartaoRegistroRequestDTO.bandeira.VISA);
  const [contaVinculadaId, setContaVinculadaId] = useState('');

  function fecharModal() {
    setModalAberto(false);
    setCartaoEditando(null);
    setNome('');
    setLimite('');
    setDiaFechamento('');
    setDiaVencimento('');
    setBandeira(CartaoRegistroRequestDTO.bandeira.VISA);
    setContaVinculadaId('');
  }

  const modalNovoRef = useModalA11y(modalAberto, fecharModal);
  const modalPagarRef = useModalA11y(!!modalPagar, () => {
    setModalPagar(null);
    setValorPagamento('');
    setContaPagamentoId('');
  });

  useEffect(() => {
    const handleAbrir = () => {
      setModalAberto(true);
    };
    window.addEventListener('abrir-modal-cartao', handleAbrir);
    return () => window.removeEventListener('abrir-modal-cartao', handleAbrir);
  }, []);

  const { data: cartoes = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['cartoes'],
    queryFn: () => CartoesService.listarCartoes(),
  });

  const { data: contas = [] } = useQuery({
    queryKey: ['contas'],
    queryFn: () => ContasService.listarContas(),
  });

  const { data: faturas = [] } = useQuery({
    queryKey: ['faturas', cartaoExpandido],
    queryFn: () => FaturasService.listarFaturasPorCartao(cartaoExpandido!),
    enabled: cartaoExpandido !== null,
  });

  const criarMutation = useMutation({
    mutationFn: () =>
      CartoesService.criarCartao({
        nome: nome.trim(),
        limite: Number(limite),
        diaFechamento: Number(diaFechamento),
        diaVencimento: Number(diaVencimento),
        bandeira,
        contaId: contaVinculadaId ? Number(contaVinculadaId) : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cartoes'] });
      toast.success(tr(`Cartão "${nome.trim()}" criado.`, `Card "${nome.trim()}" created.`));
      fecharModal();
    },
    onError: (error: unknown) =>
      toast.error(getApiErrorMessage(error, tr('Não foi possível criar o cartão agora. Verifique os dados e tente novamente.', 'Could not create card right now. Please check input data and try again.'))),
  });

  const deletarMutation = useMutation({
    mutationFn: (id: number) => CartoesService.deletarCartao(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cartoes'] });
      toast.success(tr('Cartão removido.', 'Card removed.'));
      setCartaoParaDeletar(null);
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, tr('Não foi possível remover o cartão. Cartões com faturas pendentes não podem ser removidos.', 'Could not remove the card. Cards with pending invoices cannot be removed.')));
      setCartaoParaDeletar(null);
    },
  });

  const editarMutation = useMutation({
    mutationFn: () =>
      cartoesApi.atualizar(cartaoEditando!.id!, {
        nome: nome.trim(),
        limite: Number(limite),
        diaFechamento: Number(diaFechamento),
        diaVencimento: Number(diaVencimento),
        bandeira,
        contaId: contaVinculadaId ? Number(contaVinculadaId) : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cartoes'] });
      toast.success(tr(`Cartão "${nome.trim()}" atualizado.`, `Card "${nome.trim()}" updated.`));
      fecharModal();
    },
    onError: (error: unknown) =>
      toast.error(getApiErrorMessage(error, tr('Não foi possível salvar a edição do cartão. Tente novamente.', 'Could not save card changes. Please try again.'))),
  });

  const pagarMutation = useMutation({
    mutationFn: () =>
      FaturasService.pagarFatura(modalPagar!.id!, {
        contaId: Number(contaPagamentoId),
        valorPago: Number(valorPagamento),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faturas'] });
      queryClient.invalidateQueries({ queryKey: ['cartoes'] });
      queryClient.invalidateQueries({ queryKey: ['contas'] });
      toast.success(tr('Pagamento registrado com sucesso.', 'Payment registered successfully.'));
      setModalPagar(null);
      setValorPagamento('');
      setContaPagamentoId('');
    },
    onError: (error: unknown) =>
      toast.error(getApiErrorMessage(error, tr('Não foi possível registrar o pagamento da fatura. Confira saldo e valor informado.', 'Could not register invoice payment. Please review account balance and amount.'))),
  });

  const abrirModalEdicao = (cartao: CartaoResponseDTO) => {
    setCartaoEditando(cartao);
    setNome(cartao.nome ?? '');
    setLimite(String(cartao.limite ?? ''));
    setDiaFechamento(String(cartao.diaFechamento ?? ''));
    setDiaVencimento(String(cartao.diaVencimento ?? ''));
    setBandeira((cartao.bandeira as CartaoRegistroRequestDTO.bandeira) ?? CartaoRegistroRequestDTO.bandeira.OUTROS);
    setContaVinculadaId(cartao.contaId ? String(cartao.contaId) : '');
    setModalAberto(true);
  };

  const handleSalvarCartao = () => {
    if (cartaoEditando) {
      editarMutation.mutate();
      return;
    }
    criarMutation.mutate();
  };

  const handleDeletar = (id: number, nomeCartao: string) => {
    setCartaoParaDeletar({ id, nome: nomeCartao });
  };

  const toggleExpand = (id: number) => {
    setCartaoExpandido(cartaoExpandido === id ? null : id);
  };

  const limiteTotal = cartoes.reduce((acc, c) => acc + (c.limite ?? 0), 0);
  const limiteUsado = cartoes.reduce((acc, c) => acc + ((c.limite ?? 0) - (c.limiteDisponivel ?? 0)), 0);

  return (
    <MainLayout>
      <div className="p-3 sm:p-4 lg:p-6 space-y-5 sm:space-y-6 animate-in fade-in duration-500">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">{tr('Meus Cartões', 'My Cards')}</h1>
            <p className="text-sm text-muted-foreground mt-1">{tr('Gerencie seus cartões de crédito e acompanhe faturas.', 'Manage your credit cards and track invoices.')}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="glass rounded-2xl p-4">
            <p className="text-2xs font-bold text-muted-foreground uppercase tracking-[0.2em]">{tr('Limite Total', 'Total Limit')}</p>
            <p className="text-xl font-bold text-white mt-1">{formatarMoeda(limiteTotal, moeda)}</p>
          </div>
          <div className="glass rounded-2xl p-4">
            <p className="text-2xs font-bold text-muted-foreground uppercase tracking-[0.2em]">{tr('Usado', 'Used')}</p>
            <p className="text-xl font-bold text-rose-400 mt-1">{formatarMoeda(limiteUsado, moeda)}</p>
          </div>
          <div className="glass rounded-2xl p-4">
            <p className="text-2xs font-bold text-muted-foreground uppercase tracking-[0.2em]">{tr('Disponível', 'Available')}</p>
            <p className="text-xl font-bold text-emerald-400 mt-1">{formatarMoeda(limiteTotal - limiteUsado, moeda)}</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-48"><Loader2 className="animate-spin text-primary" size={32} /></div>
        ) : isError ? (
          <ErrorState
            title={tr('Não foi possível carregar os cartões', 'Could not load cards')}
            description={tr('Verifique sua conexão e tente novamente.', 'Check your connection and try again.')}
            retryLabel={tr('Tentar novamente', 'Try again')}
            onRetry={() => refetch()}
          />
        ) : cartoes.length === 0 ? (
          <div className="glass rounded-2xl p-6 sm:p-10 lg:p-12 flex flex-col items-center justify-center gap-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary/50"><CreditCard size={32} /></div>
            <p className="text-sm text-muted-foreground font-medium max-w-xs leading-relaxed">{tr('Nenhum cartão cadastrado. Adicione seu primeiro cartão de crédito.', 'No cards registered. Add your first credit card.')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {cartoes.map((cartao) => (
              <div key={cartao.id} className="glass rounded-2xl overflow-hidden">
                <div className="p-4 sm:p-5 flex items-center gap-3 sm:gap-4 cursor-pointer hover:bg-white/5 transition-all" onClick={() => toggleExpand(cartao.id!)}>
                  <div className="w-14 h-10 flex items-center justify-center flex-shrink-0">
                    {cartao.bandeira && BANDEIRA_IMAGENS[cartao.bandeira] ? (
                      <img
                        src={BANDEIRA_IMAGENS[cartao.bandeira]}
                        alt={cartao.bandeira}
                        className="h-10 w-auto object-contain drop-shadow-lg"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <CreditCard size={18} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-white">{cartao.nome}</p>
                      <span className="text-2xs text-muted-foreground bg-white/5 px-2 py-0.5 rounded-full">
                        {cartao.bandeira ? BANDEIRA_CARTAO_LABELS[cartao.bandeira] : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-xs text-muted-foreground">{tr('Limite', 'Limit')}: {formatarMoeda(cartao.limite ?? 0, moeda)}</span>
                      <span className="text-xs text-emerald-400">{tr('Disponível', 'Available')}: {formatarMoeda(cartao.limiteDisponivel ?? 0, moeda)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden hidden sm:block">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${Math.min(100, ((cartao.limite ?? 0) - (cartao.limiteDisponivel ?? 0)) / (cartao.limite || 1) * 100)}%` }}
                      />
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); handleDeletar(cartao.id!, cartao.nome!); }} className="min-h-11 min-w-11 sm:min-h-0 sm:min-w-0 p-2.5 sm:p-1.5 rounded-lg text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition-all flex items-center justify-center">
                      <Trash2 size={14} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); abrirModalEdicao(cartao); }} className="min-h-11 min-w-11 sm:min-h-0 sm:min-w-0 p-2.5 sm:p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all flex items-center justify-center" aria-label={tr('Editar cartão', 'Edit card')}>
                      <Pencil size={14} />
                    </button>
                    {cartaoExpandido === cartao.id ? <ChevronDown size={16} className="text-muted-foreground" /> : <ChevronRight size={16} className="text-muted-foreground" />}
                  </div>
                </div>

                {cartaoExpandido === cartao.id && (
                  <div className="border-t border-white/5 px-5 py-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-2xs font-bold text-muted-foreground uppercase tracking-widest">{tr('Ciclo', 'Cycle')}:</span>
                      {[
                        { label: tr('Aberta', 'Open'), color: 'text-blue-400 bg-blue-500/10' },
                        { label: '→', color: 'text-muted-foreground' },
                        { label: tr(`Fecha dia ${cartao.diaFechamento}`, `Closes day ${cartao.diaFechamento}`), color: 'text-amber-400 bg-amber-500/10' },
                        { label: '→', color: 'text-muted-foreground' },
                        { label: tr(`Vence dia ${cartao.diaVencimento}`, `Due day ${cartao.diaVencimento}`), color: 'text-rose-400 bg-rose-500/10' },
                        { label: '→', color: 'text-muted-foreground' },
                        { label: tr('Paga', 'Paid'), color: 'text-emerald-400 bg-emerald-500/10' },
                      ].map((step, i) => (
                        step.label === '→'
                          ? <span key={i} className="text-xs text-muted-foreground">{step.label}</span>
                          : <span key={i} className={`text-2xs font-bold px-2 py-0.5 rounded ${step.color}`}>{step.label}</span>
                      ))}
                    </div>
                    {cartao.nomeConta && (
                      <p className="text-2xs text-muted-foreground">
                        {tr('Conta vinculada', 'Linked account')}: <span className="text-white font-semibold">{cartao.nomeConta}</span>
                      </p>
                    )}
                    {faturas.length === 0 ? (
                      <p className="text-xs text-muted-foreground py-2">{tr('Nenhuma fatura gerada ainda.', 'No invoice generated yet.')}</p>
                    ) : (
                      <div className="space-y-2">
                        {faturas.map((f) => {
                          const cfg = statusFaturaConfig[f.status || 'ABERTA'];
                          const Icon = cfg.icon;
                          return (
                            <div key={f.id} className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3">
                              <div className={`p-1.5 rounded-lg ${cfg.color}`}><Icon size={14} /></div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-white">
                                  {String(f.mes).padStart(2, '0')}/{f.ano}
                                </p>
                                <p className="text-2xs text-muted-foreground">
                                  {tr('Vencimento', 'Due date')}: {f.dataVencimento ? new Date(f.dataVencimento + 'T00:00:00').toLocaleDateString(language) : '—'}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs font-bold text-white">{formatarMoeda(f.valorTotal ?? 0, moeda)}</p>
                                {(f.valorPago ?? 0) > 0 && (
                                  <p className="text-2xs text-emerald-400">{tr('Pago', 'Paid')}: {formatarMoeda(f.valorPago ?? 0, moeda)}</p>
                                )}
                              </div>
                              <span className={`text-2xs font-bold px-2 py-0.5 rounded ${cfg.color}`}>{cfg.label}</span>
                              <button
                                onClick={() => navigate(`/faturas/${cartao.id}?mes=${f.mes}&ano=${f.ano}`)}
                                className="min-h-11 min-w-11 sm:min-h-0 sm:min-w-0 p-2.5 sm:p-1 rounded-lg text-muted-foreground hover:text-white hover:bg-white/10 transition-all flex items-center justify-center"
                                aria-label={tr('Ver detalhes', 'View details')}
                              >
                                <Eye size={14} />
                              </button>
                              {f.status !== FaturaResponseDTO.status.PAGA && (f.valorRestante ?? 0) > 0 && (
                                <button
                                  onClick={() => {
                                    setModalPagar(f);
                                    setValorPagamento(String(f.valorRestante ?? 0));
                                    if (cartao.contaId) setContaPagamentoId(String(cartao.contaId));
                                  }}
                                  className="min-h-11 min-w-11 sm:min-h-0 sm:min-w-0 px-3 py-2 sm:px-2 sm:py-1 text-2xs font-bold text-primary hover:text-primary/80 transition-colors bg-primary/10 rounded-lg flex items-center justify-center"
                                >
                                  {tr('Pagar', 'Pay')}
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {modalAberto && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" role="dialog" aria-modal="true">
          <div ref={modalNovoRef} className="glass w-full max-w-md rounded-2xl p-6 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2"><CreditCard size={18} className="text-primary" /><h3 className="font-bold text-white">{cartaoEditando ? tr('Editar Cartão', 'Edit Card') : tr('Novo Cartão', 'New Card')}</h3></div>
              <button onClick={fecharModal} className="text-muted-foreground hover:text-white transition-colors"><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-2xs font-bold text-muted-foreground uppercase tracking-[0.2em]">{tr('Nome', 'Name')}</label>
                <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} placeholder={tr('Ex: Nubank, Inter...', 'Ex: Chase, Capital One...')} maxLength={50} autoFocus className="w-full bg-secondary/30 border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-medium placeholder:text-muted-foreground/30" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-2xs font-bold text-muted-foreground uppercase tracking-[0.2em]">{tr('Bandeira', 'Brand')}</label>
                <select value={bandeira} onChange={(e) => setBandeira(e.target.value as CartaoRegistroRequestDTO.bandeira)} className="w-full bg-secondary/30 border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-medium appearance-none">
                  {Object.entries(BANDEIRA_CARTAO_LABELS).map(([val, label]) => (
                    <option key={val} value={val} className="bg-card text-white">{label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-2xs font-bold text-muted-foreground uppercase tracking-[0.2em]">{tr('Limite', 'Limit')}</label>
                <input type="number" step="0.01" value={limite} onChange={(e) => setLimite(e.target.value)} placeholder="5000,00" className="w-full bg-secondary/30 border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-medium placeholder:text-muted-foreground/30" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-2xs font-bold text-muted-foreground uppercase tracking-[0.2em]">{tr('Dia Fechamento', 'Closing Day')}</label>
                  <input type="number" min={1} max={31} value={diaFechamento} onChange={(e) => setDiaFechamento(e.target.value)} placeholder="25" className="w-full bg-secondary/30 border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-medium placeholder:text-muted-foreground/30" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-2xs font-bold text-muted-foreground uppercase tracking-[0.2em]">{tr('Dia Vencimento', 'Due Day')}</label>
                  <input type="number" min={1} max={31} value={diaVencimento} onChange={(e) => setDiaVencimento(e.target.value)} placeholder="5" className="w-full bg-secondary/30 border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-medium placeholder:text-muted-foreground/30" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block text-2xs font-bold text-muted-foreground uppercase tracking-[0.2em]">{tr('Conta Vinculada', 'Linked Account')} <span className="normal-case text-muted-foreground/60 font-normal">{tr('(opcional — pré-selecionada ao pagar fatura)', '(optional - preselected when paying invoice)')}</span></label>
                <select value={contaVinculadaId} onChange={(e) => setContaVinculadaId(e.target.value)} className="w-full bg-secondary/30 border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-medium appearance-none">
                  <option value="" className="bg-card text-white">{tr('Nenhuma', 'None')}</option>
                  {contas.map((c) => (
                    <option key={c.id} value={c.id} className="bg-card text-white">{c.nome}</option>
                  ))}
                </select>
              </div>
            </div>
            <button onClick={handleSalvarCartao} disabled={!nome.trim() || !limite || !diaFechamento || !diaVencimento || criarMutation.isPending || editarMutation.isPending} className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-primary/20 active:scale-[0.98] text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {(criarMutation.isPending || editarMutation.isPending)
                ? <><Loader2 size={16} className="animate-spin" /> {tr('Salvando...', 'Saving...')}</>
                : cartaoEditando
                  ? <><Pencil size={16} /> {tr('Atualizar Cartão', 'Update Card')}</>
                  : <><Plus size={16} /> {tr('Criar Cartão', 'Create Card')}</>
              }
            </button>
          </div>
        </div>
      )}

      {modalPagar && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" role="dialog" aria-modal="true">
          <div ref={modalPagarRef} className="glass w-full max-w-sm rounded-2xl p-6 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2"><DollarSign size={18} className="text-emerald-400" /><h3 className="font-bold text-white">{tr('Pagar Fatura', 'Pay Invoice')}</h3></div>
              <button onClick={() => { setModalPagar(null); setValorPagamento(''); setContaPagamentoId(''); }} className="text-muted-foreground hover:text-white transition-colors"><X size={18} /></button>
            </div>
            <div className="bg-white/5 rounded-xl p-3">
              <p className="text-xs text-muted-foreground">{tr('Fatura', 'Invoice')} {String(modalPagar.mes).padStart(2, '0')}/{modalPagar.ano}</p>
              <p className="text-lg font-bold text-white mt-1">{tr('Restante', 'Remaining')}: {formatarMoeda(modalPagar.valorRestante ?? 0, moeda)}</p>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-2xs font-bold text-muted-foreground uppercase tracking-[0.2em]">{tr('Conta de Débito', 'Debit Account')}</label>
                <select value={contaPagamentoId} onChange={(e) => setContaPagamentoId(e.target.value)} className="w-full bg-secondary/30 border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-medium appearance-none">
                  <option value="" className="bg-card text-white">{tr('Selecione...', 'Select...')}</option>
                  {contas.map((c) => (
                    <option key={c.id} value={c.id} className="bg-card text-white">{c.nome} — {formatarMoeda(c.saldo ?? 0, moeda)}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-2xs font-bold text-muted-foreground uppercase tracking-[0.2em]">{tr('Valor', 'Amount')}</label>
                <input type="number" step="0.01" value={valorPagamento} onChange={(e) => setValorPagamento(e.target.value)} className="w-full bg-secondary/30 border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-medium placeholder:text-muted-foreground/30" />
              </div>
            </div>
            <button onClick={() => pagarMutation.mutate()} disabled={!contaPagamentoId || !valorPagamento || Number(valorPagamento) <= 0 || pagarMutation.isPending} className="w-full bg-emerald-500 hover:bg-emerald-500/90 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.98] text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {pagarMutation.isPending ? <><Loader2 size={16} className="animate-spin" /> {tr('Pagando...', 'Paying...')}</> : <><DollarSign size={16} /> {tr('Confirmar Pagamento', 'Confirm Payment')}</>}
            </button>
          </div>
        </div>
      )}
      <DeleteConfirmationModal
        isOpen={!!cartaoParaDeletar}
        title={tr('Remover Cartão?', 'Remove Card?')}
        description={
          <>
            {tr('Você está prestes a remover', 'You are about to remove')} <span className="text-white font-semibold">"{cartaoParaDeletar?.nome}"</span>.
            <br />
            {tr('Se não houver faturas pendentes, as faturas já pagas e os lançamentos vinculados serão desativados em cascata.', 'If there are no pending invoices, paid invoices and linked entries will be deactivated in cascade.')}
          </>
        }
        confirmText={tr('CONFIRMAR', 'CONFIRM')}
        loadingText={tr('REMOVENDO...', 'REMOVING...')}
        isLoading={deletarMutation.isPending}
        onCancel={() => {
          if (!deletarMutation.isPending) {
            setCartaoParaDeletar(null);
          }
        }}
        onConfirm={() => {
          if (!cartaoParaDeletar) return;
          deletarMutation.mutate(cartaoParaDeletar.id);
        }}
      />
    </MainLayout>
  );
};
