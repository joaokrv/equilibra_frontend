import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Receipt, 
  CreditCard, 
  Tag,
  Target,
  Repeat,
  Menu,
  LogOut,
  UserCircle
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useI18nStore } from '../../store/useI18nStore';
import { t } from '../../lib/i18n';
import logo from '../../assets/logo-equilibra.png';

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  to: string;
  isOpen: boolean;
}

/**
 * Item individual da Sidebar com navegação real via NavLink.
 * O estado `active` é controlado automaticamente pelo react-router.
 */
const SidebarItem = ({ icon: Icon, label, to, isOpen }: SidebarItemProps) => (
  <NavLink
    to={to}
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
  { icon: Repeat, key: 'menuFixed', to: '/recorrentes' },
  { icon: Tag, key: 'menuCategories', to: '/categorias' },
  { icon: Target, key: 'menuInvestments', to: '/investimentos' },
  { icon: UserCircle, key: 'menuProfile', to: '/perfil' },
] as const;

/**
 * Barra lateral com navegação principal da aplicação.
 *
 * Usa NavLink do react-router para navegação real e
 * estado ativo automático baseado na rota atual.
 */
export const Sidebar = () => {
  const language = useI18nStore((state) => state.language);
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

  return (
    <aside className={`
      h-screen bg-card border-r border-white/5 transition-all duration-300 flex flex-col pt-6
      ${isOpen ? 'w-64' : 'w-20'}
    `}>
      {/* Cabeçalho com Logo e Toggle */}
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

      {/* Menu Principal */}
      <nav className="flex-1 px-3 space-y-2">
        {menuItems.map((item) => (
          <SidebarItem 
            key={item.to}
            icon={item.icon}
            label={t(language, item.key)}
            to={item.to}
            isOpen={isOpen}
          />
        ))}
      </nav>

      {/* Rodapé — Logout */}
      <div className="p-3 border-t border-white/5">
        <div 
          onClick={logout}
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
  );
};
