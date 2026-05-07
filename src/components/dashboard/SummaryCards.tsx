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
import { useState } from 'react';

interface SummaryCardProps {
  title: string;
  value: number;
  deltaPercent: number | null;
  isPositive: boolean | null;
  isTrendUp: boolean | null;
  icon: React.ElementType;
  valorAnterior: number | null;
  secondaryLabel?: string;
  secondaryValue?: number;
  moeda: 'BRL' | 'USD' | 'EUR';
  inicioPeriodoAnterior?: string;
  inicioPeriodoAtual?: string;
}

const SummaryCard = ({
  title,
  value,
  deltaPercent,
  isPositive,
  isTrendUp,
  icon: Icon,
  valorAnterior,
  secondaryLabel,
  secondaryValue,
  moeda,
  inicioPeriodoAnterior,
  inicioPeriodoAtual,
}: SummaryCardProps) => {
  const language = useI18nStore((state) => state.language);
  const [tooltipOpen, setTooltipOpen] = useState(false);

  const deltaLabel = deltaPercent === null
    ? '--'
    : `${deltaPercent >= 0 ? '+' : ''}${formatarPorcentagem(deltaPercent, 1)}`;

  const deltaClass = isPositive === null
    ? 'bg-zinc-500/10 text-zinc-400'
    : isPositive
      ? 'bg-emerald-500/10 text-emerald-500'
      : 'bg-rose-500/10 text-rose-500';

  // Formatar nome do mês
  const formatMonthName = (dateStr: string): string => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const monthName = date.toLocaleDateString(language, { month: 'long' });
    return monthName.charAt(0).toUpperCase() + monthName.slice(1);
  };

  const monthAnterior = formatMonthName(inicioPeriodoAnterior || '');
  const monthAtual = formatMonthName(inicioPeriodoAtual || '');

  const showTooltip = valorAnterior !== null && deltaPercent !== null;

  return (
    <div className="glass p-6 rounded-2xl flex flex-col justify-between hover:border-primary/20 transition-all duration-300 group relative">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-secondary/50 rounded-lg text-muted-foreground group-hover:text-primary transition-colors">
          <Icon size={20} />
        </div>
        <div className="text-right relative">
          <button
            type="button"
            onClick={() => showTooltip && setTooltipOpen(!tooltipOpen)}
            onMouseEnter={() => showTooltip && setTooltipOpen(true)}
            onMouseLeave={() => showTooltip && setTooltipOpen(false)}
            className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full ${deltaClass} cursor-pointer transition-all`}
          >
            {isTrendUp === null ? <Minus size={12} /> : isTrendUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {deltaLabel}
          </button>

          {/* Tooltip */}
          {showTooltip && tooltipOpen && (
            <div className="absolute bottom-full right-0 mb-2 z-50 pointer-events-none">
              <div className="bg-secondary/95 border border-primary/30 rounded-lg p-3 whitespace-nowrap shadow-lg backdrop-blur-sm">
                <div className="text-xs text-muted-foreground mb-2">
                  <div className="font-semibold text-foreground">{monthAnterior}</div>
                  <div>{formatarMoeda(valorAnterior, moeda)}</div>
                </div>
                <div className="text-xs text-muted-foreground mb-2">
                  <div className="font-semibold text-foreground">{monthAtual}</div>
                  <div>{formatarMoeda(value, moeda)}</div>
                </div>
                <div className={`text-sm font-bold ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {deltaPercent >= 0 ? '▲' : '▼'} {formatarPorcentagem(deltaPercent, 1)}%
                </div>
              </div>
            </div>
          )}
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
  totalReceitasAnterior: number | null;
  totalGastos: number;
  totalGastosAnterior: number | null;
  totalReceitasPendentes: number;
  totalGastosPendentes: number;
  variacaoReceitasPercent: number | null;
  variacaoGastosPercent: number | null;
  variacaoInvestimentosPercent: number | null;
  variacaoSaldoContasPercent: number | null;
  totalInvestido: number;
  totalInvestidoAnterior: number | null;
  saldoTotalContas: number;
  saldoTotalContasAnterior: number | null;
  moeda: 'BRL' | 'USD' | 'EUR';
  inicioPeriodoAnterior?: string;
  inicioPeriodoAtual?: string;
}

export const SummaryCards = ({
  totalReceitas,
  totalReceitasAnterior,
  totalGastos,
  totalGastosAnterior,
  totalReceitasPendentes,
  totalGastosPendentes,
  variacaoReceitasPercent,
  variacaoGastosPercent,
  variacaoInvestimentosPercent,
  variacaoSaldoContasPercent,
  totalInvestido,
  totalInvestidoAnterior,
  saldoTotalContas,
  saldoTotalContasAnterior,
  moeda,
  inicioPeriodoAnterior,
  inicioPeriodoAtual
}: SummaryCardsProps) => {
  const language = useI18nStore((state) => state.language);
  const pendingLabel = language === 'en-US' ? 'Pending' : 'Pendente';

  return (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
    <SummaryCard
      title={t(language, 'summaryIncome')}
      value={totalReceitas}
      valorAnterior={totalReceitasAnterior}
      secondaryLabel={pendingLabel}
      secondaryValue={totalReceitasPendentes}
      deltaPercent={variacaoReceitasPercent}
      isPositive={variacaoReceitasPercent === null ? null : variacaoReceitasPercent >= 0}
      isTrendUp={variacaoReceitasPercent === null ? null : variacaoReceitasPercent >= 0}
      icon={TrendingUp}
      moeda={moeda}
      inicioPeriodoAnterior={inicioPeriodoAnterior}
      inicioPeriodoAtual={inicioPeriodoAtual}
    />
    <SummaryCard
      title={t(language, 'summaryExpenses')}
      value={totalGastos}
      valorAnterior={totalGastosAnterior}
      secondaryLabel={pendingLabel}
      secondaryValue={totalGastosPendentes}
      deltaPercent={variacaoGastosPercent}
      isPositive={variacaoGastosPercent === null ? null : variacaoGastosPercent <= 0}
      isTrendUp={variacaoGastosPercent === null ? null : variacaoGastosPercent >= 0}
      icon={TrendingDown}
      moeda={moeda}
      inicioPeriodoAnterior={inicioPeriodoAnterior}
      inicioPeriodoAtual={inicioPeriodoAtual}
    />
    <SummaryCard
      title={t(language, 'summaryInvestments')}
      value={totalInvestido}
      valorAnterior={totalInvestidoAnterior}
      deltaPercent={variacaoInvestimentosPercent}
      isPositive={variacaoInvestimentosPercent === null ? null : variacaoInvestimentosPercent >= 0}
      isTrendUp={variacaoInvestimentosPercent === null ? null : variacaoInvestimentosPercent >= 0}
      icon={Landmark}
      moeda={moeda}
      inicioPeriodoAnterior={inicioPeriodoAnterior}
      inicioPeriodoAtual={inicioPeriodoAtual}
    />
    <SummaryCard
      title={t(language, 'summaryBalance')}
      value={saldoTotalContas}
      valorAnterior={saldoTotalContasAnterior}
      deltaPercent={variacaoSaldoContasPercent}
      isPositive={variacaoSaldoContasPercent === null ? null : variacaoSaldoContasPercent >= 0}
      isTrendUp={variacaoSaldoContasPercent === null ? null : variacaoSaldoContasPercent >= 0}
      icon={PieIcon}
      moeda={moeda}
      inicioPeriodoAnterior={inicioPeriodoAnterior}
      inicioPeriodoAtual={inicioPeriodoAtual}
    />
  </div>
  );
};
