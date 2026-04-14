import { MainLayout } from '../components/layout/MainLayout';
import { SummaryCards } from '../components/dashboard/SummaryCards';
import { PatrimonyChart } from '../components/dashboard/PatrimonyChart';
import { CategoryDistribution } from '../components/dashboard/CategoryDistribution';
import { RecentTransactions } from '../components/dashboard/RecentTransactions';
import { InvestmentComposition } from '../components/dashboard/InvestmentComposition';
import { useDashboardData } from '../hooks/useDashboardData';
import { Link } from 'react-router-dom';
import { CircleHelp } from 'lucide-react';
import { useState } from 'react';
import { useI18nStore } from '../store/useI18nStore';
import { t } from '../lib/i18n';
import type { DashboardPeriodo } from '../lib/dashboardApi';

/**
 * Página principal do Dashboard.
 *
 * Compõe sub-componentes independentes (SRP) e delega
 * toda a lógica de dados para o hook useDashboardData.
 */
export const Dashboard = () => {
  const [periodoSelecionado, setPeriodoSelecionado] = useState<DashboardPeriodo>('1M');
  const [periodoPatrimonio, setPeriodoPatrimonio] = useState<DashboardPeriodo>('6M');
  const language = useI18nStore((state) => state.language);
  const {
    transacoesList,
    totalReceitas,
    totalGastos,
    totalReceitasPendentes,
    totalGastosPendentes,
    variacaoReceitasPercent,
    variacaoGastosPercent,
    variacaoInvestimentosPercent,
    variacaoSaldoContasPercent,
    saldoTotalContas,
    totalInvestido,
    despesasPorCategoria,
    receitasPorCategoria,
    evolucaoPatrimonio,
    isLoadingTransactions,
    moeda
  } = useDashboardData(periodoSelecionado, periodoPatrimonio);

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

  return (
    <MainLayout>
      <header className="mb-8 sm:mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">{t(language, 'dashboardTitle')}</h2>
            <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
              {t(language, 'dashboardBrief')}
            </p>

            <div className="mt-4 inline-flex flex-wrap items-center gap-1 rounded-xl bg-secondary/50 p-1 border border-white/10">
              {periodOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setPeriodoSelecionado(option.value)}
                  className={`px-3 py-1.5 text-[11px] sm:text-xs font-bold uppercase tracking-wider rounded-md transition-all ${
                    periodoSelecionado === option.value
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-white'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <Link
            to="/tutorial"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-primary/35 bg-primary/10 px-4 py-2.5 text-sm font-semibold text-primary hover:bg-primary/20 transition-colors"
          >
            <CircleHelp size={16} />
            {language === 'en-US' ? 'How to get started' : 'Como começar'}
          </Link>
        </div>
      </header>

      <SummaryCards
        totalReceitas={totalReceitas}
        totalGastos={totalGastos}
        totalReceitasPendentes={totalReceitasPendentes}
        totalGastosPendentes={totalGastosPendentes}
        variacaoReceitasPercent={variacaoReceitasPercent}
        variacaoGastosPercent={variacaoGastosPercent}
        variacaoInvestimentosPercent={variacaoInvestimentosPercent}
        variacaoSaldoContasPercent={variacaoSaldoContasPercent}
        totalInvestido={totalInvestido}
        saldoTotalContas={saldoTotalContas}
        moeda={moeda}
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
