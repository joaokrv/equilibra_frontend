import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '../../store/useAuthStore';
import type { User } from '../../store/useAuthStore';
import { AutenticacaoService } from '../../api';
import { Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { toast } from '../../store/useToastStore';
import logo from '../../assets/logo-equilibra.png';
import { useI18nStore } from '../../store/useI18nStore';
import { getApiErrorMessage } from '../../lib/errorMessage';
import { OtpModal } from '../../components/modals/OtpModal';
import { ReactivationModal } from '../../components/modals/ReactivationModal';
import { ServerStatusBadge } from '../../components/ui/ServerStatusBadge';
import { ApiError } from '../../api';
type LoginFormValues = {
  email: string;
  senha: string;
};

export function LoginPage() {
  const { setAuth } = useAuthStore();
  const language = useI18nStore((s) => s.language);
  const tr = (pt: string, en: string) => (language === 'en-US' ? en : pt);
  const [showPassword, setShowPassword] = useState(false);
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [otpData, setOtpData] = useState({ registroId: '', email: '' });
  const [isReactivationModalOpen, setIsReactivationModalOpen] = useState(false);
  const [reactivationEmail, setReactivationEmail] = useState('');
  const loginSchema = z.object({
    email: z.string().email(tr('Insira um e-mail válido', 'Enter a valid email')), 
    senha: z.string().min(6, tr('A senha deve ter no mínimo 6 caracteres', 'Password must be at least 6 characters')),
  });
  
  const {
    register,
    handleSubmit,
    setError,
    getValues,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
  });

  const loginMutation = useMutation({
    mutationFn: (data: LoginFormValues) => AutenticacaoService.login({
      email: data.email,
      senha: data.senha
    }),
    onSuccess: (response) => {
      const user = response.usuario as User | undefined;

      if (user?.id && user?.nome && user?.email) {
        setAuth(user);
        toast.success(tr('Bem-vindo de volta ao Equilibra!', 'Welcome back to Equilibra!'));
      } else {
        setError('root', {
          message: tr('Resposta do servidor incompleta. Tente novamente.', 'Incomplete server response. Please try again.'),
        });
      }
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError && error.status === 403) {
        const body = error.body as any;
        if (body?.otpStatus) {
          setOtpData({
            registroId: body.otpStatus.registroId,
            email: getValues('email')
          });
          setIsOtpModalOpen(true);
          toast.warning(tr('Ative sua conta para continuar.', 'Activate your account to continue.'), 5000);
          return;
        }
        if (body?.codigo === 'CONTA_DESATIVADA') {
          setReactivationEmail(getValues('email'));
          setIsReactivationModalOpen(true);
          return;
        }
      }

      setError('root', {
        message: getApiErrorMessage(
          error,
          tr('E-mail ou senha incorretos. Verifique seus dados e tente novamente.', 'Invalid email or password. Check your data and try again.')
        ),
      });
    }
  });

  const onSubmit = (data: LoginFormValues) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-3 sm:p-4 font-sans">
      <div className="glass w-full max-w-lg p-5 sm:p-8 lg:p-10 rounded-2xl sm:rounded-3xl flex flex-col items-center">
        <img 
          src={logo} 
          alt="Equilibra Logo" 
          id="login-logo"
          className="brand-logo w-28 h-28 sm:w-36 sm:h-36 lg:w-40 lg:h-40 mb-2" 
        />
        
        <h1 className="text-3xl sm:text-4xl font-bold text-gradient mb-2 tracking-tighter">Equilibra</h1>
        <p className="text-muted-foreground mb-6 sm:mb-10 text-center text-sm font-medium px-4 leading-relaxed max-w-sm">
          {tr('Equilibre suas contas com a simplicidade que você sempre quis e a clareza que suas metas precisam.', 'Balance your accounts with the simplicity you\'ve always wanted and the clarity your goals need.')}
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-5">
          <Input
            {...register('email')}
            type="email"
            id="email"
            label={tr('E-mail', 'Email')}
            placeholder="seu@email.com"
            error={errors.email?.message}
          />

          <div className="space-y-1.5">
            <label htmlFor="senha" className="block text-2xs font-bold text-muted-foreground ml-1 uppercase tracking-[0.2em]">{tr('Senha', 'Password')}</label>
            <div className="relative">
              <input
                {...register('senha')}
                type={showPassword ? 'text' : 'password'}
                id="senha"
                placeholder="••••••••"
                className={`w-full bg-secondary/30 border ${errors.senha ? 'border-destructive/50' : 'border-foreground/5'} rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-secondary/60 transition-all font-medium placeholder:text-muted-foreground/30`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showPassword ? tr('Ocultar senha', 'Hide password') : tr('Mostrar senha', 'Show password')}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.senha && (
              <span className="text-2xs text-destructive font-bold ml-1 uppercase animate-in fade-in slide-in-from-top-1">
                {errors.senha.message}
              </span>
            )}
          </div>
          
          <button 
            type="submit"
            disabled={loginMutation.isPending}
            id="btn-login"
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-4 sm:py-5 rounded-xl transition-all shadow-xl shadow-primary/25 mt-6 active:scale-[0.98] text-sm sm:text-base tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loginMutation.isPending ? tr('AUTENTICANDO...', 'AUTHENTICATING...') : tr('ENTRAR NO FLUXO', 'SIGN IN')}
          </button>
          
          {errors.root && (
            <p className="text-center text-xs text-destructive font-bold uppercase mt-2">
              {errors.root.message}
            </p>
          )}
        </form>

        <p className="text-xs sm:text-sm text-muted-foreground font-medium uppercase tracking-wider sm:tracking-widest mt-6 sm:mt-8 px-1 text-center">
          {tr('Ainda não tem conta?', "Don't have an account yet?")} <Link to="/register" className="text-primary hover:underline font-bold">{tr('Criar agora', 'Create now')}</Link>
        </p>

        <Link
          to="/forgot-password"
          className="text-xs text-muted-foreground hover:text-primary font-semibold uppercase tracking-widest mt-2 transition-colors"
        >
          {tr('Esqueci minha senha', 'Forgot my password')}
        </Link>
        
        <div className="mt-8 pt-4 border-t border-foreground/5 w-full text-center">
          <ServerStatusBadge />
        </div>
      </div>

      <OtpModal
        isOpen={isOtpModalOpen}
        onClose={() => setIsOtpModalOpen(false)}
        registroId={otpData.registroId}
        email={otpData.email}
        onSuccess={() => {
          setIsOtpModalOpen(false);
          toast.success(tr('Conta ativada! Você já pode entrar.', 'Account activated! You can now sign in.'));
        }}
      />

      <ReactivationModal
        isOpen={isReactivationModalOpen}
        onClose={() => setIsReactivationModalOpen(false)}
        email={reactivationEmail}
        initialPassword={getValues('senha')}
        onSuccess={() => setIsReactivationModalOpen(false)}
      />
    </div>
  );
}
