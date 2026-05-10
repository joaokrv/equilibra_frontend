import React, { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { AutenticacaoService } from '../../api';
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

export function OtpModal({ isOpen, onClose, registroId, email, onSuccess }: OtpModalProps) {
  const language = useI18nStore((s) => s.language);
  const tr = (pt: string, en: string) => (language === 'en-US' ? en : pt);

  const [codigo, setCodigo] = useState('');
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [canResend, setCanResend] = useState(false);

  // Consulta o status atual do OTP (tentativas, bloqueios, timers)
  const { data: status, refetch } = useQuery({
    queryKey: ['otp-status', registroId],
    queryFn: () => AutenticacaoService.getOtpStatus(registroId),
    enabled: isOpen && !!registroId,
    refetchInterval: 10000, // Atualiza a cada 10s
  });

  // Mutação para verificar o código
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
      // Se for 423 (Locked), o useQuery vai pegar o novo status no refetch
      refetch();
      toast.error(getApiErrorMessage(error, tr('Código inválido ou expirado.', 'Invalid or expired code.')));
    }
  });

  // Mutação para reenvio
  const resendMutation = useMutation({
    mutationFn: () => AutenticacaoService.reenviarCodigo({
      email,
      registroId
    }),
    onSuccess: () => {
      toast.info(tr('Um novo código foi enviado para seu e-mail.', 'A new code has been sent to your email.'));
      refetch();
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, tr('Não foi possível reenviar o código agora.', 'Could not resend the code now.')));
    }
  });

  // Gerenciamento dos timers (Countdown)
  useEffect(() => {
    if (!status) return;

    const updateTimers = () => {
      const agora = new Date().getTime();
      
      // Timer de expiração do registro
      if (status.expiraEm) {
        const expira = new Date(status.expiraEm).getTime();
        const diff = Math.max(0, Math.floor((expira - agora) / 1000));
        setTimeLeft(diff);
      }

      // Timer de reenvio
      if (status.proximoReenvioEm) {
        const reenvio = new Date(status.proximoReenvioEm).getTime();
        setCanResend(agora >= reenvio);
      } else {
        setCanResend(true);
      }
    };

    updateTimers();
    const interval = setInterval(updateTimers, 1000);
    return () => clearInterval(interval);
  }, [status]);

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

  if (!isOpen) return null;

  const isLocked = status?.status === 'BLOQUEADO';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="glass w-full max-w-md p-8 rounded-[2rem] border border-white/10 shadow-2xl relative overflow-hidden">
        {/* Glow Decorativo */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 rounded-full blur-[80px]" />
        
        <div className="flex flex-col items-center text-center relative z-10">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 border border-primary/20">
            <ShieldCheck className="text-primary w-8 h-8" />
          </div>

          <h2 className="text-2xl font-bold text-gradient mb-2 tracking-tight">
            {tr('Verifique seu E-mail', 'Verify your Email')}
          </h2>
          <p className="text-muted-foreground text-sm mb-8 leading-relaxed">
            {tr('Enviamos um código de 6 dígitos para', 'We sent a 6-digit code to')} <br />
            <span className="text-foreground font-semibold">{email}</span>
          </p>

          <form onSubmit={handleVerify} className="w-full space-y-6">
            <div className="space-y-2">
              <div className="relative">
                <input
                  type="text"
                  maxLength={6}
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  disabled={isLocked || verifyMutation.isPending}
                  className="w-full bg-secondary/30 border border-white/5 rounded-2xl px-4 py-5 text-center text-3xl font-black tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-secondary/60 transition-all placeholder:text-muted-foreground/20 disabled:opacity-50"
                />
                
                {isLocked && (
                  <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] rounded-2xl flex flex-col items-center justify-center border border-destructive/20 animate-in zoom-in-95 duration-300">
                    <AlertCircle className="text-destructive w-6 h-6 mb-1" />
                    <span className="text-[10px] font-bold text-destructive uppercase tracking-widest">
                      {tr('Temporariamente Bloqueado', 'Temporarily Locked')}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center px-1">
                <div className="flex items-center gap-1.5">
                  <Timer size={14} className={timeLeft < 60 ? 'text-destructive' : 'text-muted-foreground'} />
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${timeLeft < 60 ? 'text-destructive' : 'text-muted-foreground'}`}>
                    {timeLeft > 0 ? formatTime(timeLeft) : tr('EXPIRADO', 'EXPIRED')}
                  </span>
                </div>
                
                {status?.tentativasRestantes !== undefined && (
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${status.tentativasRestantes <= 1 ? 'text-destructive' : 'text-muted-foreground'}`}>
                    {status.tentativasRestantes} {tr('tentativas restantes', 'attempts remaining')}
                  </span>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={codigo.length !== 6 || isLocked || verifyMutation.isPending}
              className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-2xl transition-all shadow-xl shadow-primary/20 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
            >
              {verifyMutation.isPending ? tr('VERIFICANDO...', 'VERIFYING...') : tr('VERIFICAR CONTA', 'VERIFY ACCOUNT')}
            </button>

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
