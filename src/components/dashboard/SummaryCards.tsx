import {
  TrendingUp,
  TrendingDown,
  Landmark,
  PieChart as PieIcon,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { formatarMoeda } from '../../lib/formatters';
import { useI18nStore } from '../../store/useI18nStore';
import { t } from '../../lib/i18n';

interface SummaryCardProps {
  title: string;
  value: number;
  delta: string;
  isPositive: boolean;
  icon: React.ElementType;
  moeda: 'BRL' | 'USD' | 'EUR';
}

const SummaryCard = ({ title, value, delta, isPositive, icon: Icon, moeda }: SummaryCardProps) => (
  <div className="glass p-6 rounded-2xl flex flex-col justify-between hover:border-primary/20 transition-all duration-300 group">
    <div className="flex justify-between items-start mb-4">
      <div className="p-2 bg-secondary/50 rounded-lg text-muted-foreground group-hover:text-primary transition-colors">
        <Icon size={20} />
      </div>
      <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full ${isPositive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
        {isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
        {delta}
      </div>
    </div>
    <div>
      <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-gradient">{formatarMoeda(value, moeda)}</h3>
    </div>
  </div>
);

interface SummaryCardsProps {
  totalReceitas: number;
  totalGastos: number;
  totalInvestido: number;
  saldoTotalContas: number;
  moeda: 'BRL' | 'USD' | 'EUR';
}

/**
 * Componente dos 4 cards de resumo financeiro do Dashboard.
 */
export const SummaryCards = ({
  totalReceitas,
  totalGastos,
  totalInvestido,
  saldoTotalContas,
  moeda
}: SummaryCardsProps) => {
  const language = useI18nStore((state) => state.language);

  return (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
    <SummaryCard
      title={t(language, 'summaryIncome')}
      value={totalReceitas}
      delta="+0%"
      isPositive={true}
      icon={TrendingUp}
      moeda={moeda}
    />
    <SummaryCard
      title={t(language, 'summaryExpenses')}
      value={totalGastos}
      delta="+0%"
      isPositive={false}
      icon={TrendingDown}
      moeda={moeda}
    />
    <SummaryCard
      title={t(language, 'summaryInvestments')}
      value={totalInvestido}
      delta="+0%"
      isPositive={true}
      icon={Landmark}
      moeda={moeda}
    />
    <SummaryCard
      title={t(language, 'summaryBalance')}
      value={saldoTotalContas}
      delta="+0%"
      isPositive={true}
      icon={PieIcon}
      moeda={moeda}
    />
  </div>
  );
};
