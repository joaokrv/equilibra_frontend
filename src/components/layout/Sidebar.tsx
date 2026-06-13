import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Wallet,
  Receipt,
  CreditCard,
  Tag,
  Target,
  Repeat,
  Menu,
  X,
  LogOut,
  UserCircle,
  ChevronDown,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useI18nStore } from '../../store/useI18nStore';
import { useTutorialStore } from '../../store/useTutorialStore';
import { useQueryClient } from '@tanstack/react-query';
import { t, TranslationKey } from '../../lib/i18n';
import logo from '../../assets/logo-equilibra.png';
import apiClient from '../../lib/axios';
import { ServerStatusBadge } from '../ui/ServerStatusBadge';

// ── tipos ──────────────────────────────────────────────────────────────────────

interface SimpleItem {
  type: 'item';
  icon: React.ElementType;
  key: TranslationKey;
  to: string;
}

interface GroupItem {
  type: 'group';
  icon: React.ElementType;
  key: TranslationKey;
  storageKey: string;
  children: { key: TranslationKey; to: string }[];
}

type MenuEntry = SimpleItem | GroupItem;

// ── configuração ───────────────────────────────────────────────────────────────

const menuEntries: MenuEntry[] = [
  { type: 'item', icon: LayoutDashboard, key: 'menuHome', to: '/dashboard' },
  { type: 'item', icon: Wallet, key: 'menuAccounts', to: '/contas' },
  {
    type: 'group',
    icon: Receipt,
    key: 'menuStatement',
    storageKey: 'sidebar-group-extrato',
    children: [
      { key: 'menuStatementGeneral', to: '/extrato' },
      { key: 'menuIncome', to: '/receitas' },
      { key: 'menuExpenses', to: '/despesas' },
      { key: 'menuInvestmentsHistory', to: '/investimentos/extrato' },
    ],
  },
  {
    type: 'group',
    icon: CreditCard,
    key: 'menuCards',
    storageKey: 'sidebar-group-cartoes',
    children: [
      { key: 'menuMyCards', to: '/cartoes' },
      { key: 'menuInvoices', to: '/faturas' },
    ],
  },
  { type: 'item', icon: Repeat, key: 'menuFixed', to: '/recorrentes' },
  { type: 'item', icon: Tag, key: 'menuCategories', to: '/categorias' },
  { type: 'item', icon: Target, key: 'menuInvestments', to: '/investimentos' },
  { type: 'item', icon: LayoutDashboard, key: 'menuTutorial', to: '/tutorial' },
  { type: 'item', icon: UserCircle, key: 'menuProfile', to: '/perfil' },
] as const;

// ── subcomponentes ─────────────────────────────────────────────────────────────

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
    end
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

interface SidebarGroupProps {
  entry: GroupItem;
  language: string;
  sidebarOpen: boolean;
  onExpandSidebar: () => void;
  onItemClick?: () => void;
}

