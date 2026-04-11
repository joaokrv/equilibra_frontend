import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '../../store/useAuthStore';
import type { User } from '../../store/useAuthStore';
import { AutenticaOService } from '../../api';
import { Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { toast } from '../../store/useToastStore';
import logo from '../../assets/logo-equilibra.png';
import { useI18nStore } from '../../store/useI18nStore';
type LoginFormValues = {
  email: string;
  senha: string;
};

export function LoginPage() {
  const { setAuth } = useAuthStore();
  const language = useI18nStore((s) => s.language);
  const tr = (pt: string, en: string) => (language === 'en-US' ? en : pt);
  const [showPassword, setShowPassword] = useState(false);
  const loginSchema = z.object({
    email: z.string().email(tr('Insira um e-mail válido', 'Enter a valid email')), 
    senha: z.string().min(6, tr('A senha deve ter no mínimo 6 caracteres', 'Password must be at least 6 characters')),
  });
  
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
  });

  const loginMutation = useMutation({
    mutationFn: (data: LoginFormValues) => AutenticaOService.login({
      email: data.email,
      senha: data.senha
    }),
    onSuccess: (response) => {
      const user = response.user as User | undefined;

      if (response.accessToken && user?.id && user?.nome && user?.email) {
        setAuth(user, response.accessToken, response.refreshToken || '');

        if (!user.isEmailVerificado) {
          toast.warning(
            tr('Sua conta ainda não foi ativada. Algumas funcionalidades estarão bloqueadas até a verificação do e-mail.', 'Your account is not verified yet. Some features will remain blocked until email verification.'),
            8000
          );
        } else {
          toast.success(tr('Bem-vindo de volta ao Equilibra!', 'Welcome back to Equilibra!'));
        }
      } else {
        setError('root', {
          message: tr('Resposta do servidor incompleta. Tente novamente.', 'Incomplete server response. Please try again.'),
        });
      }
    },
    onError: (error: any) => {
      const code = error?.body?.code;

      if (code === 'EMAIL_NAO_VERIFICADO') {
        toast.warning(tr('Seu e-mail ainda não foi verificado. Ative sua conta para continuar.', 'Your email has not been verified yet. Verify your account to continue.'), 8000);
        setError('root', { message: tr('Verifique seu e-mail para ativar a conta.', 'Check your email to activate your account.') });
        return;
      }

      setError('root', {
        message: tr('E-mail ou senha incorretos. Verifique seus dados e tente novamente.', 'Invalid email or password. Check your data and try again.'),
      });
    }
  });

  const onSubmit = (data: LoginFormValues) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 font-sans">
      <div className="glass w-full max-w-lg p-10 rounded-3xl flex flex-col items-center">
        <img 
          src={logo} 
          alt="Equilibra Logo" 
          id="login-logo"
          className="w-40 h-40 mb-2 drop-shadow-[0_0_20px_rgba(124,58,237,0.6)]" 
        />
        
        <h1 className="text-4xl font-bold text-gradient mb-2 tracking-tighter">Equilibra</h1>
        <p className="text-muted-foreground mb-10 text-center text-sm font-medium">
          {tr('Seu controle financeiro com estética e precisão.', 'Your financial control with style and precision.')}
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
            <label htmlFor="senha" className="block text-[10px] font-bold text-muted-foreground ml-1 uppercase tracking-[0.2em]">{tr('Senha', 'Password')}</label>
            <div className="relative">
              <input
                {...register('senha')}
                type={showPassword ? 'text' : 'password'}
                id="senha"
                placeholder="••••••••"
                className={`w-full bg-secondary/30 border ${errors.senha ? 'border-destructive/50' : 'border-white/5'} rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-secondary/60 transition-all font-medium placeholder:text-muted-foreground/30`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
                aria-label={showPassword ? tr('Ocultar senha', 'Hide password') : tr('Mostrar senha', 'Show password')}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.senha && (
              <span className="text-[10px] text-destructive font-bold ml-1 uppercase animate-in fade-in slide-in-from-top-1">
                {errors.senha.message}
              </span>
            )}
          </div>
          
          <button 
            type="submit"
            disabled={loginMutation.isPending}
            id="btn-login"
            className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-5 rounded-xl transition-all shadow-xl shadow-primary/25 mt-6 active:scale-[0.98] text-base tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loginMutation.isPending ? tr('AUTENTICANDO...', 'AUTHENTICATING...') : tr('ENTRAR NO FLUXO', 'SIGN IN')}
          </button>
          
          {errors.root && (
            <p className="text-center text-xs text-destructive font-bold uppercase mt-2">
              {errors.root.message}
            </p>
          )}
        </form>

        <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest mt-8 px-1 text-center">
          {tr('Ainda não tem conta?', "Don't have an account yet?")} <Link to="/register" className="text-primary hover:underline font-bold">{tr('Criar agora', 'Create now')}</Link>
        </p>

        <Link
          to="/forgot-password"
          className="text-xs text-muted-foreground hover:text-primary font-semibold uppercase tracking-widest mt-2 transition-colors"
        >
          {tr('Esqueci minha senha', 'Forgot my password')}
        </Link>
      </div>
    </div>
  );
}
