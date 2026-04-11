import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { AutenticaOService } from '../../api';
import { Input } from '../../components/ui/Input';
import { toast } from '../../store/useToastStore';
import logo from '../../assets/logo-equilibra.png';
import { Check, X, Eye, EyeOff } from 'lucide-react';
import { useI18nStore } from '../../store/useI18nStore';
type RegisterFormValues = {
  nome: string;
  email: string;
  confirmEmail: string;
  senha: string;
  confirmSenha: string;
};

export function RegisterPage() {
  const navigate = useNavigate();
  const language = useI18nStore((s) => s.language);
  const tr = (pt: string, en: string) => (language === 'en-US' ? en : pt);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const registerSchema = z.object({
    nome: z.string().min(3, tr('O nome deve ter no mínimo 3 caracteres', 'Name must be at least 3 characters')),
    email: z.string().email(tr('Insira um e-mail válido', 'Enter a valid email')),
    confirmEmail: z.string().email(tr('Insira um e-mail válido', 'Enter a valid email')),
    senha: z.string()
      .min(8, tr('A senha deve ter no mínimo 8 caracteres', 'Password must be at least 8 characters'))
      .regex(/[A-Z]/, tr('Deve conter pelo menos uma letra maiúscula', 'Must include at least one uppercase letter'))
      .regex(/[a-z]/, tr('Deve conter pelo menos uma letra minúscula', 'Must include at least one lowercase letter'))
      .regex(/[0-9]/, tr('Deve conter pelo menos um número', 'Must include at least one number'))
      .regex(/[@$!%*?&]/, tr('Deve conter pelo menos um caractere especial (@$!%*?&)', 'Must include at least one special character (@$!%*?&)')),
    confirmSenha: z.string(),
  }).refine((data) => data.email === data.confirmEmail, {
    message: tr('Os e-mails não coincidem', 'Emails do not match'),
    path: ['confirmEmail'],
  }).refine((data) => data.senha === data.confirmSenha, {
    message: tr('As senhas não coincidem', 'Passwords do not match'),
    path: ['confirmSenha'],
  });
  
  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: 'onChange',
  });

  const senhaValue = watch('senha', '');

  const passwordRequirements = [
    { label: tr('8+ caracteres', '8+ characters'), met: senhaValue.length >= 8 },
    { label: tr('Maiúscula', 'Uppercase'), met: /[A-Z]/.test(senhaValue) },
    { label: tr('Minúscula', 'Lowercase'), met: /[a-z]/.test(senhaValue) },
    { label: tr('Número', 'Number'), met: /[0-9]/.test(senhaValue) },
    { label: tr('Especial (@$!%*)', 'Special (@$!%*)'), met: /[@$!%*?&]/.test(senhaValue) },
  ];

  const registerMutation = useMutation({
    mutationFn: (data: RegisterFormValues) => AutenticaOService.registrar({
      nome: data.nome,
      email: data.email,
      senha: data.senha
    }),
    onSuccess: () => {
      toast.success(tr('Conta criada com sucesso!', 'Account created successfully!'), 3000);
      toast.info(tr('Enviamos um código de verificação para o seu e-mail.', 'We sent a verification code to your email.'), 8000);
      navigate('/login');
    },
    onError: (error: any) => {
      setError('root', { 
        message: error?.body?.message || tr('Erro ao registrar usuário. Tente outro e-mail.', 'Error creating user. Try another email.') 
      });
    }
  });

  const onSubmit = (data: RegisterFormValues) => {
    registerMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 font-sans py-12">
      <div className="glass w-full max-w-2xl p-12 rounded-[2.5rem] flex flex-col items-center">
        <Link to="/login">
          <img src={logo} alt="Equilibra" className="w-24 h-24 mb-2 drop-shadow-[0_0_15px_rgba(124,58,237,0.5)]" />
        </Link>
        
        <h1 className="text-3xl font-bold text-gradient mb-1 tracking-tighter">{tr('Criar Conta', 'Create Account')}</h1>
        <p className="text-muted-foreground mb-8 text-center text-sm font-medium">
          {tr('Comece sua jornada rumo à liberdade financeira.', 'Start your journey toward financial freedom.')}
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-4">
          {/* Nome */}
          <Input
            {...register('nome')}
            id="reg-nome"
            label={tr('Nome Completo', 'Full Name')}
            placeholder="Ex: João Victor"
            error={errors.nome?.message}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* E-mail */}
            <Input
              {...register('email')}
              id="reg-email"
              type="email"
              label={tr('E-mail', 'Email')}
              placeholder="seu@exemplo.com"
              error={errors.email?.message}
            />

            {/* Confirmar E-mail */}
            <Input
              {...register('confirmEmail')}
              id="reg-confirm-email"
              type="email"
              label={tr('Confirmar E-mail', 'Confirm Email')}
              placeholder={tr('Repita seu e-mail', 'Repeat your email')}
              error={errors.confirmEmail?.message}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Senha */}
            <div className="space-y-1.5 relative">
              <label className="block text-[10px] font-bold text-muted-foreground ml-1 uppercase tracking-[0.2em]">{tr('Senha', 'Password')}</label>
              <div className="relative">
                <input 
                  {...register('senha')}
                  type={showPassword ? "text" : "password"} 
                  id="reg-senha"
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
              {errors.senha && <span className="text-[10px] text-destructive font-bold ml-1 uppercase">{errors.senha.message}</span>}
            </div>

            {/* Confirmar Senha */}
            <div className="space-y-1.5 relative">
              <label className="block text-[10px] font-bold text-muted-foreground ml-1 uppercase tracking-[0.2em]">{tr('Confirmar Senha', 'Confirm Password')}</label>
              <div className="relative">
                <input 
                  {...register('confirmSenha')}
                  type={showConfirmPassword ? "text" : "password"} 
                  id="reg-confirm-senha"
                  placeholder="••••••••"
                  className={`w-full bg-secondary/30 border ${errors.confirmSenha ? 'border-destructive/50' : 'border-white/5'} rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-secondary/60 transition-all font-medium placeholder:text-muted-foreground/30`}
                />
                <button 
                  type="button" 
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
                  aria-label={showConfirmPassword ? tr('Ocultar senha', 'Hide password') : tr('Mostrar senha', 'Show password')}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.confirmSenha && <span className="text-[10px] text-destructive font-bold ml-1 uppercase">{errors.confirmSenha.message}</span>}
            </div>
          </div>

          {/* Checklist de Senha */}
          <div className="bg-secondary/20 p-4 rounded-xl border border-white/5 grid grid-cols-2 gap-y-2 gap-x-4">
            {passwordRequirements.map((req, idx) => (
              <div key={idx} className="flex items-center gap-2">
                {req.met ? (
                  <Check size={12} className="text-emerald-500" />
                ) : (
                  <X size={12} className="text-muted-foreground/30" />
                )}
                <span className={`text-[10px] font-bold uppercase tracking-tight ${req.met ? 'text-emerald-500/80' : 'text-muted-foreground/50'}`}>
                  {req.label}
                </span>
              </div>
            ))}
          </div>

          <button 
            type="submit"
            disabled={registerMutation.isPending}
            id="btn-register"
            className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-5 rounded-xl transition-all shadow-xl shadow-primary/20 mt-4 active:scale-[0.98] text-base tracking-widest disabled:opacity-50"
          >
            {registerMutation.isPending ? tr('PROCESSANDO...', 'PROCESSING...') : tr('CRIAR MINHA CONTA', 'CREATE MY ACCOUNT')}
          </button>

          {errors.root && (
            <p className="text-center text-xs text-destructive font-bold uppercase mt-2">
              {errors.root.message}
            </p>
          )}
        </form>

        <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest mt-10 px-1 text-center">
          {tr('Já tem uma conta?', 'Already have an account?')} <Link to="/login" className="text-primary hover:underline font-bold">{tr('Fazer Login', 'Sign In')}</Link>
        </p>
      </div>
    </div>
  );
}
