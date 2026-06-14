import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { formatarMoeda } from '../../lib/formatters';
import { useI18nStore } from '../../store/useI18nStore';
import { t } from '../../lib/i18n';

interface InvestmentCompositionProps {
  saldoTotalContas: number;
  totalInvestido: number;
  moeda: 'BRL' | 'USD' | 'EUR';
}

const COLORS = ['#14b8a6', '#7c3aed'];

export const InvestmentComposition = ({
  saldoTotalContas,
  totalInvestido,
  moeda,
}: InvestmentCompositionProps) => {
  const language = useI18nStore((state) => state.language);
  const parseTooltipValue = (value: unknown): number => {
    if (Array.isArray(value)) {
      return Number(value[0] || 0);
    }
    return Number(value || 0);
  };

  const dados = [
    { name: t(language, 'accounts'), value: saldoTotalContas },
    { name: t(language, 'investments'), value: totalInvestido },
  ].filter((item) => item.value > 0);

  const total = saldoTotalContas + totalInvestido;

  return (
    <div className="glass p-4 sm:p-6 lg:p-8 rounded-2xl sm:rounded-3xl flex flex-col items-center mb-8 sm:mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-250">
      <div className="w-full mb-5 sm:mb-8 text-center">
        <h4 className="text-lg sm:text-xl font-bold text-foreground">{t(language, 'compositionTitle')}</h4>
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest mt-1">
          {t(language, 'accountsVsInvestments')}
        </p>
      </div>

      <div className="relative w-full max-w-sm sm:max-w-md aspect-square max-h-[240px] sm:max-h-[300px]">
        {dados.length > 0 ? (
          <>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dados}
                  cx="50%"
                  cy="50%"
                  innerRadius="62%"
                  outerRadius="84%"
                  dataKey="value"
                  paddingAngle={6}
                >
                  {dados.map((_, index) => (
                    <Cell key={`item-${index}`} fill={COLORS[index % COLORS.length]} stroke="var(--card)" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  cursor={false}
                  formatter={(value, name) => [
                    formatarMoeda(parseTooltipValue(value), moeda),
                    String(name || t(language, 'chartTotalValue')),
                  ]}
                  contentStyle={{
                    backgroundColor: 'rgba(2, 6, 23, 0.96)',
                    border: '1px solid rgba(124, 58, 237, 0.35)',
                    borderRadius: '12px',
                    color: '#fff',
                  }}
                  itemStyle={{ color: '#fff', textTransform: 'none' }}
                  labelStyle={{ color: '#cbd5e1', marginBottom: '4px' }}
                  wrapperStyle={{ outline: 'none', pointerEvents: 'none', zIndex: 20 }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
              <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest leading-none">
                {t(language, 'chartTotal')}
              </p>
              <p className="text-sm font-bold text-foreground mt-1">{formatarMoeda(total, moeda)}</p>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground text-xs font-bold uppercase tracking-widest">
            {t(language, 'noData')}
          </div>
        )}
      </div>

      <div className="w-full max-w-md mt-5 sm:mt-6 space-y-3">
        {dados.map((item, idx) => (
          <div key={item.name} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: COLORS[idx % COLORS.length] }}
              />
              <span className="text-muted-foreground font-semibold">{item.name}</span>
            </div>
            <span className="text-foreground font-bold">
              {((item.value / (total || 1)) * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
