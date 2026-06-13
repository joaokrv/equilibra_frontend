import { useEffect, useState } from 'react';
import { X, CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react';
import { useToastStore, type ToastVariant } from '../../store/useToastStore';
import { useI18nStore } from '../../store/useI18nStore';

/**
 * Mapeamento de ícones e cores por variante do toast.
 */
const variantConfig: Record<ToastVariant, { icon: React.ElementType; bg: string; border: string; text: string }> = {
  success: {
    icon: CheckCircle2,
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    text: 'text-emerald-400',
  },
  warning: {
    icon: AlertTriangle,
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    text: 'text-amber-400',
  },
  error: {
    icon: XCircle,
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    text: 'text-red-400',
  },
  info: {
    icon: Info,
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    text: 'text-blue-400',
  },
};

/**
 * Toast individual com animação de entrada e saída.
 */
const ToastItem = ({ id, message, variant, duration = 5000 }: {
  id: string;
  message: string;
  variant: ToastVariant;
  duration?: number;
}) => {
  const removeToast = useToastStore((s) => s.removeToast);
  const language = useI18nStore((s) => s.language);
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(100);
  const config = variantConfig[variant];
  const Icon = config.icon;

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
    if (duration > 0) {
      const interval = setInterval(() => {
        setProgress((prev) => {
          const next = prev - (100 / (duration / 50));
          return next <= 0 ? 0 : next;
        });
      }, 50);
      return () => clearInterval(interval);
    }
  }, [duration]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => removeToast(id), 300);
  };

  return (
    <div
      className={`
        relative overflow-hidden rounded-xl border backdrop-blur-xl shadow-2xl
        ${config.bg} ${config.border}
        transform transition-all duration-300 ease-out
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        max-w-sm w-full
      `}
    >
      <div className="flex items-start gap-3 p-4">
        <Icon size={20} className={`${config.text} flex-shrink-0 mt-0.5`} />
        <p className="text-sm font-medium text-white/90 flex-1 leading-relaxed">{message}</p>
        <button
          onClick={handleClose}
          className="text-white/40 hover:text-white transition-colors flex-shrink-0"
          aria-label={language === 'en-US' ? 'Close notification' : 'Fechar notificacao'}
        >
          <X size={16} />
        </button>
      </div>

      {duration > 0 && (
        <div className="h-0.5 w-full bg-white/5">
          <div
            className={`h-full ${config.text.replace('text-', 'bg-')} transition-all duration-50 ease-linear`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
};

/**
 * Container global de toasts.
 * Deve ser renderizado uma única vez no nível mais alto da aplicação.
 */
export const ToastContainer = () => {
  const toasts = useToastStore((s) => s.toasts);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-3 left-3 right-3 sm:top-4 sm:right-4 sm:left-auto z-[9999] flex flex-col gap-3 pointer-events-auto">
      {toasts.map((t) => (
        <ToastItem key={t.id} {...t} />
      ))}
    </div>
  );
};
