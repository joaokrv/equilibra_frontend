import { ReactNode } from 'react';
import { AlertTriangle, RotateCw } from 'lucide-react';

const BrotoIcon = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="currentColor" aria-hidden="true">
    <ellipse cx="14" cy="22" rx="8" ry="2.8" opacity="0.2"/>
    <ellipse cx="14" cy="19" rx="8" ry="2.8" opacity="0.35"/>
    <ellipse cx="14" cy="16" rx="8" ry="2.8" opacity="0.55"/>
    <rect x="13" y="6" width="2" height="10" rx="1" opacity="0.75"/>
    <path d="M14 11 C12 9 9.5 7 10 4.5 C12 6 13.5 8.5 14 11Z" opacity="0.65"/>
    <path d="M14 9 C16 7 19 5.5 18.5 3 C16.5 5 14.5 7 14 9Z" opacity="0.9"/>
  </svg>
);

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
}

/** Estado vazio padronizado para listas/telas sem dados. */
export const EmptyState = ({ icon, title, description }: EmptyStateProps) => (
  <div className="glass rounded-2xl p-8 sm:p-12 flex flex-col items-center justify-center gap-3 text-center">
    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary/60">
      {icon ?? <BrotoIcon />}
    </div>
    <p className="text-sm font-semibold text-foreground">{title}</p>
    {description && (
      <p className="text-2xs sm:text-sm text-muted-foreground max-w-xs leading-relaxed">{description}</p>
    )}
  </div>
);

interface ErrorStateProps {
  title: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
}

/** Estado de erro padronizado, com ação opcional de "tentar novamente". */
export const ErrorState = ({ title, description, onRetry, retryLabel = 'Tentar novamente' }: ErrorStateProps) => (
  <div className="glass rounded-2xl p-8 sm:p-12 flex flex-col items-center justify-center gap-3 text-center border border-destructive/20">
    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
      <AlertTriangle size={28} />
    </div>
    <p className="text-sm font-semibold text-foreground">{title}</p>
    {description && (
      <p className="text-2xs sm:text-sm text-muted-foreground max-w-xs leading-relaxed">{description}</p>
    )}
    {onRetry && (
      <button
        type="button"
        onClick={onRetry}
        className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2.5 text-sm font-bold text-primary transition-colors hover:bg-primary/20"
      >
        <RotateCw size={16} /> {retryLabel}
      </button>
    )}
  </div>
);
