import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { AutenticacaoService } from '../../api';
import { toast } from '../../store/useToastStore';
import { useI18nStore } from '../../store/useI18nStore';
import { getApiErrorMessage } from '../../lib/errorMessage';
import { RefreshCcw, ShieldCheck, X } from 'lucide-react';

interface ReactivationModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  initialPassword?: string;
  onSuccess: () => void;
}

import { useModalA11y } from '../../hooks/useModalA11y';

export function ReactivationModal({ isOpen, onClose, email, initialPassword = '', onSuccess }: ReactivationModalProps) {
  const language = useI18nStore((s) => s.language);
  const tr = (pt: string, en: string) => (language === 'en-US' ? en : pt);

  const [senha, setSenha] = useState('');
  const [codigo, setCodigo] = useState('');
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setSenha(initialPassword);
      setCodigo('');
    }
  }, [isOpen, initialPassword]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((p) => Math.max(0, p - 1)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const reativarMutation = useMutation({
    mutationFn: () =>
      AutenticacaoService.reativarConta({ email, senha, codigo }),
    onSuccess: () => {
      toast.success(tr('Conta reativada com sucesso! Faça login.', 'Account reactivated! Please log in.'), 5000);
      onSuccess();
    },
    onError: (error: unknown) => {
      toast.error(
        getApiErrorMessage(
          error,
          tr('Código inválido, expirado ou senha incorreta.', 'Invalid code, expired, or wrong password.')
        )
      );
    },
  });

  const dialogRef = useModalA11y(isOpen, onClose);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div ref={dialogRef} className="glass w-full max-w-md p-8 rounded-[2rem] border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/20 rounded-full blur-[80px]" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <div className="relative z-10 flex flex-col items-center text-center space-y-6">
          <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20">
            <RefreshCcw className="text-emerald-500 w-8 h-8" />
          </div>

          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-tight mb-2">
              {tr('Reativar Conta', 'Reactivate Account')}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {tr(
                'Sua conta está desativada. Um código de reativação foi enviado para seu e-mail.',
                'Your account is deactivated. A reactivation code was sent to your email.'
              )}
            </p>
            <p className="text-xs text-emerald-500/80 font-semibold mt-1">{email}</p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              reativarMutation.mutate();
            }}
            className="w-full space-y-4"
          >
            <input
              type="text"
              maxLength={6}
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="w-full bg-secondary/30 border border-white/5 rounded-2xl px-4 py-5 text-center text-3xl font-black tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all placeholder:text-muted-foreground/20"
            />
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder={tr('Sua senha', 'Your password')}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 text-white font-bold focus:outline-none focus:border-white/30 transition-all"
            />
            <button
              type="submit"
              disabled={codigo.length !== 6 || !senha || reativarMutation.isPending}
              className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-white font-black rounded-2xl transition-all uppercase tracking-widest text-xs shadow-lg shadow-emerald-500/20 disabled:opacity-50 active:scale-95 flex items-center justify-center gap-2"
            >
              <ShieldCheck size={16} />
              {reativarMutation.isPending
                ? tr('Reativando...', 'Reactivating...')
                : tr('Reativar Conta', 'Reactivate Account')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
