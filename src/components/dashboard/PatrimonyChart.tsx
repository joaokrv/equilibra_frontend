import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { enUS } from 'date-fns/locale';
import { formatarMoeda } from '../../lib/formatters';
import { useI18nStore } from '../../store/useI18nStore';
import { t } from '../../lib/i18n';

interface PatrimonyPoint {
  dataReferencia: string;
  valorTotal: number;
}

interface PatrimonyChartProps {
  dados: PatrimonyPoint[];
  moeda: 'BRL' | 'USD' | 'EUR';
}

/**
 * Gráfico de evolução patrimonial baseado em snapshots diários.
 */
export const PatrimonyChart = ({ dados, moeda }: PatrimonyChartProps) => {
  const language = useI18nStore((state) => state.language);
  const chartLocale = language === 'en-US' ? enUS : ptBR;

  const dadosGrafico = useMemo(
    () =>
      dados.map((item) => ({
        ...item,
        label: format(new Date(item.dataReferencia), 'dd/MM', { locale: chartLocale }),
      })),
    [dados, chartLocale],
  );

  return (
  <div className="lg:col-span-2 glass p-4 sm:p-6 lg:p-8 rounded-2xl sm:rounded-3xl min-h-[340px] sm:min-h-[450px] flex flex-col">
    <div className="flex items-center justify-between mb-5 sm:mb-8">
      <div>
        <h4 className="text-lg font-bold text-white">{t(language, 'patrimonyEvolution')}</h4>
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest mt-1">
          {t(language, 'lastSixMonths')}
        </p>
      </div>
    </div>

    {dadosGrafico.length > 1 ? (
      <div className="flex-1 min-h-[240px] sm:min-h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={dadosGrafico} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <XAxis
              dataKey="label"
              tick={{ fill: '#9ca3af', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#9ca3af', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value: number | string) =>
                formatarMoeda(Number(value || 0), moeda)
              }
              width={90}
            />
            <Tooltip
              formatter={(value: any) => formatarMoeda(Number(value || 0), moeda)}
              labelFormatter={(label) => `${t(language, 'chartDate')}: ${label}`}
            />
            <Line
              type="monotone"
              dataKey="valorTotal"
              stroke="#7c3aed"
              strokeWidth={3}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    ) : (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
        <p className="text-sm text-muted-foreground font-medium max-w-xs leading-relaxed">
          {language === 'en-US'
            ? 'As soon as there is more than one daily snapshot, the evolution will appear here.'
            : 'Assim que houver mais de um snapshot diário, a evolução aparecerá aqui.'}
        </p>
      </div>
    )}
  </div>
  );
};
