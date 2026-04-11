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

/**
 * Mostra a composição do patrimônio atual entre contas e investimentos.
 */
export const InvestmentComposition = ({
  saldoTotalContas,
  totalInvestido,
  moeda,
}: InvestmentCompositionProps) => {
  const language = useI18nStore((state) => state.language);
  const dados = [
    { name: t(language, 'accounts'), value: saldoTotalContas },
    { name: t(language, 'investments'), value: totalInvestido },
  ].filter((item) => item.value > 0);

  const total = saldoTotalContas + totalInvestido;

  return (
    <div className="glass p-8 rounded-3xl flex flex-col items-center mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-250">
      <div className="w-full mb-8 text-center">
        <h4 className="text-xl font-bold text-white">{t(language, 'compositionTitle')}</h4>
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest mt-1">
          {t(language, 'accountsVsInvestments')}
        </p>
      </div>

      <div className="relative w-full max-w-md aspect-square max-h-[260px]">
        {dados.length > 0 ? (
          <>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dados}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  dataKey="value"
                  paddingAngle={6}
                >
                  {dados.map((_, index) => (
                    <Cell key={`item-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => formatarMoeda(Number(value || 0), moeda)} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
              <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest leading-none">
                {t(language, 'chartTotal')}
              </p>
              <p className="text-sm font-bold text-white mt-1">{formatarMoeda(total, moeda)}</p>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground text-xs font-bold uppercase tracking-widest">
            {t(language, 'noData')}
          </div>
        )}
      </div>

      <div className="w-full max-w-md mt-6 space-y-3">
        {dados.map((item, idx) => (
          <div key={item.name} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: COLORS[idx % COLORS.length] }}
              />
              <span className="text-muted-foreground font-semibold">{item.name}</span>
            </div>
            <span className="text-white font-bold">
              {((item.value / (total || 1)) * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
