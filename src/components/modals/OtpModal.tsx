import React, { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ApiError, AutenticacaoService } from '../../api';
import type { OtpStatusResponseDTO } from '../../api';
import { toast } from '../../store/useToastStore';
import { useI18nStore } from '../../store/useI18nStore';
import { getApiErrorMessage } from '../../lib/errorMessage';
import { ShieldCheck, RefreshCcw, Timer, AlertCircle, X } from 'lucide-react';

interface OtpModalProps {
  isOpen: boolean;
  onClose: () => void;
  registroId: string;
  email: string;
  onSuccess?: () => void;
}

const isOtpStatusResponse = (value: unknown): value is OtpStatusResponseDTO => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<OtpStatusResponseDTO>;
  return typeof candidate.status === 'string'
    && typeof candidate.tentativasRestantes === 'number'
    && typeof candidate.expiraEm === 'string'
    && typeof candidate.registroId === 'string';
};

const extrairOtpStatus = (value: unknown): OtpStatusResponseDTO | null => {
  if (isOtpStatusResponse(value)) {
    return value;
  }

  if (value instanceof ApiError) {
    return isOtpStatusResponse(value.body) ? value.body : null;
  }

  if (!value || typeof value !== 'object') {
    return null;
  }

  const candidate = value as { body?: unknown; data?: unknown; response?: { data?: unknown } };

  if (isOtpStatusResponse(candidate.body)) {
    return candidate.body;
  }

  if (isOtpStatusResponse(candidate.data)) {
    return candidate.data;
  }

  if (candidate.response && isOtpStatusResponse(candidate.response.data)) {
    return candidate.response.data;
  }

  return null;
};

import { useModalA11y } from '../../hooks/useModalA11y';

