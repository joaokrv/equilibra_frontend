import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Wallet,
  TrendingUp,
  TrendingDown,
  Receipt,
  CreditCard,
  FileText,
  Tag,
  Target,
  Repeat,
  Menu,
  X,
  LogOut,
  UserCircle
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useI18nStore } from '../../store/useI18nStore';
import { useTutorialStore } from '../../store/useTutorialStore';
import { useQueryClient } from '@tanstack/react-query';
import { t } from '../../lib/i18n';
import logo from '../../assets/logo-equilibra.png';
import apiClient from '../../lib/axios';

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  to: string;
  isOpen: boolean;
  onClick?: () => void;
}

const SidebarItem = ({ icon: Icon, label, to, isOpen, onClick }: SidebarItemProps) => (
  <NavLink
    to={to}
    onClick={onClick}
    className={({ isActive }) => `
      flex items-center p-3 rounded-lg cursor-pointer transition-all duration-200
      ${isActive ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-muted-foreground hover:bg-white/5 hover:text-white'}
      ${isOpen ? 'justify-start gap-4 px-4' : 'justify-center'}
    `}
  >
    <Icon size={20} strokeWidth={2} />
    {isOpen && (
      <span className="font-semibold text-sm whitespace-nowrap overflow-hidden transition-all duration-300 opacity-100">
        {label}
      </span>
    )}
  </NavLink>
);

const menuItems = [
  { icon: LayoutDashboard, key: 'menuHome', to: '/dashboard' },
  { icon: Wallet, key: 'menuAccounts', to: '/contas' },
  { icon: TrendingUp, key: 'menuIncome', to: '/receitas' },
  { icon: TrendingDown, key: 'menuExpenses', to: '/despesas' },
  { icon: Receipt, key: 'menuStatement', to: '/extrato' },
  { icon: CreditCard, key: 'menuCards', to: '/cartoes' },
  { icon: FileText, key: 'menuInvoices', to: '/faturas' },
  { icon: Repeat, key: 'menuFixed', to: '/recorrentes' },
  { icon: Tag, key: 'menuCategories', to: '/categorias' },
  { icon: Target, key: 'menuInvestments', to: '/investimentos' },
  { icon: LayoutDashboard, key: 'menuTutorial', to: '/tutorial' },
  { icon: UserCircle, key: 'menuProfile', to: '/perfil' },
] as const;

