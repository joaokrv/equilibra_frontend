import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { BottomNav } from './BottomNav';
import { MarketTicker } from '../dashboard/MarketTicker';
import { Plus, AlertTriangle, ArrowRight } from 'lucide-react';
import { TransactionModal } from '../modals/TransactionModal';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../store/useAuthStore';
import { useI18nStore } from '../../store/useI18nStore';
import { useLocation, useNavigate } from 'react-router-dom';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
  const queryClient = useQueryClient();
  const user = useAuthStore(state => state.user);
  const language = useI18nStore((state) => state.language);
  const tr = (pt: string, en: string) => (language === 'en-US' ? en : pt);
  const location = useLocation();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [modalContext, setModalContext] = useState<{
    initialSection: 'receita' | 'despesa' | 'investimento';
    allowSectionSwitch: boolean;
    tipoFixo?: 'RECEITA' | 'DESPESA';
    defaultTipo?: 'RECEITA' | 'DESPESA';
  }>({
    initialSection: 'despesa',
    allowSectionSwitch: true,
    defaultTipo: 'DESPESA',
  });

  const isVerified = user?.isEmailVerificado ?? false;
  const pathname = location.pathname;

  const getContextoDoBotao = () => {
    if (pathname.startsWith('/receitas')) {
      return {
        label: tr('Registrar receita', 'Add income'),
        initialSection: 'receita' as const,
        allowSectionSwitch: false,
        tipoFixo: 'RECEITA' as const,
        defaultTipo: 'RECEITA' as const,
      };
    }

    if (pathname.startsWith('/despesas')) {
      return {
        label: tr('Registrar despesa', 'Add expense'),
        initialSection: 'despesa' as const,
        allowSectionSwitch: false,
        tipoFixo: 'DESPESA' as const,
        defaultTipo: 'DESPESA' as const,
      };
    }

    if (pathname.startsWith('/investimentos')) {
      return {
        label: tr('Registrar investimento', 'Add investment'),
        initialSection: 'investimento' as const,
        allowSectionSwitch: false,
      };
    }

    return {
      label: tr('Registrar lançamento', 'Add entry'),
      initialSection: 'despesa' as const,
      allowSectionSwitch: true,
      defaultTipo: 'DESPESA' as const,
    };
  };

  const contextoBotao = getContextoDoBotao();

  const abrirModal = () => {
    setModalContext({
      initialSection: contextoBotao.initialSection,
      allowSectionSwitch: contextoBotao.allowSectionSwitch,
      tipoFixo: contextoBotao.tipoFixo,
      defaultTipo: contextoBotao.defaultTipo,
    });
    setIsModalOpen(true);
  };

  const invalidarAposCriacao = () => {
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
    queryClient.invalidateQueries({ queryKey: ['transacoes'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    queryClient.invalidateQueries({ queryKey: ['patrimony-evolution'] });
    queryClient.invalidateQueries({ queryKey: ['investimentos'] });
    queryClient.invalidateQueries({ queryKey: ['accounts'] });
  };

  return (
    <div className="flex h-dvh bg-background overflow-hidden relative">
      <Sidebar mobileOpen={drawerOpen} onMobileClose={() => setDrawerOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <MarketTicker />
        
        {!isVerified && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 p-3 sm:px-6 lg:px-8 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 z-10">
            <div className="flex items-start sm:items-center gap-3 min-w-0">
              <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5 sm:mt-0" />
              <p className="text-xs sm:text-sm font-medium text-amber-500/90">
                {tr(
                  'Sua conta ainda não foi ativada. Verifique seu e-mail para desbloquear todas as funcionalidades.',
                  'Your account is not activated yet. Check your email to unlock all features.',
                )}
              </p>
            </div>
            <button 
              onClick={() => navigate('/perfil')}
              className="w-full sm:w-auto flex items-center justify-center gap-2 text-2xs font-bold uppercase tracking-wider bg-amber-500 hover:bg-amber-400 text-amber-950 px-4 py-2 rounded-lg transition-colors"
            >
              {tr('Ativar Minha Conta', 'Activate My Account')} <ArrowRight size={14} />
            </button>
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-8 pb-28 custom-scrollbar">
          <div className="max-w-7xl mx-auto h-full">
            {children}
          </div>
        </main>
      </div>

      {/* Botão Flutuante — Novo Lançamento (Apenas se verificado) */}
      {isVerified && (
        <>
          <button 
            onClick={abrirModal}
            className="
              hidden md:flex fixed bottom-safe-4 right-4 sm:bottom-8 sm:right-8 bg-primary text-white p-3 sm:p-4 rounded-xl sm:rounded-2xl
              shadow-[0_10px_40px_-10px_rgba(124,58,237,0.5)] transition-all duration-300 transform hover:scale-105 active:scale-95
              items-center group z-40 animate-in fade-in slide-in-from-bottom-8 duration-1000
              hover:bg-primary/90 hover:shadow-[0_20px_60px_-10px_rgba(124,58,237,0.6)]
            "
          >
            <div className="bg-white/20 p-1.5 sm:p-2 rounded-xl shadow-inner group-hover:rotate-90 transition-transform duration-300 shrink-0">
              <Plus size={20} strokeWidth={3} />
            </div>
            <span className="font-black uppercase tracking-widest text-2xs sm:text-xs drop-shadow-md overflow-hidden whitespace-nowrap transition-all duration-500 ease-out max-w-0 opacity-0 group-hover:max-w-[200px] group-hover:opacity-100 group-hover:ml-3">
              {contextoBotao.label}
            </span>
          </button>

          <TransactionModal 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)}
            onSuccess={invalidarAposCriacao}
            defaultTipo={modalContext.defaultTipo}
            tipoFixo={modalContext.tipoFixo}
            initialSection={modalContext.initialSection}
            allowSectionSwitch={modalContext.allowSectionSwitch}
          />
        </>
      )}

      <BottomNav
        onAdd={isVerified ? abrirModal : () => navigate('/perfil')}
        onMore={() => setDrawerOpen(true)}
      />
    </div>
  );
};
