import { useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  FileText, Loader2, ChevronLeft, ChevronRight, AlertTriangle, CheckCircle2, Clock,
  DollarSign, X, Calendar, CreditCard,
} from 'lucide-react';
import { MainLayout } from '../../components/layout/MainLayout';
import { ErrorState } from '../../components/ui/StateViews';
import { useModalA11y } from '../../hooks/useModalA11y';
import { CartoesService } from '../../api/services/CartoesService';
import { ContasService } from '../../api/services/ContasService';
import { useFaturasPorCartao, useTransacoesPorFatura, usePagarFatura } from '../../hooks/useFaturas';
import { formatarMoeda } from '../../lib/formatters';
import { getApiErrorMessage } from '../../lib/errorMessage';
import { toast } from '../../store/useToastStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useI18nStore } from '../../store/useI18nStore';
import { FaturaResponseDTO } from '../../api/models/FaturaResponseDTO';

export const FaturasPage = () => {
  const { cartaoId } = useParams<{ cartaoId?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const moeda = (useAuthStore((s) => s.user?.moeda) as 'BRL' | 'USD' | 'EUR') || 'BRL';
  const language = useI18nStore((s) => s.language);
  const tr = (pt: string, en: string) => (language === 'en-US' ? en : pt);

  const cartaoIdNum = cartaoId ? Number(cartaoId) : null;
  const mesParam = searchParams.get('mes') ? Number(searchParams.get('mes')) : null;
  const anoParam = searchParams.get('ano') ? Number(searchParams.get('ano')) : null;

  const hoje = new Date();
  const [mes, setMes] = useState(mesParam ?? hoje.getMonth() + 1);
  const [ano, setAno] = useState(anoParam ?? hoje.getFullYear());

  const [modalPagar, setModalPagar] = useState(false);
  const [valorPagamento, setValorPagamento] = useState('');
  const [contaPagamentoId, setContaPagamentoId] = useState('');

  const modalRef = useModalA11y(modalPagar, () => {
    setModalPagar(false);
    setValorPagamento('');
    setContaPagamentoId('');
  });

  const { data: cartoes = [], isLoading: cartoesLoading, isError: cartoesError, refetch: refetchCartoes } = useQuery({
    queryKey: ['cartoes'],
    queryFn: () => CartoesService.listarCartoes(),
  });

  const { data: contas = [] } = useQuery({
    queryKey: ['contas'],
    queryFn: () => ContasService.listarContas(),
  });

  const { data: faturas = [], isLoading: faturasLoading } = useFaturasPorCartao(cartaoIdNum);

  const navMes = (dir: -1 | 1) => {
    let m = mes + dir;
    let a = ano;
    if (m < 1) { m = 12; a--; }
    if (m > 12) { m = 1; a++; }
    setMes(m);
    setAno(a);
  };

  const faturaAtual: FaturaResponseDTO | undefined = faturas.find(f => f.mes === mes && f.ano === ano);

  const { data: transacoes = [], isLoading: transacoesLoading } = useTransacoesPorFatura(
    faturaAtual?.id ?? null
  );

  const pagarMutation = usePagarFatura();

  const cartaoAtual = cartaoIdNum ? cartoes.find(c => c.id === cartaoIdNum) : null;

  const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: typeof CheckCircle2 }> = {
    ABERTA: { label: tr('Aberta', 'Open'), color: 'text-blue-400', bgColor: 'bg-blue-500/10', icon: Clock },
    FECHADA: { label: tr('Fechada', 'Closed'), color: 'text-amber-400', bgColor: 'bg-amber-500/10', icon: Calendar },
    PAGA: { label: tr('Paga', 'Paid'), color: 'text-success', bgColor: 'bg-success-muted', icon: CheckCircle2 },
    ATRASADA: { label: tr('Atrasada', 'Overdue'), color: 'text-danger', bgColor: 'bg-danger-muted', icon: AlertTriangle },
  };

  const handlePagar = () => {
    if (!faturaAtual?.id || !contaPagamentoId || !valorPagamento) {
      toast.warning(tr('Preencha todos os campos', 'Fill all fields'));
      return;
    }
    pagarMutation.mutate(
      { id: faturaAtual.id, body: { contaId: Number(contaPagamentoId), valorPago: Number(valorPagamento) } },
      {
        onSuccess: () => {
          toast.success(tr('Pagamento registrado', 'Payment registered'));
          setModalPagar(false);
          setValorPagamento('');
          setContaPagamentoId('');
        },
        onError: (error: unknown) =>
          toast.error(getApiErrorMessage(error, tr('Erro ao pagar fatura', 'Error paying invoice'))),
      }
    );
  };
  if (!cartaoIdNum) {
    return (
      <MainLayout>
        <div className="p-3 sm:p-4 lg:p-6 space-y-5 sm:space-y-6 animate-in fade-in duration-500">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{tr('Faturas', 'Invoices')}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {tr('Acompanhe as faturas de seus cartões', 'Track your credit card invoices')}
            </p>
          </div>

          {cartoesLoading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="animate-spin text-primary" size={32} />
            </div>
          ) : cartoesError ? (
            <ErrorState
              title={tr('Não foi possível carregar os cartões', 'Could not load cards')}
              description={tr('Verifique sua conexão e tente novamente.', 'Check your connection and try again.')}
              retryLabel={tr('Tentar novamente', 'Try again')}
              onRetry={() => refetchCartoes()}
            />
          ) : cartoes.length === 0 ? (
            <div className="glass rounded-2xl p-6 sm:p-10 flex flex-col items-center justify-center gap-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary/50">
                <FileText size={32} />
              </div>
              <p className="text-sm text-muted-foreground font-medium max-w-xs">
                {tr('Nenhum cartão cadastrado', 'No cards registered')}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {cartoes.map((cartao) => (
                <div
                  key={cartao.id}
                  onClick={() => cartao.id && navigate(`/faturas/${cartao.id}`)}
                  className="glass rounded-2xl p-4 sm:p-5 cursor-pointer hover:bg-foreground/10 transition-all active:scale-[0.99] min-h-11 flex items-center"
                >
                  <div className="flex items-center gap-4 w-full">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                      <CreditCard size={18} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-foreground">{cartao.nome}</p>
                      <p className="text-xs text-muted-foreground">
                        {tr('Limite', 'Limit')}: {formatarMoeda(cartao.limite ?? 0, moeda)}
                        {' · '}
                        {tr('Disponível', 'Available')}: {formatarMoeda(cartao.limiteDisponivel ?? 0, moeda)}
                      </p>
                    </div>
                    <ChevronLeft size={18} className="text-muted-foreground rotate-180" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </MainLayout>
    );
  }
  return (
    <MainLayout>
      <div className="p-3 sm:p-4 lg:p-6 space-y-5 sm:space-y-6 animate-in fade-in duration-500">
        <button
          onClick={() => navigate('/faturas')}
          className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
        >
          <ChevronLeft size={18} /> {tr('Voltar', 'Back')}
        </button>

        {faturas.length > 0 && (
          <div className="flex items-center justify-between gap-3 glass rounded-xl px-3 py-2 flex-shrink-0 h-[44px] w-fit">
            <button onClick={() => navMes(-1)} className="min-h-11 min-w-11 sm:min-h-0 sm:min-w-0 p-2.5 sm:p-1 rounded-lg hover:bg-foreground/10 text-muted-foreground hover:text-foreground transition-all flex items-center justify-center"><ChevronLeft size={18} /></button>
            <span className="text-sm font-bold text-foreground capitalize min-w-[120px] text-center flex items-center justify-center">{new Date(ano, mes - 1).toLocaleDateString(language, { month: 'long', year: 'numeric' })}</span>
            <button onClick={() => navMes(1)} className="min-h-11 min-w-11 sm:min-h-0 sm:min-w-0 p-2.5 sm:p-1 rounded-lg hover:bg-foreground/10 text-muted-foreground hover:text-foreground transition-all flex items-center justify-center"><ChevronRight size={18} /></button>
          </div>
        )}

        {faturasLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        ) : !faturaAtual ? (
          <div className="glass rounded-2xl p-6 text-center">
            <p className="text-muted-foreground">{tr('Nenhuma fatura encontrada', 'No invoice found')}</p>
          </div>
        ) : (() => {
          const statusCfg = statusConfig[faturaAtual.status || 'ABERTA'];
          const StatusIcon = statusCfg.icon;
          return (
            <>
              <div className="glass rounded-2xl p-4 sm:p-6 space-y-5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                    <CreditCard size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-widest">
                      {tr('Fatura', 'Invoice')} {String(faturaAtual.mes).padStart(2, '0')}/{faturaAtual.ano}
                    </p>
                    <p className="text-lg font-bold text-foreground">{cartaoAtual?.nome}</p>
                    {cartaoAtual?.nomeConta && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {tr('Conta', 'Account')}: <span className="text-foreground font-semibold">{cartaoAtual.nomeConta}</span>
                      </p>
                    )}
                  </div>
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${statusCfg.bgColor}`}>
                    <StatusIcon size={14} className={statusCfg.color} />
                    <span className={`text-xs font-bold ${statusCfg.color}`}>{statusCfg.label}</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-foreground/5 rounded-xl p-3">
                    <p className="text-2xs text-muted-foreground uppercase tracking-widest">{tr('Total', 'Total')}</p>
                    <p className="text-base font-bold text-foreground mt-1">{formatarMoeda(faturaAtual.valorTotal ?? 0, moeda)}</p>
                  </div>
                  <div className="bg-foreground/5 rounded-xl p-3">
                    <p className="text-2xs text-muted-foreground uppercase tracking-widest">{tr('Pago', 'Paid')}</p>
                    <p className="text-base font-bold text-success mt-1">{formatarMoeda(faturaAtual.valorPago ?? 0, moeda)}</p>
                  </div>
                  <div className="bg-foreground/5 rounded-xl p-3">
                    <p className="text-2xs text-muted-foreground uppercase tracking-widest">{tr('Restante', 'Remaining')}</p>
                    <p className="text-base font-bold text-danger mt-1">{formatarMoeda(faturaAtual.valorRestante ?? 0, moeda)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-foreground/5">
                  <div>
                    <p className="text-2xs text-muted-foreground uppercase tracking-widest">{tr('Fecha em', 'Closes on')}</p>
                    <p className="text-sm font-bold text-foreground mt-1">
                      {faturaAtual.dataFechamento
                        ? new Date(faturaAtual.dataFechamento + 'T00:00:00').toLocaleDateString(language)
                        : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-2xs text-muted-foreground uppercase tracking-widest">{tr('Vence em', 'Due on')}</p>
                    <p className="text-sm font-bold text-foreground mt-1">
                      {faturaAtual.dataVencimento
                        ? new Date(faturaAtual.dataVencimento + 'T00:00:00').toLocaleDateString(language)
                        : '—'}
                    </p>
                  </div>
                </div>

                {cartaoAtual && (
                  <div className="grid grid-cols-2 gap-4 pt-3 border-t border-foreground/5">
                    <div>
                      <p className="text-2xs text-muted-foreground uppercase tracking-widest">{tr('Limite Total', 'Total Limit')}</p>
                      <p className="text-sm font-bold text-foreground mt-1">{formatarMoeda(cartaoAtual.limite ?? 0, moeda)}</p>
                    </div>
                    <div>
                      <p className="text-2xs text-muted-foreground uppercase tracking-widest">{tr('Disponível', 'Available')}</p>
                      <p className="text-sm font-bold text-success mt-1">{formatarMoeda(cartaoAtual.limiteDisponivel ?? 0, moeda)}</p>
                    </div>
                  </div>
                )}

                {faturaAtual.status !== FaturaResponseDTO.status.PAGA && (faturaAtual.valorRestante ?? 0) > 0 && (
                  <button
                    onClick={() => {
                      setValorPagamento(String(faturaAtual.valorRestante ?? 0));
                      if (cartaoAtual?.contaId) setContaPagamentoId(String(cartaoAtual.contaId));
                      setModalPagar(true);
                    }}
                    className="w-full bg-success hover:bg-success/90 text-primary-foreground font-bold py-3.5 sm:py-3 rounded-xl transition-all shadow-lg shadow-success/20 active:scale-[0.98] text-sm flex items-center justify-center gap-2 min-h-11"
                  >
                    <DollarSign size={16} /> {tr('Pagar Fatura', 'Pay Invoice')}
                  </button>
                )}
              </div>

              <div className="glass rounded-2xl p-4 sm:p-6 space-y-4">
                <h2 className="font-bold text-foreground">{tr('Transações da Fatura', 'Invoice Transactions')}</h2>
                {transacoesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="animate-spin text-primary" size={24} />
                  </div>
                ) : transacoes.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    {tr('Nenhuma transação nesta fatura', 'No transactions in this invoice')}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {transacoes.map((t) => (
                      <div key={t.id} className="flex items-center gap-3 bg-foreground/5 rounded-xl px-4 py-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-foreground truncate">{t.descricao}</p>
                          <p className="text-2xs text-muted-foreground">
                            {t.data ? new Date(t.data + 'T00:00:00').toLocaleDateString(language) : '—'}
                            {t.nomeCategoria && <span> · {t.nomeCategoria}</span>}
                          </p>
                        </div>
                        <p className="text-xs font-bold text-foreground">{formatarMoeda(t.valor ?? 0, moeda)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          );
        })()}
      </div>

      {modalPagar && faturaAtual && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-overlay backdrop-blur-sm animate-in fade-in duration-200" role="dialog" aria-modal="true">
          <div ref={modalRef} className="glass w-full max-w-sm rounded-2xl p-6 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign size={18} className="text-success" />
                <h3 className="font-bold text-foreground">{tr('Pagar Fatura', 'Pay Invoice')}</h3>
              </div>
              <button onClick={() => setModalPagar(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="bg-foreground/5 rounded-xl p-3">
              <p className="text-xs text-muted-foreground">
                {tr('Fatura', 'Invoice')} {String(faturaAtual.mes).padStart(2, '0')}/{faturaAtual.ano}
              </p>
              <p className="text-lg font-bold text-foreground mt-1">
                {tr('Restante', 'Remaining')}: {formatarMoeda(faturaAtual.valorRestante ?? 0, moeda)}
              </p>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-2xs font-bold text-muted-foreground uppercase tracking-[0.2em]">
                  {tr('Conta de Débito', 'Debit Account')}
                </label>
                <select
                  value={contaPagamentoId}
                  onChange={(e) => setContaPagamentoId(e.target.value)}
                  className="w-full bg-secondary/30 border border-foreground/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-medium appearance-none text-foreground"
                >
                  <option value="" className="bg-card text-foreground">{tr('Selecione...', 'Select...')}</option>
                  {contas.map((c) => (
                    <option key={c.id} value={c.id} className="bg-card text-foreground">
                      {c.nome} — {formatarMoeda(c.saldo ?? 0, moeda)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-2xs font-bold text-muted-foreground uppercase tracking-[0.2em]">
                  {tr('Valor', 'Amount')}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={valorPagamento}
                  onChange={(e) => setValorPagamento(e.target.value)}
                  className="w-full bg-secondary/30 border border-foreground/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-medium text-foreground"
                />
              </div>
            </div>
            <button
              onClick={handlePagar}
              disabled={!contaPagamentoId || !valorPagamento || Number(valorPagamento) <= 0 || pagarMutation.isPending}
              className="w-full bg-success hover:bg-success/90 text-primary-foreground font-bold py-3 rounded-xl transition-all shadow-lg shadow-success/20 active:scale-[0.98] text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {pagarMutation.isPending
                ? <><Loader2 size={16} className="animate-spin" /> {tr('Pagando...', 'Paying...')}</>
                : <><DollarSign size={16} /> {tr('Confirmar Pagamento', 'Confirm Payment')}</>
              }
            </button>
          </div>
        </div>
      )}
    </MainLayout>
  );
};