export const Sidebar = () => {
  const language = useI18nStore((state) => state.language);
  const isTutorialCompleted = useTutorialStore((state) => state.isCompleted);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(() => {
    const saved = localStorage.getItem('sidebar-open');
    return saved !== null ? saved === 'true' : true;
  });

  const toggleSidebar = () => {
    setIsOpen((prev) => {
      localStorage.setItem('sidebar-open', String(!prev));
      return !prev;
    });
  };
  const logout = useAuthStore(state => state.logout);
  const queryClient = useQueryClient();
  const visibleMenuItems = isTutorialCompleted
    ? menuItems.filter((item) => item.key !== 'menuTutorial')
    : menuItems;

  const handleLogout = () => {
    // UI responde imediato — logout local primeiro (P1-6)
    queryClient.clear();
    logout();
    // Backend fire-and-forget: invalida sessão + limpa cookie HttpOnly (G5-A1)
    apiClient.post('/api/auth/logout').catch(() => {
      // Silencioso — sessão local já encerrada
    });
  };

  const closeMobileSidebar = () => setIsMobileOpen(false);

  return (
    <>
      <button
        onClick={() => setIsMobileOpen(true)}
        className="md:hidden fixed left-3 top-3 z-[85] p-2 rounded-lg bg-card/90 border border-white/10 text-muted-foreground"
        aria-label={t(language, 'expandMenu')}
      >
        <Menu size={18} />
      </button>

      <aside className={`
        hidden md:flex h-screen bg-card border-r border-white/5 transition-all duration-300 flex-col pt-6
        ${isOpen ? 'w-64' : 'w-20'}
      `}>
        <div className={`flex items-center px-4 mb-10 ${isOpen ? 'justify-between' : 'justify-center'}`}>
          {isOpen && (
            <NavLink to="/dashboard" className="flex items-center gap-2">
              <img src={logo} alt="Equilibra" className="w-12 h-12 drop-shadow-[0_0_8px_rgba(124,58,237,0.4)]" />
              <span className="text-2xl font-bold tracking-tight text-gradient">Equilibra</span>
            </NavLink>
          )}
          <button
            onClick={toggleSidebar}
            className="p-2 hover:bg-white/5 rounded-lg text-muted-foreground hover:text-white transition-colors"
            aria-label={isOpen ? t(language, 'collapseMenu') : t(language, 'expandMenu')}
          >
            <Menu size={20} />
          </button>
        </div>

        <nav className="flex-1 px-3 space-y-2">
          {visibleMenuItems.map((item) => (
            <SidebarItem
              key={item.to}
              icon={item.icon}
              label={t(language, item.key)}
              to={item.to}
              isOpen={isOpen}
            />
          ))}
        </nav>

        <div className="p-3 border-t border-white/5">
          <div
            onClick={handleLogout}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleLogout(); }}
            className={`
              flex items-center p-3 rounded-lg cursor-pointer text-destructive/80 hover:bg-destructive/10 hover:text-destructive transition-all
              ${isOpen ? 'justify-start gap-4 px-4' : 'justify-center'}
            `}
            role="button"
            tabIndex={0}
          >
            <LogOut size={20} />
            {isOpen && <span className="font-semibold text-sm">{t(language, 'signOut')}</span>}
          </div>
        </div>
      </aside>

      <div className={`md:hidden fixed inset-0 z-[90] ${isMobileOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
        <button
          onClick={closeMobileSidebar}
          className={`absolute inset-0 bg-black/60 backdrop-blur-[1px] transition-opacity ${isMobileOpen ? 'opacity-100' : 'opacity-0'}`}
          aria-label={t(language, 'collapseMenu')}
        />

        <aside className={`
          absolute left-0 top-0 h-dvh w-[82%] max-w-[320px] bg-card border-r border-white/10 flex flex-col pt-5
          transition-transform duration-300 ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="flex items-center justify-between px-4 mb-6">
            <NavLink to="/dashboard" className="flex items-center gap-2" onClick={closeMobileSidebar}>
              <img src={logo} alt="Equilibra" className="w-10 h-10 drop-shadow-[0_0_8px_rgba(124,58,237,0.4)]" />
              <span className="text-xl font-bold tracking-tight text-gradient">Equilibra</span>
            </NavLink>
            <button
              onClick={closeMobileSidebar}
              className="p-2 hover:bg-white/5 rounded-lg text-muted-foreground hover:text-white transition-colors"
              aria-label={t(language, 'collapseMenu')}
            >
              <X size={18} />
            </button>
          </div>

          <nav className="flex-1 px-3 space-y-2 overflow-y-auto">
            {visibleMenuItems.map((item) => (
              <SidebarItem
                key={item.to}
                icon={item.icon}
                label={t(language, item.key)}
                to={item.to}
                isOpen={true}
                onClick={closeMobileSidebar}
              />
            ))}
          </nav>

          <div className="p-3 border-t border-white/5">
            <div
              onClick={() => {
                closeMobileSidebar();
                handleLogout();
              }}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { closeMobileSidebar(); handleLogout(); } }}
              className="flex items-center gap-4 px-4 p-3 rounded-lg cursor-pointer text-destructive/80 hover:bg-destructive/10 hover:text-destructive transition-all"
              role="button"
              tabIndex={0}
            >
              <LogOut size={20} />
              <span className="font-semibold text-sm">{t(language, 'signOut')}</span>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
};
