import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Input } from '../../components/ui/Input';
import { toast } from '../../store/useToastStore';
import { ArrowLeft, Send } from 'lucide-react';
import logo from '../../assets/logo-equilibra.png';
import { AutenticacaoService } from '../../api';
import { useI18nStore } from '../../store/useI18nStore';
import { getApiErrorMessage } from '../../lib/errorMessage';
type ForgotFormValues = { email: string };

/**
 * Página de "Esqueci minha senha".
 *
 * O usuário informa seu e-mail e o backend envia um link de recuperação.
 * A resposta é sempre genérica (proteção contra enumeração de e-mails).
 */
export function ForgotPasswordPage() {
  const language = useI18nStore((s) => s.language);
  const tr = (pt: string, en: string) => (language === 'en-US' ? en : pt);
  const forgotSchema = z.object({
    email: z.string().email(tr('Insira um e-mail válido', 'Enter a valid email')),
  });
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotFormValues>({
    resolver: zodResolver(forgotSchema),
    mode: 'onChange',
  });

  const solicitarMutation = useMutation({
    mutationFn: (data: ForgotFormValues) =>
      AutenticacaoService.solicitarRecuperacao({ email: data.email }),
    onSuccess: () => {
      toast.success(
        tr('Se o e-mail estiver cadastrado, você receberá um link de recuperação. Verifique sua caixa de entrada e spam.', 'If the email is registered, you will receive a recovery link. Check your inbox and spam folder.'),
        8000
      );
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, tr('Ocorreu um erro ao processar sua solicitação. Tente novamente.', 'An error occurred while processing your request. Please try again.')));
    },
  });

  const onSubmit = (data: ForgotFormValues) => {
    solicitarMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-3 sm:p-4 font-sans">
      <div className="glass w-full max-w-lg p-5 sm:p-8 lg:p-10 rounded-2xl sm:rounded-3xl flex flex-col items-center">
        <img
          src={logo}
          alt="Equilibra Logo"
          id="forgot-password-logo"
          className="brand-logo w-24 h-24 sm:w-28 sm:h-28 mb-2"
        />

        <h1 className="text-2xl sm:text-3xl font-bold text-gradient mb-2 tracking-tighter">{tr('Recuperar Senha', 'Recover Password')}</h1>
        <p className="text-muted-foreground mb-6 sm:mb-8 text-center text-sm font-medium max-w-sm leading-relaxed">
          {tr('Informe o e-mail da sua conta e enviaremos um link seguro para você criar uma nova senha.', 'Enter your account email and we will send a secure link so you can create a new password.')}
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-5">
          <Input
            {...register('email')}
            type="email"
            id="email-recuperacao"
            label={tr('E-mail', 'Email')}
            placeholder="seu@email.com"
            error={errors.email?.message}
          />

          <button
            type="submit"
            disabled={solicitarMutation.isPending}
            id="btn-solicitar-recuperacao"
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-4 sm:py-5 rounded-xl transition-all shadow-xl shadow-primary/25 mt-6 active:scale-[0.98] text-sm sm:text-base tracking-wider sm:tracking-widest disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            <Send size={18} />
            {solicitarMutation.isPending ? tr('ENVIANDO...', 'SENDING...') : tr('ENVIAR LINK DE RECUPERAÇÃO', 'SEND RECOVERY LINK')}
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
