import { MainLayout } from '../components/layout/MainLayout';
import { SummaryCards } from '../components/dashboard/SummaryCards';
import { PatrimonyChart } from '../components/dashboard/PatrimonyChart';
import { CategoryDistribution } from '../components/dashboard/CategoryDistribution';
import { RecentTransactions } from '../components/dashboard/RecentTransactions';
import { InvestmentComposition } from '../components/dashboard/InvestmentComposition';
import { useDashboardData } from '../hooks/useDashboardData';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { enUS } from 'date-fns/locale';
import { useI18nStore } from '../store/useI18nStore';
import { t } from '../lib/i18n';

/**
 * Página principal do Dashboard.
 *
 * Compõe sub-componentes independentes (SRP) e delega
 * toda a lógica de dados para o hook useDashboardData.
 */
export const Dashboard = () => {
  const language = useI18nStore((state) => state.language);
  const monthLocale = language === 'en-US' ? enUS : ptBR;
  const {
    transacoesList,
    totalReceitas,
    totalGastos,
    saldoTotalContas,
    totalInvestido,
    despesasPorCategoria,
    receitasPorCategoria,
    evolucaoPatrimonio,
    isLoadingTransactions,
    moeda
  } = useDashboardData();

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
      <header className="mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
        <h2 className="text-3xl font-bold tracking-tight text-white mb-2">{t(language, 'dashboardTitle')}</h2>
        <p className="text-muted-foreground font-medium">
          {t(language, 'dashboardSubtitle')}{' '}
          {format(new Date(), 'MMMM', { locale: monthLocale })}.
        </p>
      </header>

      <SummaryCards
        totalReceitas={totalReceitas}
        totalGastos={totalGastos}
        totalInvestido={totalInvestido}
        saldoTotalContas={saldoTotalContas}
        moeda={moeda}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
        <PatrimonyChart dados={evolucaoPatrimonio} moeda={moeda} />
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
