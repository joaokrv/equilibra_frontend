import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useMemo, useState } from 'react';
import { formatarMoeda } from '../../lib/formatters';
import { useI18nStore } from '../../store/useI18nStore';
import { t } from '../../lib/i18n';

const COLORS = ['#7c3aed', '#a78bfa', '#4c1d95', '#1e1b4b'];

interface CategoryData {
  name: string;
  value: number;
}

interface CategoryDistributionProps {
  despesasPorCategoria: CategoryData[];
  receitasPorCategoria: CategoryData[];
  totalGastos: number;
  totalReceitas: number;
  moeda: 'BRL' | 'USD' | 'EUR';
}

/**
 * Gráfico Donut + legenda de distribuição com filtro por tipo.
 */
export const CategoryDistribution = ({
  despesasPorCategoria,
  receitasPorCategoria,
  totalGastos,
  totalReceitas,
  moeda,
}: CategoryDistributionProps) => {
  const language = useI18nStore((state) => state.language);
  const [filtro, setFiltro] = useState<'DESPESA' | 'RECEITA' | 'AMBOS'>('DESPESA');

  const dadosFiltrados = useMemo(() => {
    if (filtro === 'RECEITA') {
      return receitasPorCategoria;
    }
    if (filtro === 'AMBOS') {
      return [
        { name: t(language, 'summaryIncome'), value: totalReceitas },
        { name: t(language, 'summaryExpenses'), value: totalGastos },
      ].filter((item) => item.value > 0);
    }
    return despesasPorCategoria;
  }, [filtro, receitasPorCategoria, despesasPorCategoria, totalReceitas, totalGastos, language]);

  const totalFiltro = useMemo(
    () => dadosFiltrados.reduce((acc, item) => acc + item.value, 0),
    [dadosFiltrados],
  );

  return (
  <div className="glass p-8 rounded-3xl flex flex-col items-center">
    <div className="w-full mb-8 text-center">
      <h4 className="text-xl font-bold text-white">{t(language, 'distributionTitle')}</h4>
      <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest mt-1">
        {t(language, 'byCategory')}
      </p>

      <div className="mt-4 inline-flex rounded-full bg-secondary/50 p-1 border border-white/10">
        {[
          { id: 'DESPESA', label: t(language, 'filterExpenses') },
          { id: 'RECEITA', label: t(language, 'filterIncome') },
          { id: 'AMBOS', label: t(language, 'filterBoth') },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFiltro(item.id as 'DESPESA' | 'RECEITA' | 'AMBOS')}
            className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-full transition-all ${
              filtro === item.id
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-white'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>

    <div className="relative w-full aspect-square max-h-[250px]">
      {dadosFiltrados.length > 0 ? (
        <>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={dadosFiltrados}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={8}
                dataKey="value"
              >
                {dadosFiltrados.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: any) => formatarMoeda(Number(value || 0), moeda)} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
            <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest leading-none">
              {t(language, 'chartTotal')}
            </p>
            <p className="text-sm font-bold text-white mt-1">{formatarMoeda(totalFiltro, moeda)}</p>
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center h-full text-muted-foreground text-xs font-bold uppercase tracking-widest">
          {t(language, 'noData')}
        </div>
      )}
    </div>

    <div className="w-full mt-8 space-y-3">
      {dadosFiltrados.slice(0, 4).map((cat, idx) => (
        <div key={cat.name} className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: COLORS[idx % COLORS.length] }}
            />
            <span className="text-xs font-semibold text-muted-foreground">{cat.name}</span>
          </div>
          <span className="text-xs font-bold text-white">
            {((cat.value / (totalFiltro || 1)) * 100).toFixed(0)}%
          </span>
        </div>
      ))}
    </div>
  </div>
  );
};
