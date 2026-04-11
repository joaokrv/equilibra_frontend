import { MainLayout } from '../../components/layout/MainLayout';
import { AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * Página 404 — Rota não encontrada.
 */
export const NotFoundPage = () => (
  <MainLayout>
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 animate-in fade-in duration-500">
      <div className="w-20 h-20 rounded-3xl bg-destructive/10 flex items-center justify-center text-destructive">
        <AlertTriangle size={40} />
      </div>
      <h2 className="text-2xl font-bold text-white">Página não encontrada</h2>
      <p className="text-muted-foreground text-sm font-medium text-center max-w-md">
        A página que você procura não existe ou foi movida.
      </p>
      <Link
        to="/dashboard"
        className="text-xs font-bold text-primary uppercase tracking-widest bg-primary/5 px-6 py-3 rounded-full border border-primary/10 hover:bg-primary/10 transition-colors"
      >
        Voltar ao Dashboard
      </Link>
    </div>
  </MainLayout>
);
