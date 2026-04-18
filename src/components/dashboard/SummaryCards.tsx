import {
  TrendingUp,
  TrendingDown,
  Landmark,
  PieChart as PieIcon,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from 'lucide-react';
import { formatarMoeda, formatarPorcentagem } from '../../lib/formatters';
import { useI18nStore } from '../../store/useI18nStore';
import { t } from '../../lib/i18n';

interface SummaryCardProps {
  title: string;
  value: number;
  deltaPercent: number | null;
  isPositive: boolean | null;
  isTrendUp: boolean | null;
  icon: React.ElementType;
  secondaryLabel?: string;
  secondaryValue?: number;
  moeda: 'BRL' | 'USD' | 'EUR';
}

const SummaryCard = ({
  title,
  value,
  deltaPercent,
  isPositive,
  isTrendUp,
  icon: Icon,
  secondaryLabel,
  secondaryValue,
  moeda,
}: SummaryCardProps) => {
  const deltaLabel = deltaPercent === null
    ? '--'
    : `${deltaPercent >= 0 ? '+' : ''}${formatarPorcentagem(deltaPercent, 1)}`;

  const deltaClass = isPositive === null
    ? 'bg-zinc-500/10 text-zinc-400'
    : isPositive
      ? 'bg-emerald-500/10 text-emerald-500'
      : 'bg-rose-500/10 text-rose-500';

  return (
    <div className="glass p-6 rounded-2xl flex flex-col justify-between hover:border-primary/20 transition-all duration-300 group">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-secondary/50 rounded-lg text-muted-foreground group-hover:text-primary transition-colors">
          <Icon size={20} />
        </div>
        <div className="text-right">
          <div className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full ${deltaClass}`}>
            {isTrendUp === null ? <Minus size={12} /> : isTrendUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {deltaLabel}
          </div>
        </div>
      </div>
      <div>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-gradient">{formatarMoeda(value, moeda)}</h3>
        {secondaryLabel && typeof secondaryValue === 'number' && (
          <p className="mt-1.5 text-[11px] font-medium text-muted-foreground">
            {secondaryLabel}:{' '}
            <span className="text-foreground/80 font-semibold">{formatarMoeda(secondaryValue, moeda)}</span>
          </p>
        )}
      </div>
    </div>
  );
};

interface SummaryCardsProps {
  totalReceitas: number;
  totalGastos: number;
  totalReceitasPendentes: number;
  totalGastosPendentes: number;
  variacaoReceitasPercent: number | null;
  variacaoGastosPercent: number | null;
  variacaoInvestimentosPercent: number | null;
  variacaoSaldoContasPercent: number | null;
  totalInvestido: number;
  saldoTotalContas: number;
  moeda: 'BRL' | 'USD' | 'EUR';
}

export const SummaryCards = ({
  totalReceitas,
  totalGastos,
  totalReceitasPendentes,
  totalGastosPendentes,
  variacaoReceitasPercent,
  variacaoGastosPercent,
  variacaoInvestimentosPercent,
  variacaoSaldoContasPercent,
  totalInvestido,
  saldoTotalContas,
  moeda
}: SummaryCardsProps) => {
  const language = useI18nStore((state) => state.language);
  const pendingLabel = language === 'en-US' ? 'Pending' : 'Pendente';

  return (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
    <SummaryCard
      title={t(language, 'summaryIncome')}
      value={totalReceitas}
      secondaryLabel={pendingLabel}
      secondaryValue={totalReceitasPendentes}
      deltaPercent={variacaoReceitasPercent}
      isPositive={variacaoReceitasPercent === null ? null : variacaoReceitasPercent >= 0}
      isTrendUp={variacaoReceitasPercent === null ? null : variacaoReceitasPercent >= 0}
      icon={TrendingUp}
      moeda={moeda}
    />
    <SummaryCard
      title={t(language, 'summaryExpenses')}
      value={totalGastos}
      secondaryLabel={pendingLabel}
      secondaryValue={totalGastosPendentes}
      deltaPercent={variacaoGastosPercent}
      isPositive={variacaoGastosPercent === null ? null : variacaoGastosPercent <= 0}
      isTrendUp={variacaoGastosPercent === null ? null : variacaoGastosPercent >= 0}
      icon={TrendingDown}
      moeda={moeda}
    />
    <SummaryCard
      title={t(language, 'summaryInvestments')}
      value={totalInvestido}
      deltaPercent={variacaoInvestimentosPercent}
      isPositive={variacaoInvestimentosPercent === null ? null : variacaoInvestimentosPercent >= 0}
      isTrendUp={variacaoInvestimentosPercent === null ? null : variacaoInvestimentosPercent >= 0}
      icon={Landmark}
      moeda={moeda}
    />
    <SummaryCard
      title={t(language, 'summaryBalance')}
      value={saldoTotalContas}
      deltaPercent={variacaoSaldoContasPercent}
      isPositive={variacaoSaldoContasPercent === null ? null : variacaoSaldoContasPercent >= 0}
      isTrendUp={variacaoSaldoContasPercent === null ? null : variacaoSaldoContasPercent >= 0}
      icon={PieIcon}
      moeda={moeda}
    />
  </div>
  );
};
