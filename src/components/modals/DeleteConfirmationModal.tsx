import { ReactNode } from 'react';
import { Trash2 } from 'lucide-react';
import { useI18nStore } from '../../store/useI18nStore';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  title: string;
  description: ReactNode;
  confirmText?: string;
  loadingText?: string;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  /** Ação secundária opcional (ex: "excluir a compra inteira"). */
  secondaryActionText?: string;
  onSecondary?: () => void;
}

import { useModalA11y } from '../../hooks/useModalA11y';

export const DeleteConfirmationModal = ({
  isOpen,
  title,
  description,
  confirmText = 'CONFIRMAR',
  loadingText = 'PROCESSANDO...',
  isLoading = false,
  onConfirm,
  onCancel,
  secondaryActionText,
  onSecondary,
}: DeleteConfirmationModalProps) => {
  const language = useI18nStore((state) => state.language);
  const tr = (pt: string, en: string) => (language === 'en-US' ? en : pt);

  const dialogRef = useModalA11y(isOpen, onCancel);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onCancel} />
      <div ref={dialogRef} className="glass w-full max-w-sm rounded-2xl sm:rounded-3xl p-5 sm:p-8 relative z-10 animate-in zoom-in-95 duration-200">
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-400 mx-auto mb-4 sm:mb-5">
          <Trash2 size={24} />
        </div>
        <h3 className="text-lg font-bold text-white text-center">{title}</h3>
        <div className="text-sm text-muted-foreground text-center mt-2 leading-relaxed">{description}</div>
        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm font-bold text-muted-foreground hover:bg-white/5 hover:text-white transition-all disabled:opacity-50"
          >
            {tr('CANCELAR', 'CANCEL')}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-sm font-bold text-rose-400 hover:bg-rose-500/20 transition-all disabled:opacity-50"
          >
            {isLoading ? loadingText : confirmText}
          </button>
        </div>
        {secondaryActionText && onSecondary && (
          <button
            onClick={onSecondary}
            disabled={isLoading}
            className="w-full mt-3 py-2.5 rounded-xl bg-rose-600/20 border border-rose-500/40 text-sm font-bold text-rose-300 hover:bg-rose-600/30 transition-all disabled:opacity-50"
          >
            {secondaryActionText}
          </button>
        )}
      </div>
    </div>
  );
};