export function OtpModal({ isOpen, onClose, registroId, email, onSuccess }: OtpModalProps) {
  const language = useI18nStore((s) => s.language);
  const tr = (pt: string, en: string) => (language === 'en-US' ? en : pt);

  const [codigo, setCodigo] = useState('');
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [lockoutTimeLeft, setLockoutTimeLeft] = useState<number>(0);
  const [canResend, setCanResend] = useState(false);
  const [otpStatus, setOtpStatus] = useState<OtpStatusResponseDTO | undefined>(undefined);
  const { data: queryStatus, refetch } = useQuery({
    queryKey: ['otp-status', registroId],
    queryFn: () => AutenticacaoService.getOtpStatus(registroId),
    enabled: isOpen && !!registroId,
    refetchOnWindowFocus: false,
  });

  const sincronizarStatus = (valor: unknown): boolean => {
    const statusExtraido = extrairOtpStatus(valor);

    if (!statusExtraido) {
      return false;
    }

    setOtpStatus(statusExtraido);
    return true;
  };
  const verifyMutation = useMutation({
    mutationFn: (code: string) => AutenticacaoService.verificarEmail({
      email,
      codigo: code,
      registroId
    }),
    onSuccess: () => {
      toast.success(tr('E-mail verificado com sucesso!', 'Email verified successfully!'));
      if (onSuccess) onSuccess();
    },
    onError: (error: any) => {
      if (!sincronizarStatus(error)) {
        void refetch();
      }
      toast.error(getApiErrorMessage(error, tr('Código inválido ou expirado.', 'Invalid or expired code.')));
    }
  });
  const resendMutation = useMutation({
    mutationFn: () => AutenticacaoService.reenviarCodigo({
      email,
      registroId
    }),
    onSuccess: (response) => {
      if (!sincronizarStatus(response)) {
        void refetch();
      }
      toast.info(tr('Um novo código foi enviado para seu e-mail.', 'A new code has been sent to your email.'));
    },
    onError: (error) => {
      if (!sincronizarStatus(error)) {
        void refetch();
      }
      toast.error(getApiErrorMessage(error, tr('Não foi possível reenviar o código agora.', 'Could not resend the code now.')));
    }
  });
  useEffect(() => {
    if (!isOpen) {
      setCodigo('');
      setOtpStatus(undefined);
      setTimeLeft(0);
      setLockoutTimeLeft(0);
      setCanResend(false);
      return;
    }

    setCodigo('');
    setOtpStatus(undefined);
  }, [isOpen, registroId]);

  useEffect(() => {
    if (queryStatus) {
      setOtpStatus(queryStatus);
    }
  }, [queryStatus]);
  useEffect(() => {
    if (!otpStatus) return;

    const updateTimers = () => {
      const agora = new Date().getTime();
      if (otpStatus.expiraEm) {
        const expira = new Date(otpStatus.expiraEm).getTime();
        const diff = Math.max(0, Math.floor((expira - agora) / 1000));
        setTimeLeft(diff);
      }
      if (otpStatus.bloqueadoAte) {
        const bloqueio = new Date(otpStatus.bloqueadoAte).getTime();
        const diffLock = Math.max(0, Math.floor((bloqueio - agora) / 1000));
        setLockoutTimeLeft(diffLock);
      } else {
        setLockoutTimeLeft(0);
      }
      if (otpStatus.proximoReenvioEm) {
        const reenvio = new Date(otpStatus.proximoReenvioEm).getTime();
        setCanResend(agora >= reenvio);
      } else {
        setCanResend(true);
      }
    };

    updateTimers();
    const interval = setInterval(updateTimers, 1000);
    return () => clearInterval(interval);
  }, [otpStatus]);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (codigo.length === 6) {
      verifyMutation.mutate(codigo);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const dialogRef = useModalA11y(isOpen, onClose);

  if (!isOpen) return null;

  const isLocked = otpStatus?.status === 'BLOQUEADO';
  const isExpired = otpStatus?.status === 'EXPIRADO' || (timeLeft === 0 && otpStatus?.status === 'ATIVO');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div ref={dialogRef} className="glass w-full max-w-md p-8 rounded-[2rem] border border-white/10 shadow-2xl relative overflow-hidden">
        {/* Glow Decorativo */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 rounded-full blur-[80px]" />
        
        <div className="flex flex-col items-center text-center relative z-10">
          <div className={`w-16 h-16 ${isLocked ? 'bg-destructive/10' : isExpired ? 'bg-amber-500/10' : 'bg-primary/10'} rounded-2xl flex items-center justify-center mb-6 border ${isLocked ? 'border-destructive/20' : isExpired ? 'border-amber-500/20' : 'border-primary/20'}`}>
            {isLocked ? (
              <AlertCircle className="text-destructive w-8 h-8" />
            ) : isExpired ? (
              <Timer className="text-amber-500 w-8 h-8" />
            ) : (
              <ShieldCheck className="text-primary w-8 h-8" />
            )}
          </div>

          <h2 className="text-2xl font-bold text-gradient mb-2 tracking-tight">
            {isLocked 
              ? tr('Acesso Bloqueado', 'Access Blocked') 
              : isExpired 
                ? tr('Código Expirado', 'Code Expired')
                : tr('Verifique seu E-mail', 'Verify your Email')
            }
          </h2>
          <p className="text-muted-foreground text-sm mb-8 leading-relaxed">
            {isLocked 
              ? tr('Muitas tentativas detectadas. Sua conta está temporariamente bloqueada para sua segurança.', 'Too many attempts detected. Your account is temporarily locked for your security.')
              : isExpired
                ? tr('O tempo para verificação deste código acabou. Solicite um novo código para continuar.', 'The time to verify this code has run out. Please request a new code to continue.')
                : tr('Enviamos um código de 6 dígitos para', 'We sent a 6-digit code to')
            }
            {!isLocked && !isExpired && (
              <>
                <br />
                <span className="text-foreground font-semibold">{email}</span>
              </>
            )}
          </p>

          <form onSubmit={handleVerify} className="w-full space-y-6">
            <div className="space-y-4">
              {isLocked ? (
                <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-6 flex flex-col items-center gap-3 animate-in zoom-in-95 duration-300">
                  <Timer size={32} className="text-destructive animate-pulse" />
                  <div className="text-center">
                    <p className="text-2xs font-bold text-destructive uppercase tracking-widest mb-1">
                      {tr('Tente novamente em:', 'Try again in:') }
                    </p>
                    <p className="text-3xl font-black text-destructive tabular-nums">
                      {formatTime(lockoutTimeLeft)}
                    </p>
                  </div>
                </div>
              ) : isExpired ? (
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-6 flex flex-col items-center gap-3 animate-in zoom-in-95 duration-300">
                  <AlertCircle size={32} className="text-amber-500" />
                  <div className="text-center">
                    <p className="text-2xs font-bold text-amber-500 uppercase tracking-widest">
                      {tr('Tempo esgotado', 'Time is up') }
                    </p>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <input
                    type="text"
                    maxLength={6}
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    disabled={verifyMutation.isPending}
                    className="w-full bg-secondary/30 border border-white/5 rounded-2xl px-4 py-5 text-center text-3xl font-black tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-secondary/60 transition-all placeholder:text-muted-foreground/20 disabled:opacity-50"
                  />
                </div>
              )}
            
              <div className="flex justify-between items-center px-1">
                <div className="flex items-center gap-1.5">
                  <Timer size={14} className={timeLeft < 60 ? 'text-destructive' : 'text-muted-foreground'} />
                  <span className={`text-2xs font-bold uppercase tracking-wider ${timeLeft < 60 ? 'text-destructive' : 'text-muted-foreground'}`}>
                    {timeLeft > 0 ? formatTime(timeLeft) : tr('EXPIRADO', 'EXPIRED')}
                  </span>
                </div>
                
                {otpStatus?.tentativasRestantes !== undefined && (
                  <span className={`text-2xs font-bold uppercase tracking-wider ${otpStatus.tentativasRestantes <= 1 ? 'text-destructive' : 'text-muted-foreground'}`}>
                    {otpStatus.tentativasRestantes} {tr('tentativas restantes', 'attempts remaining')}
                  </span>
                )}
              </div>
            </div>

            {!isLocked && !isExpired ? (
              <button
                type="submit"
                disabled={codigo.length !== 6 || verifyMutation.isPending}
                className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-2xl transition-all shadow-xl shadow-primary/20 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
              >
                {verifyMutation.isPending ? tr('VERIFICANDO...', 'VERIFYING...') : tr('VERIFICAR CONTA', 'VERIFY ACCOUNT')}
              </button>
            ) : isExpired ? (
              <button
                type="button"
                onClick={() => resendMutation.mutate()}
                disabled={resendMutation.isPending}
                className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-2xl transition-all shadow-xl shadow-primary/20 active:scale-[0.98] disabled:opacity-50"
              >
                {resendMutation.isPending ? tr('REENVIANDO...', 'RESENDING...') : tr('REENVIAR NOVO CÓDIGO', 'RESEND NEW CODE')}
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="w-full bg-secondary hover:bg-secondary/80 text-foreground font-bold py-4 rounded-2xl transition-all border border-white/5 active:scale-[0.98]"
              >
                {tr('ENTENDIDO', 'GOT IT')}
              </button>
            )}

            <div className="pt-2">
              <button
                type="button"
                onClick={() => resendMutation.mutate()}
                disabled={!canResend || resendMutation.isPending || isLocked}
                className="flex items-center justify-center gap-2 w-full text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors disabled:opacity-30"
              >
                <RefreshCcw size={14} className={resendMutation.isPending ? 'animate-spin' : ''} />
                {tr('Reenviar código', 'Resend code')}
              </button>
            </div>
          </form>

          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-muted-foreground hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
