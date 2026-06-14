import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { X, TrendingDown, TrendingUp, Sparkles, Loader2 } from 'lucide-react';
import { useModalA11y } from '../../hooks/useModalA11y';
import { useI18nStore } from '../../store/useI18nStore';
import { toast } from '../../store/useToastStore';
import { getApiErrorMessage } from '../../lib/errorMessage';
import { investimentosApi } from '../../lib/investimentosApi';
import {
  movimentacoesInvestimentoApi,
  RendimentoPayload,
} from '../../lib/movimentacoesInvestimentoApi';
import { InvestmentQuickSection } from './InvestmentQuickSection';
import { toLocalDateStr } from '../../lib/dateUtils';
import { invalidateInvestmentQueries } from '../../lib/queryInvalidation';

type Tab = 'depositar' | 'sacar' | 'rendimento';

interface MovimentacaoInvestimentoModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: Tab;
}

interface TabConfig {
  key: Tab;
  label: string;
  labelEn: string;
  tabLabel?: string;
  tabLabelEn?: string;
  mobileLabel: string;
  mobileLabelEn: string;
  icon: React.ReactNode;
  color: string;
  activeCls: string;
}

const TABS: TabConfig[] = [
  {
    key: 'depositar',
    label: 'Depositar', labelEn: 'Deposit', mobileLabel: 'Dep.', mobileLabelEn: 'Dep.',
    icon: <TrendingDown size={16} />,
    color: 'text-blue-400',
    activeCls: 'border-blue-500 bg-blue-500/10 text-blue-400 shadow-lg shadow-blue-500/10',
  },
  {
    key: 'sacar',
    label: 'Sacar', labelEn: 'Withdraw', mobileLabel: 'Saq.', mobileLabelEn: 'Wth.',
    icon: <TrendingUp size={16} />,
    color: 'text-success',
    activeCls: 'border-success bg-success-muted text-success shadow-lg shadow-success/10',
  },
  {
    key: 'rendimento',
    label: 'Registrar Rendimento', labelEn: 'Record Earnings',
    tabLabel: 'Rendimento', tabLabelEn: 'Earnings',
    mobileLabel: 'Rend.', mobileLabelEn: 'Earn.',
    icon: <Sparkles size={16} />,
    color: 'text-primary',
    activeCls: 'border-primary bg-primary/10 text-primary shadow-lg shadow-primary/10',
  },
];

const ensureArray = <T,>(value: unknown): T[] => {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === 'object' && Array.isArray((value as { content: T[] }).content)) {
    return (value as { content: T[] }).content;
  }
  return [];
};

