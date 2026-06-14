import { MainLayout } from '../components/layout/MainLayout';
import { SummaryCards } from '../components/dashboard/SummaryCards';
import { PatrimonyChart } from '../components/dashboard/PatrimonyChart';
import { CategoryDistribution } from '../components/dashboard/CategoryDistribution';
import { RecentTransactions } from '../components/dashboard/RecentTransactions';
import { InvestmentComposition } from '../components/dashboard/InvestmentComposition';
import { useDashboardData } from '../hooks/useDashboardData';
import { ErrorState } from '../components/ui/StateViews';
import { Link } from 'react-router-dom';
import { CircleHelp } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useI18nStore } from '../store/useI18nStore';
import { useTutorialStore } from '../store/useTutorialStore';
import { t } from '../lib/i18n';
import type { DashboardPeriodo } from '../lib/dashboardApi';

export const Dashboard = () => {
  const [periodoSelecionado, setPeriodoSelecionado] = useState<DashboardPeriodo>('1M');
  const [periodoPatrimonio, setPeriodoPatrimonio] = useState<DashboardPeriodo>('6M');
  const language = useI18nStore((state) => state.language);
  const isTutorialCompleted = useTutorialStore((state) => state.isCompleted);
  const {
    transacoesList,
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
    saldoTotalContas,
    saldoTotalContasAnterior,
    totalInvestido,
    totalInvestidoAnterior,
    despesasPorCategoria,
    receitasPorCategoria,
    evolucaoPatrimonio,
    isLoadingTransactions,
    isError,
    moeda,
    intervaloAtual,
    intervaloAnterior
  } = useDashboardData(periodoSelecionado, periodoPatrimonio);

  const queryClient = useQueryClient();

  const periodOptions: Array<{ value: DashboardPeriodo; label: string }> = [
    { value: '1M', label: t(language, 'period1M') },
    { value: '3M', label: t(language, 'period3M') },
    { value: '6M', label: t(language, 'period6M') },
    { value: '1A', label: t(language, 'period1Y') },
  ];

  if (isLoadingTransactions) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
        </div>
      </MainLayout>
    );
  }

  if (isError) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <ErrorState
            title={language === 'en-US' ? 'Could not load the dashboard' : 'Não foi possível carregar o dashboard'}
            description={language === 'en-US' ? 'Check your connection and try again.' : 'Verifique sua conexão e tente novamente.'}
            retryLabel={language === 'en-US' ? 'Try again' : 'Tentar novamente'}
            onRetry={() => {
              queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
              queryClient.invalidateQueries({ queryKey: ['transactions-period'] });
              queryClient.invalidateQueries({ queryKey: ['patrimony-evolution'] });
            }}
          />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <header className="mb-8 sm:mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-2">{t(language, 'dashboardTitle')}</h2>
            <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
              {t(language, 'dashboardBrief')}
            </p>

            <div className="mt-4 inline-flex flex-wrap items-center gap-1 rounded-xl bg-secondary/50 p-1 border border-foreground/10">
              {periodOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setPeriodoSelecionado(option.value)}
                  className={`px-3 py-1.5 text-2xs sm:text-xs font-bold uppercase tracking-wider rounded-md transition-all ${
                    periodoSelecionado === option.value
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {!isTutorialCompleted && (
            <Link
              to="/tutorial"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-primary/35 bg-primary/10 px-4 py-2.5 text-sm font-semibold text-primary hover:bg-primary/20 transition-colors"
            >
              <CircleHelp size={16} />
              {language === 'en-US' ? 'How to get started' : 'Como começar'}
            </Link>
          )}
        </div>
      </header>

      <SummaryCards
        totalReceitas={totalReceitas}
        totalReceitasAnterior={totalReceitasAnterior}
        totalGastos={totalGastos}
        totalGastosAnterior={totalGastosAnterior}
        totalReceitasPendentes={totalReceitasPendentes}
        totalGastosPendentes={totalGastosPendentes}
        variacaoReceitasPercent={variacaoReceitasPercent}
        variacaoGastosPercent={variacaoGastosPercent}
        variacaoInvestimentosPercent={variacaoInvestimentosPercent}
        variacaoSaldoContasPercent={variacaoSaldoContasPercent}
        totalInvestido={totalInvestido}
        totalInvestidoAnterior={totalInvestidoAnterior}
        saldoTotalContas={saldoTotalContas}
        saldoTotalContasAnterior={saldoTotalContasAnterior}
        moeda={moeda}
        inicioPeriodoAnterior={intervaloAnterior.inicio}
        inicioPeriodoAtual={intervaloAtual.inicio}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-8 sm:mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
        <PatrimonyChart
          dados={evolucaoPatrimonio}
          moeda={moeda}
          periodo={periodoPatrimonio}
          onPeriodoChange={setPeriodoPatrimonio}
        />
        <CategoryDistribution
          despesasPorCategoria={despesasPorCategoria}
          receitasPorCategoria={receitasPorCategoria}
          totalGastos={totalGastos}
          totalReceitas={totalReceitas}
          moeda={moeda}
        />
      </div>

      <InvestmentComposition
        saldoTotalContas={saldoTotalContas}
        totalInvestido={totalInvestido}
        moeda={moeda}
      />

      <RecentTransactions transacoesList={transacoesList} />
    </MainLayout>
  );
};
