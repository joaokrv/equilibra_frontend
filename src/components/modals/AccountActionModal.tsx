import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { AutenticacaoService, SolicitarAcaoContaRequestDTO } from '../../api';
import { toast } from '../../store/useToastStore';
import { useI18nStore } from '../../store/useI18nStore';
import { getApiErrorMessage } from '../../lib/errorMessage';
import { AlertTriangle, Trash2, EyeOff, X, ShieldCheck, ArrowLeft } from 'lucide-react';

type Acao = SolicitarAcaoContaRequestDTO.acao;
const Acao = SolicitarAcaoContaRequestDTO.acao;
type Etapa = 'escolha' | 'confirmacao' | 'otp';

interface AccountActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (acao: Acao) => void;
}

import { useModalA11y } from '../../hooks/useModalA11y';

export function AccountActionModal({ isOpen, onClose, onSuccess }: AccountActionModalProps) {
  const language = useI18nStore((s) => s.language);
  const tr = (pt: string, en: string) => (language === 'en-US' ? en : pt);

  const [etapa, setEtapa] = useState<Etapa>('escolha');
  const [acao, setAcao] = useState<Acao | null>(null);
  const [senha, setSenha] = useState('');
  const [codigo, setCodigo] = useState('');

  useEffect(() => {
    if (isOpen) {
      setEtapa('escolha');
      setAcao(null);
      setSenha('');
      setCodigo('');
    }
  }, [isOpen]);

  const solicitarMutation = useMutation({
    mutationFn: () =>
      AutenticacaoService.solicitarAcaoConta({ acao: acao!, senha }),
    onSuccess: () => {
      toast.info(
        tr('Código de confirmação enviado para seu e-mail.', 'Confirmation code sent to your email.')
      );
      setSenha('');
      setEtapa('otp');
    },
    onError: (error: unknown) => {
      toast.error(
        getApiErrorMessage(
          error,
          tr('Senha incorreta ou erro ao solicitar. Tente novamente.', 'Wrong password or request error. Try again.')
        )
      );
    },
  });

  const confirmarExcluirMutation = useMutation({
    mutationFn: () => AutenticacaoService.excluirConta({ senha, codigo }),
    onSuccess: () => {
      toast.success(tr('Conta excluída permanentemente.', 'Account permanently deleted.'));
      onSuccess(Acao.EXCLUIR);
    },
    onError: (error: unknown) => {
      toast.error(
        getApiErrorMessage(
          error,
          tr('Código inválido ou senha incorreta. Tente novamente.', 'Invalid code or wrong password. Try again.')
        )
      );
    },
  });

  const confirmarDesativarMutation = useMutation({
    mutationFn: () => AutenticacaoService.desativarConta({ senha, codigo }),
    onSuccess: () => {
      toast.success(tr('Conta desativada com sucesso.', 'Account deactivated successfully.'));
      onSuccess(Acao.DESATIVAR);
    },
    onError: (error: unknown) => {
      toast.error(
        getApiErrorMessage(
          error,
          tr('Código inválido ou senha incorreta. Tente novamente.', 'Invalid code or wrong password. Try again.')
        )
      );
    },
  });

  const dialogRef = useModalA11y(isOpen, onClose);

  if (!isOpen) return null;

  const isExcluir = acao === Acao.EXCLUIR;
  const accentColor = isExcluir ? 'rose' : 'amber';
  const isPending =
    solicitarMutation.isPending ||
    confirmarExcluirMutation.isPending ||
    confirmarDesativarMutation.isPending;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div ref={dialogRef} className="glass w-full max-w-md p-8 rounded-[2rem] border border-white/10 shadow-2xl relative overflow-hidden">
        <div
          className={`absolute -top-24 -right-24 w-48 h-48 bg-${accentColor}-500/20 rounded-full blur-[80px]`}
        />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-white transition-colors z-10"
        >
          <X size={20} />
        </button>

        {etapa === 'escolha' && (
          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-rose-500/20 rounded-xl border border-rose-500/20">
                <AlertTriangle className="text-rose-500 w-6 h-6" />
              </div>
              <h2 className="text-xl font-black text-white uppercase tracking-tight">
                {tr('Zona de Perigo', 'Danger Zone')}
              </h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {tr(
                'Escolha uma ação para sua conta. Estas ações são irreversíveis ou requerem reativação manual.',
                'Choose an action for your account. These actions are irreversible or require manual reactivation.'
              )}
            </p>

            <div className="space-y-3">
              <button
                onClick={() => { setAcao(Acao.DESATIVAR); setEtapa('confirmacao'); }}
                className="w-full flex items-center gap-4 p-4 bg-amber-500/10 border border-amber-500/20 hover:border-amber-500/50 rounded-2xl transition-all text-left group"
              >
                <div className="p-2 bg-amber-500/20 rounded-xl shrink-0">
                  <EyeOff className="text-amber-500 w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-white text-sm uppercase tracking-wider">
                    {tr('Desativar Conta', 'Deactivate Account')}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {tr(
                      'Suspende o acesso. Você pode reativar depois.',
                      'Suspends access. You can reactivate later.'
                    )}
                  </p>
                </div>
              </button>

              <button
                onClick={() => { setAcao(Acao.EXCLUIR); setEtapa('confirmacao'); }}
                className="w-full flex items-center gap-4 p-4 bg-rose-500/10 border border-rose-500/20 hover:border-rose-500/50 rounded-2xl transition-all text-left group"
              >
                <div className="p-2 bg-rose-500/20 rounded-xl shrink-0">
                  <Trash2 className="text-rose-500 w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-white text-sm uppercase tracking-wider">
                    {tr('Excluir Conta', 'Delete Account')}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {tr(
                      'Apaga todos os dados permanentemente. Irreversível.',
                      'Permanently deletes all data. Irreversible.'
                    )}
                  </p>
                </div>
              </button>
            </div>
          </div>
        )}

        {etapa === 'confirmacao' && acao && (
          <div className="relative z-10 space-y-6">
            <button
              onClick={() => setEtapa('escolha')}
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-white transition-colors uppercase tracking-widest font-bold mb-2"
            >
              <ArrowLeft size={14} /> {tr('Voltar', 'Back')}
            </button>

            <div className={`flex items-center gap-3`}>
              <div className={`p-2 bg-${accentColor}-500/20 rounded-xl border border-${accentColor}-500/20`}>
                {isExcluir
                  ? <Trash2 className="text-rose-500 w-6 h-6" />
                  : <EyeOff className="text-amber-500 w-6 h-6" />}
              </div>
              <h2 className="text-xl font-black text-white uppercase tracking-tight">
                {isExcluir
                  ? tr('Excluir Conta', 'Delete Account')
                  : tr('Desativar Conta', 'Deactivate Account')}
              </h2>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed">
              {tr(
                'Digite sua senha para confirmar a solicitação. Um código será enviado para seu e-mail.',
                'Enter your password to confirm the request. A code will be sent to your email.'
              )}
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                solicitarMutation.mutate();
              }}
              className="space-y-4"
            >
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder={tr('Sua senha atual', 'Your current password')}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 text-white font-bold focus:outline-none focus:border-white/30 transition-all"
                autoFocus
              />
              <button
                type="submit"
                disabled={!senha || isPending}
                className={`w-full py-4 bg-${accentColor}-500 hover:bg-${accentColor}-400 text-white font-black rounded-2xl transition-all uppercase tracking-widest text-xs shadow-lg disabled:opacity-50 active:scale-95`}
              >
                {isPending
                  ? tr('Processando...', 'Processing...')
                  : tr('Enviar Código de Confirmação', 'Send Confirmation Code')}
              </button>
            </form>
          </div>
        )}

        {etapa === 'otp' && acao && (
          <div className="relative z-10 space-y-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 border border-primary/20">
                <ShieldCheck className="text-primary w-8 h-8" />
              </div>
              <h2 className="text-xl font-black text-white uppercase tracking-tight mb-2">
                {tr('Confirmação por E-mail', 'Email Confirmation')}
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {tr(
                  'Digite o código de 6 dígitos enviado para seu e-mail e confirme sua senha.',
                  'Enter the 6-digit code sent to your email and confirm your password.'
                )}
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (acao === Acao.EXCLUIR) {
                  confirmarExcluirMutation.mutate();
                } else {
                  confirmarDesativarMutation.mutate();
                }
              }}
              className="space-y-4"
            >
              <input
                type="text"
                maxLength={6}
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="w-full bg-secondary/30 border border-white/5 rounded-2xl px-4 py-5 text-center text-3xl font-black tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all placeholder:text-muted-foreground/20"
              />
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder={tr('Confirme sua senha', 'Confirm your password')}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 text-white font-bold focus:outline-none focus:border-white/30 transition-all"
              />
              <button
                type="submit"
                disabled={codigo.length !== 6 || !senha || isPending}
                className={`w-full py-4 bg-${accentColor}-500 hover:bg-${accentColor}-400 text-white font-black rounded-2xl transition-all uppercase tracking-widest text-xs shadow-lg disabled:opacity-50 active:scale-95`}
              >
                {isPending
                  ? tr('Processando...', 'Processing...')
                  : isExcluir
                  ? tr('Excluir Permanentemente', 'Delete Permanently')
                  : tr('Confirmar Desativação', 'Confirm Deactivation')}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