const SidebarGroup = ({ entry, language, sidebarOpen, onExpandSidebar, onItemClick }: SidebarGroupProps) => {
  const location = useLocation();
  const hasActiveChild = entry.children.some((c) => location.pathname === c.to);

  const [open, setOpen] = useState(() => {
    const saved = localStorage.getItem(entry.storageKey);
    // abrir automaticamente se a rota ativa pertence ao grupo
    if (hasActiveChild) return true;
    return saved !== null ? saved === 'true' : false;
  });

  const toggle = () => {
    if (!sidebarOpen) {
      // sidebar recolhida: expandir sidebar e abrir o grupo
      onExpandSidebar();
      if (!open) {
        setOpen(true);
        localStorage.setItem(entry.storageKey, 'true');
      }
      return;
    }
    setOpen((prev) => {
      localStorage.setItem(entry.storageKey, String(!prev));
      return !prev;
    });
  };

  const Icon = entry.icon;
  const label = t(language as Parameters<typeof t>[0], entry.key);

  return (
    <div>
      <button
        onClick={toggle}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggle(); }}
        aria-expanded={open}
        className={`
          w-full flex items-center p-3 rounded-lg cursor-pointer transition-all duration-200
          ${hasActiveChild ? 'text-primary' : 'text-muted-foreground hover:bg-white/5 hover:text-white'}
          ${sidebarOpen ? 'justify-start gap-4 px-4' : 'justify-center'}
        `}
      >
        <Icon size={20} strokeWidth={2} className="shrink-0" />
        {sidebarOpen && (
          <>
            <span className="font-semibold text-sm whitespace-nowrap overflow-hidden flex-1 text-left">
              {label}
            </span>
            <ChevronDown
              size={14}
              className={`shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
            />
          </>
        )}
      </button>

      {sidebarOpen && open && (
        <div className="ml-4 mt-1 space-y-1 border-l border-white/5 pl-3">
          {entry.children.map((child) => (
            <NavLink
              key={child.to}
              to={child.to}
              onClick={onItemClick}
              className={({ isActive }) => `
                flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200 min-h-11
                ${isActive ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground hover:bg-white/5 hover:text-white'}
              `}
            >
              {t(language as Parameters<typeof t>[0], child.key)}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
};

// ── componente principal ───────────────────────────────────────────────────────

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export const Sidebar = ({ mobileOpen, onMobileClose }: SidebarProps) => {
  const language = useI18nStore((state) => state.language);
  const isTutorialCompleted = useTutorialStore((state) => state.isCompleted);
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

  const expandSidebar = () => {
    setIsOpen(true);
    localStorage.setItem('sidebar-open', 'true');
  };

  const logout = useAuthStore(state => state.logout);
  const queryClient = useQueryClient();

  const visibleEntries = isTutorialCompleted
    ? menuEntries.filter((e) => e.key !== 'menuTutorial')
    : menuEntries;

  const handleLogout = () => {
    queryClient.clear();
    logout();
    apiClient.post('/api/auth/logout').catch(() => {
    });
  };

  const closeMobileSidebar = onMobileClose;

  const renderEntry = (entry: MenuEntry, opts: { sidebarOpen: boolean; onItemClick?: () => void }) => {
    if (entry.type === 'item') {
      return (
        <SidebarItem
          key={entry.to}
          icon={entry.icon}
          label={t(language, entry.key)}
          to={entry.to}
          isOpen={opts.sidebarOpen}
          onClick={opts.onItemClick}
        />
      );
    }
    return (
      <SidebarGroup
        key={entry.storageKey}
        entry={entry}
        language={language}
        sidebarOpen={opts.sidebarOpen}
        onExpandSidebar={expandSidebar}
        onItemClick={opts.onItemClick}
      />
    );
  };

  return (
    <>
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
            className="p-2 hover:bg-white/5 rounded-lg text-muted-foreground hover:text-white transition-colors inline-flex items-center justify-center min-h-11 min-w-11"
            aria-label={isOpen ? t(language, 'collapseMenu') : t(language, 'expandMenu')}
          >
            <Menu size={20} />
          </button>
        </div>

        <nav className="flex-1 min-h-0 px-3 pb-2 space-y-2 overflow-y-auto">
          {visibleEntries.map((entry) => renderEntry(entry, { sidebarOpen: isOpen }))}
        </nav>

        <div className="shrink-0 border-t border-white/5 px-3 py-3 space-y-1">
          <div className={`flex items-center min-h-11 px-4 ${isOpen ? 'justify-start' : 'justify-center'}`}>
            <ServerStatusBadge showLabel={isOpen} align="left" />
          </div>
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

      <div className={`md:hidden fixed inset-0 z-[90] ${mobileOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
        <button
          onClick={closeMobileSidebar}
          className={`absolute inset-0 bg-black/60 backdrop-blur-[1px] transition-opacity ${mobileOpen ? 'opacity-100' : 'opacity-0'}`}
          aria-label={t(language, 'collapseMenu')}
        />

        <aside className={`
          absolute left-0 top-0 h-dvh w-[82%] max-w-[320px] bg-card border-r border-white/10 flex flex-col pt-5 pb-safe
          transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="flex items-center justify-between px-4 mb-6">
            <NavLink to="/dashboard" className="flex items-center gap-2" onClick={closeMobileSidebar}>
              <img src={logo} alt="Equilibra" className="w-10 h-10 drop-shadow-[0_0_8px_rgba(124,58,237,0.4)]" />
              <span className="text-xl font-bold tracking-tight text-gradient">Equilibra</span>
            </NavLink>
            <button
              onClick={closeMobileSidebar}
              className="p-2 hover:bg-white/5 rounded-lg text-muted-foreground hover:text-white transition-colors inline-flex items-center justify-center min-h-11 min-w-11"
              aria-label={t(language, 'collapseMenu')}
            >
              <X size={18} />
            </button>
          </div>

          <nav className="flex-1 min-h-0 px-3 pb-2 space-y-2 overflow-y-auto">
            {visibleEntries.map((entry) => renderEntry(entry, { sidebarOpen: true, onItemClick: closeMobileSidebar }))}
          </nav>

          <div className="shrink-0 border-t border-white/5 px-3 py-3 space-y-1">
            <div className="flex items-center min-h-11 px-4">
              <ServerStatusBadge showLabel={true} align="left" />
            </div>
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
