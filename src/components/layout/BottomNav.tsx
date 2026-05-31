import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Receipt, Plus, CreditCard, Menu } from 'lucide-react';
import { useI18nStore } from '../../store/useI18nStore';

interface BottomNavProps {
  onAdd: () => void;
  onMore: () => void;
}

/** Navegação inferior fixa para mobile (md:hidden). Substitui o hambúrguer; "Mais" abre o drawer completo. */
export const BottomNav = ({ onAdd, onMore }: BottomNavProps) => {
  const language = useI18nStore((s) => s.language);
  const tr = (pt: string, en: string) => (language === 'en-US' ? en : pt);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex flex-1 flex-col items-center justify-center gap-1 min-h-11 text-2xs font-bold transition-colors ${
      isActive ? 'text-primary' : 'text-muted-foreground hover:text-white'
    }`;

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-card/95 backdrop-blur-md border-t border-white/10 pb-safe">
      <div className="flex items-stretch justify-around h-16">
        <NavLink to="/dashboard" className={linkClass}>
          <LayoutDashboard size={20} />
          <span>{tr('Início', 'Home')}</span>
        </NavLink>
        <NavLink to="/extrato" className={linkClass}>
          <Receipt size={20} />
          <span>{tr('Extrato', 'Statement')}</span>
        </NavLink>

        <button
          type="button"
          onClick={onAdd}
          aria-label={tr('Novo lançamento', 'Add entry')}
          className="flex flex-1 items-center justify-center"
        >
          <span className="-mt-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/30 active:scale-95 transition-transform">
            <Plus size={26} strokeWidth={3} />
          </span>
        </button>

        <NavLink to="/cartoes" className={linkClass}>
          <CreditCard size={20} />
          <span>{tr('Cartões', 'Cards')}</span>
        </NavLink>
        <button type="button" onClick={onMore} className={linkClass({ isActive: false })}>
          <Menu size={20} />
          <span>{tr('Mais', 'More')}</span>
        </button>
      </div>
    </nav>
  );
};
