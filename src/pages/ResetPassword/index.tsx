import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation } from '@tanstack/react-query';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Input } from '../../components/ui/Input';
import { toast } from '../../store/useToastStore';
import { ArrowLeft, ShieldCheck, Loader2 } from 'lucide-react';
import logo from '../../assets/logo-equilibra.png';
import { AutenticaOService } from '../../api';
import { useI18nStore } from '../../store/useI18nStore';
import { getApiErrorMessage } from '../../lib/errorMessage';
import { createPasswordSchema } from '../../lib/passwordValidation';
type ResetFormValues = { novaSenha: string; confirmarSenha: string };

/**
 * Página de redefinição de senha.
 *
 * Fluxo:
 * 1. Extrai o token da URL (?token=UUID)
 * 2. Valida o token com o backend para obter o e-mail
 * 3. Exibe o formulário de nova senha
 * 4. Envia nova senha + token para o backend
 * 5. Redireciona para login
 */
export function ResetPasswordPage() {
  const language = useI18nStore((s) => s.language);
  const tr = (pt: string, en: string) => (language === 'en-US' ? en : pt);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [email, setEmail] = useState<string | null>(null);
  const [tokenValido, setTokenValido] = useState<boolean | null>(null);
  const [erroToken, setErroToken] = useState<string | null>(null);
  const resetSchema = z.object({
    novaSenha: createPasswordSchema(tr),
    confirmarSenha: z.string(),
  }).refine((data) => data.novaSenha === data.confirmarSenha, {
    message: tr('As senhas não coincidem', 'Passwords do not match'),
    path: ['confirmarSenha'],
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema),
    mode: 'onChange',
  });

  // Valida o token ao carregar a página
  useEffect(() => {
    if (!token) {
      setTokenValido(false);
      setErroToken(tr('Nenhum token de recuperação informado.', 'No recovery token provided.'));
      return;
    }

    AutenticaOService.validarToken(token)
      .then((data) => {
        setEmail(data.email as string);
        setTokenValido(true);
      })
      .catch((error: unknown) => {
        setTokenValido(false);
        setErroToken(getApiErrorMessage(error, tr('Token inválido ou expirado.', 'Invalid or expired token.')));
      });
  }, [token]);

  const resetMutation = useMutation({
    mutationFn: (data: ResetFormValues) =>
      AutenticaOService.resetarSenha({
        token: token!,
        novaSenha: data.novaSenha,
      }),
    onSuccess: () => {
      toast.success(tr('Senha redefinida com sucesso! Faça login com sua nova senha.', 'Password reset successfully! Sign in with your new password.'), 6000);
      navigate('/login');
    },
    onError: (error: unknown) => {
      const mensagem = getApiErrorMessage(error, tr('Erro ao redefinir a senha. Tente solicitar uma nova recuperação.', 'Error resetting password. Try requesting a new recovery link.'));
      toast.error(mensagem);
    },
  });

  const onSubmit = (data: ResetFormValues) => {
    resetMutation.mutate(data);
  };

  // Estado de carregamento enquanto valida o token
  if (tokenValido === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="glass p-6 sm:p-10 rounded-2xl sm:rounded-3xl flex flex-col items-center gap-4">
          <Loader2 size={40} className="text-primary animate-spin" />
          <p className="text-muted-foreground text-sm font-medium uppercase tracking-widest">
            {tr('Validando link de recuperação...', 'Validating recovery link...')}
          </p>
        </div>
      </div>
    );
  }

  // Token inválido ou expirado
  if (!tokenValido) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="glass w-full max-w-lg p-5 sm:p-8 lg:p-10 rounded-2xl sm:rounded-3xl flex flex-col items-center">
          <img
            src={logo}
            alt="Equilibra Logo"
            className="w-24 h-24 sm:w-28 sm:h-28 mb-4 drop-shadow-[0_0_20px_rgba(124,58,237,0.6)] opacity-50"
          />
          <h1 className="text-2xl font-bold text-destructive mb-3">{tr('Link Inválido', 'Invalid Link')}</h1>
          <p className="text-muted-foreground text-center text-sm mb-8 leading-relaxed max-w-sm">
            {erroToken || tr('O link de recuperação é inválido ou expirou. Solicite um novo link para redefinir sua senha.', 'The recovery link is invalid or expired. Request a new link to reset your password.')}
          </p>
          <Link
            to="/forgot-password"
            className="bg-primary hover:bg-primary/90 text-white font-bold py-4 px-8 rounded-xl transition-all shadow-xl shadow-primary/25 active:scale-[0.98] text-sm tracking-widest"
          >
            {tr('SOLICITAR NOVO LINK', 'REQUEST NEW LINK')}
          </Link>
          <Link
            to="/login"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary font-medium uppercase tracking-widest mt-6 transition-colors"
          >
            <ArrowLeft size={16} />
            {tr('Voltar para o Login', 'Back to Login')}
          </Link>
        </div>
      </div>
    );
  }

  // Formulário de nova senha
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 font-sans">
      <div className="glass w-full max-w-lg p-5 sm:p-8 lg:p-10 rounded-2xl sm:rounded-3xl flex flex-col items-center">
        <img
          src={logo}
          alt="Equilibra Logo"
          id="reset-password-logo"
          className="w-24 h-24 sm:w-28 sm:h-28 mb-2 drop-shadow-[0_0_20px_rgba(124,58,237,0.6)]"
        />

        <h1 className="text-2xl sm:text-3xl font-bold text-gradient mb-2 tracking-tighter">{tr('Nova Senha', 'New Password')}</h1>
        <p className="text-muted-foreground mb-2 text-center text-sm font-medium">
          {tr('Crie uma nova senha para a conta:', 'Create a new password for account:')}
        </p>
        <p className="text-primary font-bold text-sm mb-8">{email}</p>

        <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-5">
          <Input
            {...register('novaSenha')}
            type="password"
            id="nova-senha"
            label={tr('Nova Senha', 'New Password')}
            placeholder="••••••••"
            error={errors.novaSenha?.message}
          />

          <Input
            {...register('confirmarSenha')}
            type="password"
            id="confirmar-senha"
            label={tr('Confirmar Nova Senha', 'Confirm New Password')}
            placeholder="••••••••"
            error={errors.confirmarSenha?.message}
          />

          <div className="bg-secondary/30 rounded-xl p-4 text-xs text-muted-foreground leading-relaxed">
            <p className="font-bold uppercase tracking-widest mb-2 text-white/70">{tr('Requisitos da senha:', 'Password requirements:')}</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>{tr('Mínimo de 8 caracteres', 'Minimum 8 characters')}</li>
              <li>{tr('Pelo menos uma letra maiúscula', 'At least one uppercase letter')}</li>
              <li>{tr('Pelo menos uma letra minúscula', 'At least one lowercase letter')}</li>
              <li>{tr('Pelo menos um número', 'At least one number')}</li>
              <li>{tr('Pelo menos um caractere especial (@$!%*?&)', 'At least one special character (@$!%*?&)')}</li>
            </ul>
          </div>

          <button
            type="submit"
            disabled={resetMutation.isPending}
            id="btn-resetar-senha"
            className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 sm:py-5 rounded-xl transition-all shadow-xl shadow-primary/25 mt-4 active:scale-[0.98] text-sm sm:text-base tracking-wider sm:tracking-widest disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            <ShieldCheck size={18} />
            {resetMutation.isPending ? tr('REDEFININDO...', 'RESETTING...') : tr('REDEFINIR SENHA', 'RESET PASSWORD')}
          </button>
        </form>

        <Link
          to="/login"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary font-medium uppercase tracking-widest mt-8 transition-colors"
        >
          <ArrowLeft size={16} />
          {tr('Voltar para o Login', 'Back to Login')}
        </Link>
      </div>
    </div>
  );
}
