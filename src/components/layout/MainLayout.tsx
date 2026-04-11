import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { MarketTicker } from '../dashboard/MarketTicker';
import { Plus, AlertTriangle, ArrowRight } from 'lucide-react';
import { TransactionModal } from '../modals/TransactionModal';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../store/useAuthStore';
import { useI18nStore } from '../../store/useI18nStore';
import { useNavigate } from 'react-router-dom';

interface MainLayoutProps {
  children: React.ReactNode;
}

/**
 * Layout principal da aplicação autenticada.
 *
 * Provê a estrutura base com Sidebar, Topbar e área de conteúdo.
 * Também gerencia o FAB (Floating Action Button) de nova transação.
 */
export const MainLayout = ({ children }: MainLayoutProps) => {
  const tr = (pt: string, en: string) => (language === 'en-US' ? en : pt);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const queryClient = useQueryClient();
  const user = useAuthStore(state => state.user);
  const language = useI18nStore((state) => state.language);
  const navigate = useNavigate();

  const isVerified = user?.isEmailVerificado ?? true;

  return (
    <div className="flex h-screen bg-background overflow-hidden relative">
      <Sidebar />
      
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <MarketTicker />
        
        {!isVerified && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 p-3 px-8 flex justify-between items-center z-10">
            <div className="flex items-center gap-3">
              <AlertTriangle size={18} className="text-amber-500" />
              <p className="text-sm font-medium text-amber-500/90">
                {tr(
                  'Sua conta ainda nao foi ativada. Verifique seu e-mail para desbloquear todas as funcionalidades.',
                  'Your account is not activated yet. Check your email to unlock all features.',
                )}
              </p>
            </div>
            <button 
              onClick={() => navigate('/perfil')}
              className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider bg-amber-500 hover:bg-amber-400 text-amber-950 px-4 py-2 rounded-lg transition-colors"
            >
              {tr('Ativar Minha Conta', 'Activate My Account')} <ArrowRight size={14} />
            </button>
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto h-full">
            {children}
          </div>
        </main>
      </div>

      {/* Botão Flutuante — Nova Transação (Apenas se verificado) */}
      {isVerified && (
        <>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="
              fixed bottom-8 right-8 bg-gradient-to-r from-primary to-primary-600 text-white px-6 py-4 rounded-2xl 
              shadow-[0_10px_40px_-10px_rgba(124,58,237,0.5)] transition-all duration-300 transform hover:scale-110 active:scale-95
              flex items-center gap-3 font-black uppercase tracking-widest text-xs z-40 animate-in fade-in slide-in-from-bottom-8 duration-1000
              hover:shadow-[0_20px_60px_-10px_rgba(124,58,237,0.6)] group
            "
          >
            <div className="bg-white/20 p-1.5 rounded-lg shadow-inner group-hover:rotate-90 transition-transform duration-300">
              <Plus size={20} strokeWidth={3} />
            </div>
            <span className="drop-shadow-md">
              {tr('Registrar Transacao', 'Add Transaction')}
            </span>
          </button>

          <TransactionModal 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ['transactions'] });
            }}
          />
        </>
      )}
    </div>
  );
};
