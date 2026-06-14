import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { formatarMoeda } from '../../lib/formatters';
import { useI18nStore } from '../../store/useI18nStore';
import { t } from '../../lib/i18n';
import type { DashboardPeriodo } from '../../lib/dashboardApi';

interface PatrimonyPoint {
  dataReferencia: string;
  valorTotal: number;
}

interface PatrimonyChartProps {
  dados: PatrimonyPoint[];
  moeda: 'BRL' | 'USD' | 'EUR';
  periodo: DashboardPeriodo;
  onPeriodoChange: (periodo: DashboardPeriodo) => void;
}

const ChartTooltip = ({
  active,
  payload,
  label,
  moeda,
  language,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
  moeda: 'BRL' | 'USD' | 'EUR';
  language: 'pt-BR' | 'en-US';
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-primary/20 rounded-xl px-3 py-2 text-xs shadow-lg">
      <p className="text-muted-foreground mb-1">
        {t(language, 'chartDate')}: {label}
      </p>
      <p className="font-semibold text-foreground tabular-nums">
        {formatarMoeda(payload[0].value, moeda)}
      </p>
    </div>
  );
};

export const PatrimonyChart = ({ dados, moeda, periodo, onPeriodoChange }: PatrimonyChartProps) => {
  const language = useI18nStore((state) => state.language);
  const periodOptions: Array<{ value: DashboardPeriodo; label: string }> = [
    { value: '1M', label: t(language, 'period1M') },
    { value: '3M', label: t(language, 'period3M') },
    { value: '6M', label: t(language, 'period6M') },
    { value: '1A', label: t(language, 'period1Y') },
  ];

  const periodLabel = periodOptions.find((item) => item.value === periodo)?.label || periodo;

  const dadosGrafico = useMemo(() => {
    const porData = new Map<string, PatrimonyPoint>();

    dados
      .filter((item) => Boolean(item.dataReferencia))
      .forEach((item) => {
        const chaveData = item.dataReferencia.slice(0, 10);
        porData.set(chaveData, {
          ...item,
          dataReferencia: chaveData,
          valorTotal: Number(item.valorTotal || 0),
        });
      });

    return Array.from(porData.values())
      .sort((a, b) => a.dataReferencia.localeCompare(b.dataReferencia))
      .map((item) => ({
        ...item,
        label: `${item.dataReferencia.slice(8, 10)}/${item.dataReferencia.slice(5, 7)}`,
      }));
  }, [dados]);

  const yDomain = useMemo<[number, number]>(() => {
    const valores = dadosGrafico
      .map((item) => Number(item.valorTotal || 0))
      .filter((value) => Number.isFinite(value));

    if (valores.length === 0) {
      return [0, 100];
    }

    const min = Math.min(...valores);
    const max = Math.max(...valores);

    if (min === max) {
      const margem = Math.max(Math.abs(max) * 0.08, 1);
      const dominioMin = min >= 0 ? Math.max(0, min - margem) : min - margem;
      const dominioMax = max + margem;
      return [dominioMin, dominioMax];
    }

    const faixa = max - min;
    const margem = Math.max(faixa * 0.15, Math.abs(max) * 0.02, 1);
    const dominioMin = min >= 0 ? Math.max(0, min - margem) : min - margem;
    const dominioMax = max + margem;

    return [dominioMin, dominioMax];
  }, [dadosGrafico]);

  const possuiDados = dadosGrafico.length > 0;
  const possuiApenasUmSnapshot = dadosGrafico.length === 1;

  return (
  <div className="lg:col-span-2 glass p-4 sm:p-6 lg:p-8 rounded-2xl sm:rounded-3xl min-h-[290px] sm:min-h-[380px] lg:min-h-[420px] flex flex-col">
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-3 mb-4 sm:mb-8">
      <div>
        <h4 className="text-lg font-bold text-foreground">{t(language, 'patrimonyEvolution')}</h4>
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest mt-1 sm:mt-1.5">
          {periodLabel || t(language, 'lastSixMonths')}
        </p>
      </div>
      <div className="grid grid-cols-4 sm:inline-flex sm:items-center gap-1 rounded-xl bg-secondary/50 p-1 border border-foreground/10 w-full sm:w-auto">
        {periodOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onPeriodoChange(option.value)}
            className={`w-full px-2.5 sm:px-3 py-1.5 text-2xs sm:text-xs font-bold uppercase tracking-wider rounded-md transition-all ${
              periodo === option.value
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>

    {possuiDados ? (
      <div className="flex-1 min-h-[185px] sm:min-h-[280px] lg:min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={dadosGrafico} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
            <XAxis
              dataKey="label"
              tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
              axisLine={{ stroke: 'var(--chart-axis)' }}
              tickLine={{ stroke: 'var(--chart-axis)' }}
              minTickGap={24}
              interval="preserveStartEnd"
              tickMargin={8}
              padding={{ left: 8, right: 8 }}
            />
            <YAxis
              tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
              axisLine={{ stroke: 'var(--chart-axis)' }}
              tickLine={{ stroke: 'var(--chart-axis)' }}
              domain={yDomain}
              tickCount={5}
              tickFormatter={(value: number | string) =>
                formatarMoeda(Number(value || 0), moeda)
              }
              width={72}
            />
            <Tooltip
              allowEscapeViewBox={{ x: false, y: false }}
              wrapperStyle={{ zIndex: 20 }}
              content={<ChartTooltip moeda={moeda} language={language} />}
            />
            <Line
              type="monotone"
              dataKey="valorTotal"
              name={t(language, 'chartTotalValue')}
              stroke="#7c14ff"
              strokeWidth={3}
              dot={{ r: possuiApenasUmSnapshot ? 5 : 2.5 }}
              activeDot={{ r: 5 }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
        {possuiApenasUmSnapshot && (
          <p className="mt-2 text-center text-xs text-muted-foreground font-medium">
            {language === 'en-US'
              ? 'Only one daily snapshot is available in this range for now. New days will complete the trend line.'
              : 'Há apenas um snapshot diário neste período por enquanto. Novos dias completarão a linha de tendência.'}
          </p>
        )}
      </div>
    ) : (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
        <p className="text-sm text-muted-foreground font-medium max-w-xs leading-relaxed">
          {language === 'en-US'
            ? 'As soon as the first daily snapshot is generated, the evolution will appear here.'
            : 'Assim que o primeiro snapshot diário for gerado, a evolução aparecerá aqui.'}
        </p>
      </div>
    )}
  </div>
  );
};