export const MovimentacaoInvestimentoModal = ({
  isOpen,
  onClose,
  defaultTab = 'rendimento',
}: MovimentacaoInvestimentoModalProps) => {
  const language = useI18nStore((s) => s.language);
  const tr = (pt: string, en: string) => (language === 'en-US' ? en : pt);
  const queryClient = useQueryClient();

  const [tab, setTab] = useState<Tab>(defaultTab);

  const [rendInvId, setRendInvId] = useState('');
  const [rendValor, setRendValor] = useState('');
  const [rendData, setRendData] = useState(toLocalDateStr(new Date()));
  const [rendObs, setRendObs] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTab(defaultTab);
      setRendInvId('');
      setRendValor('');
      setRendData(toLocalDateStr(new Date()));
      setRendObs('');
    }
  }, [isOpen, defaultTab]);

  const { data: investimentosRaw = [] } = useQuery({
    queryKey: ['investimentos'],
    queryFn: () => investimentosApi.listar(),
    enabled: isOpen,
  });
  const investimentosList = ensureArray<{ id: number; descricao: string }>(investimentosRaw);

  const invalidarTudo = () => invalidateInvestmentQueries(queryClient);

  const rendimentoMutation = useMutation({
    mutationFn: (payload: RendimentoPayload) =>
      movimentacoesInvestimentoApi.registrarRendimento(payload),
    onSuccess: () => {
      invalidarTudo();
      toast.success(tr('Rendimento registrado com sucesso.', 'Earnings recorded successfully.'));
      onClose();
    },
    onError: (e: unknown) =>
      toast.error(getApiErrorMessage(e, tr('Erro ao registrar rendimento.', 'Failed to record earnings.'))),
  });

  function submitRendimento() {
    if (!rendInvId || !rendValor || Number(rendValor) === 0) return;
    rendimentoMutation.mutate({
      investimentoId: Number(rendInvId),
      valor: Number(rendValor),
      data: rendData,
      observacao: rendObs.trim() || undefined,
    });
  }

  const dialogRef = useModalA11y(isOpen, onClose);

  if (!isOpen) return null;

  const activeTab = TABS.find((t) => t.key === tab)!;

  return (
    <div className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-2 sm:p-4 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-overlay backdrop-blur-sm" onClick={onClose} />

      <div
        ref={dialogRef}
        className="glass w-full max-w-xl max-h-[94dvh] overflow-y-auto rounded-2xl sm:rounded-3xl p-4 sm:p-8 relative z-10 animate-in zoom-in-95 duration-300"
      >
        <div className="flex items-start sm:items-center justify-between mb-6 gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-primary/10 flex items-center justify-center ${activeTab.color}`}>
              {activeTab.icon}
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-foreground leading-tight">
                {language === 'en-US' ? activeTab.labelEn : activeTab.label}
              </h3>
              <p className="text-2xs uppercase font-bold text-muted-foreground tracking-widest">
                {tr('Movimentação de Investimento', 'Investment Movement')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-foreground/5 rounded-full text-muted-foreground hover:text-foreground transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-6">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`py-2.5 px-2 rounded-xl border font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
                tab === t.key
                  ? t.activeCls
                  : 'border-transparent bg-secondary/20 text-muted-foreground hover:text-foreground'
              }`}
            >
              <span className="flex-shrink-0">{t.icon}</span>
              <span className="hidden sm:inline">{language === 'en-US' ? (t.tabLabelEn ?? t.labelEn) : (t.tabLabel ?? t.label)}</span>
              <span className="sm:hidden">{language === 'en-US' ? t.mobileLabelEn : t.mobileLabel}</span>
            </button>
          ))}
        </div>

        {tab === 'depositar' && (
          <InvestmentQuickSection
            key="depositar"
            defaultOperacao="APORTE"
            lockOperacao
            onCancel={onClose}
            onSuccess={() => { invalidarTudo(); onClose(); }}
          />
        )}

        {tab === 'sacar' && (
          <InvestmentQuickSection
            key="sacar"
            defaultOperacao="RESGATE"
            lockOperacao
            onCancel={onClose}
            onSuccess={() => { invalidarTudo(); onClose(); }}
          />
        )}

        {tab === 'rendimento' && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-2xs font-bold text-muted-foreground uppercase tracking-[0.2em]">
                {tr('Investimento', 'Investment')}
              </label>
              <select
                value={rendInvId}
                onChange={(e) => setRendInvId(e.target.value)}
                className="w-full bg-secondary/30 border border-foreground/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-medium appearance-none"
              >
                <option value="" className="bg-card text-foreground">{tr('Selecione...', 'Select...')}</option>
                {investimentosList.map((inv) => (
                  <option key={inv.id} value={inv.id} className="bg-card text-foreground">{inv.descricao}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-2xs font-bold text-muted-foreground uppercase tracking-[0.2em]">
                {tr('Valor (negativo = perda / marcação a mercado)', 'Amount (negative = loss / mark-to-market)')}
              </label>
              <input
                type="number"
                step="0.01"
                value={rendValor}
                onChange={(e) => setRendValor(e.target.value)}
                placeholder="0,00"
                autoFocus
                className="w-full bg-secondary/30 border border-foreground/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-medium placeholder:text-muted-foreground/30"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-2xs font-bold text-muted-foreground uppercase tracking-[0.2em]">
                {tr('Data', 'Date')}
              </label>
              <input
                type="date"
                value={rendData}
                max={toLocalDateStr(new Date())}
                onChange={(e) => setRendData(e.target.value)}
                className="w-full bg-secondary/30 border border-foreground/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-2xs font-bold text-muted-foreground uppercase tracking-[0.2em]">
                {tr('Observação (opcional)', 'Notes (optional)')}
              </label>
              <input
                type="text"
                value={rendObs}
                onChange={(e) => setRendObs(e.target.value)}
                maxLength={255}
                placeholder={tr('Ex: rendimento mensal CDB', 'E.g. monthly CDB yield')}
                className="w-full bg-secondary/30 border border-foreground/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-medium placeholder:text-muted-foreground/30"
              />
            </div>

            <button
              onClick={submitRendimento}
              disabled={!rendInvId || !rendValor || Number(rendValor) === 0 || rendimentoMutation.isPending}
              className="w-full bg-primary hover:bg-primary-strong text-primary-foreground font-bold py-3 rounded-xl transition-all shadow-lg shadow-primary/20 active:scale-[0.98] text-sm disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {rendimentoMutation.isPending
                ? <><Loader2 size={16} className="animate-spin" /> {tr('Registrando...', 'Recording...')}</>
                : <><Sparkles size={16} /> {tr('Registrar Rendimento', 'Record Earnings')}</>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
