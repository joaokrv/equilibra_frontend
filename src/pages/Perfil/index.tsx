import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { toast } from '../../store/useToastStore';
import { PerfilService, AutenticacaoService, UsuarioAtualizacaoRequestDTO } from '../../api';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  CheckCircle2,
  AlertTriangle,
  Send,
  ShieldCheck,
  Mail,
  User as UserIcon,
  Camera,
  Phone,
  Coins,
  TrendingUp,
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
  ShieldAlert
} from 'lucide-react';
import { AccountActionModal } from '../../components/modals/AccountActionModal';
import { Input } from '../../components/ui/Input';
import { MainLayout } from '../../components/layout/MainLayout';
import { getApiErrorMessage } from '../../lib/errorMessage';
import { useI18nStore, type AppLanguage } from '../../store/useI18nStore';
import { formatarMoeda } from '../../lib/formatters';

export function PerfilPage() {
  const { user, updateProfile, updateIsEmailVerificado, logout } = useAuthStore();
  const { language, setLanguage } = useI18nStore();
  const navigate = useNavigate();
  const tr = (pt: string, en: string) => (idioma === 'en-US' ? en : pt);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [nome, setNome] = useState(user?.nome || '');
  const [celular, setCelular] = useState(user?.celular || '');
  const [moeda, setMoeda] = useState(user?.moeda || 'BRL');
  const [idioma, setIdioma] = useState<AppLanguage>(language);
  const [codigo, setCodigo] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [showAccountActionModal, setShowAccountActionModal] = useState(false);

  useEffect(() => {
    if (user) {
      setNome(user.nome);
      setCelular(user.celular || '');
      setMoeda(user.moeda || 'BRL');
    }
  }, [user]);

  useEffect(() => {
    setIdioma(language);
  }, [language]);  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);  const { data: resumo, isLoading: isLoadingResumo } = useQuery({
    queryKey: ['perfil-resumo'],
    queryFn: () => PerfilService.obterResumoFinanceiro(),
    enabled: !!user,
  });  const updatePerfilMutation = useMutation({
    mutationFn: (data: UsuarioAtualizacaoRequestDTO) =>
      PerfilService.atualizarPerfil(data),
    onSuccess: (updatedUser) => {
      updateProfile(updatedUser);
      toast.success(tr('Perfil atualizado com sucesso!', 'Profile updated successfully!'), 3000);
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, tr('Nao foi possivel salvar seu perfil agora. Verifique os dados e tente novamente.', 'Could not save your profile right now. Check your data and try again.')));
    }
  });  const uploadFotoMutation = useMutation({
    mutationFn: (file: Blob) => PerfilService.atualizarFoto({ file }),
    onSuccess: () => {      PerfilService.obterPerfil().then(updatedUser => {
        updateProfile(updatedUser);
        toast.success(tr('Foto de perfil atualizada!', 'Profile photo updated!'), 3000);
      });
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, tr('Nao foi possivel enviar sua imagem de perfil. Tente novamente com outra imagem.', 'Could not upload your profile image. Try again with another image.')));
    }
  });  const ativarContaMutation = useMutation({
    mutationFn: (codigoAtivacao: string) => AutenticacaoService.verificarEmail({
      email: user?.email || '',
      codigo: codigoAtivacao
    }),
    onSuccess: () => {
      updateIsEmailVerificado(true);
      toast.success(tr('Conta ativada com sucesso!', 'Account activated successfully!'), 5000);
      setCodigo('');
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, tr('Codigo invalido ou expirado. Confira o e-mail e tente novamente.', 'Invalid or expired code. Check your email and try again.')));
    }
  });  const reenviarCodigoMutation = useMutation({
    mutationFn: () => AutenticacaoService.reenviarCodigo({
      email: user?.email || ''
    }),
    onSuccess: () => {
      setCooldown(60);
      toast.success(tr('Novo codigo enviado para seu e-mail!', 'A new code was sent to your email!'), 5000);
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, tr('Nao conseguimos reenviar o codigo agora. Tente novamente em instantes.', 'We could not resend the code right now. Please try again shortly.')));
    }
  });

  const handleUpdatePerfil = (e: React.FormEvent) => {
    e.preventDefault();
    setLanguage(idioma);

    const celularSanitizado = celular.trim();
    if (celularSanitizado && !/^\d{10,11}$/.test(celularSanitizado)) {
      toast.error(tr('Informe um celular valido com 10 ou 11 digitos.', 'Enter a valid mobile phone with 10 or 11 digits.'));
      return;
    }

    updatePerfilMutation.mutate({
      nome,
      celular: celularSanitizado || undefined,
      moeda: moeda as UsuarioAtualizacaoRequestDTO.moeda
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error(tr('A imagem deve ter no maximo 2MB.', 'Image size must be at most 2MB.'));
        return;
      }
      uploadFotoMutation.mutate(file);
    }
  };

  const handleIdiomaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const novoIdioma = e.target.value as AppLanguage;
    setIdioma(novoIdioma);
    setLanguage(novoIdioma);
  };

  const handleAccountActionSuccess = (acao: 'EXCLUIR' | 'DESATIVAR') => {
    setShowAccountActionModal(false);
    logout();
    navigate('/login');
    if (acao === 'EXCLUIR') {
      toast.success(tr('Sua conta foi excluída permanentemente.', 'Your account has been permanently deleted.'), 6000);
    } else {
      toast.info(tr('Sua conta foi desativada. Você pode reativá-la ao fazer login.', 'Your account has been deactivated. You can reactivate it by logging in.'), 6000);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-6 sm:space-y-10 animate-fade-in pb-8 sm:pb-12 px-2 sm:px-0">
        {/* Header Seção */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
          <div className="animate-in fade-in slide-in-from-left-4 duration-700">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white mb-2 uppercase italic">
              {tr('Configuracoes', 'Settings')} <span className="text-primary">{tr('do Perfil', 'Profile')}</span>
            </h1>
            <p className="text-muted-foreground font-medium">
              {tr('Personalize sua experiencia e monitore seu status financeiro global.', 'Customize your experience and monitor your overall financial status.')}
            </p>
          </div>
          
          <div className="hidden md:flex items-center gap-4 bg-white/5 border border-white/10 px-6 py-3 rounded-2xl backdrop-blur-md">
            <Coins className="text-primary" size={24} />
            <div>
              <p className="text-2xs uppercase font-bold text-muted-foreground tracking-widest">{tr('Moeda Preferencial', 'Preferred Currency')}</p>
              <p className="text-sm font-bold text-white">
                {moeda === 'BRL' && tr('Real (R$)', 'Brazilian Real (R$)')}
                {moeda === 'USD' && tr('Dolar (USD)', 'US Dollar (USD)')}
              </p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 sm:gap-8">
          
          {/* Coluna Central: Dados do Usuário e Foto */}
          <div className="xl:col-span-4 space-y-5 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="glass rounded-2xl sm:rounded-[2rem] p-5 sm:p-8 border border-white/10 relative overflow-hidden flex flex-col items-center">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-transparent opacity-50" />
              
              <div className="relative group cursor-pointer mb-6" onClick={() => fileInputRef.current?.click()}>
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-white/10 shadow-2xl relative">
                  {user?.fotoBase64 ? (
                    <img 
                      src={`data:image/png;base64,${user.fotoBase64}`} 
                      alt={user.nome} 
                      className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-secondary/50 flex items-center justify-center">
                      <UserIcon size={56} className="text-primary/70" />
                    </div>
                  )}
                  {/* Overlay Upload */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-1 backdrop-blur-sm">
                    <Camera size={24} />
                    <span className="text-2xs font-bold uppercase tracking-tighter">{tr('Alterar', 'Change')}</span>
                  </div>
                </div>
                {/* Badge Status */}
                <div className={`absolute -bottom-1 -right-1 w-10 h-10 rounded-full border-4 border-[#0a0a0a] flex items-center justify-center ${user?.isEmailVerificado ? 'bg-emerald-500' : 'bg-amber-500'}`}>
                  {user?.isEmailVerificado ? <ShieldCheck size={20} className="text-white" /> : <AlertTriangle size={20} className="text-white" />}
                </div>
              </div>

              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                className="hidden" 
              />

              <h2 className="text-xl sm:text-2xl font-black text-white text-center mb-1">{user?.nome}</h2>
              <p className="text-muted-foreground text-xs sm:text-sm flex items-center gap-2 mb-6 font-medium text-center break-all">
                <Mail size={14} className="text-primary shrink-0" /> <span className="break-all">{user?.email}</span>
              </p>

                <div className="w-full space-y-3">
                  <div className="flex flex-wrap justify-between items-center bg-white/5 rounded-2xl p-3 sm:p-4 border border-white/5 gap-2">
                    <span className="text-xs font-bold uppercase text-muted-foreground">{tr('Privacidade', 'Privacy')}</span>
                    <span className="text-white text-xs font-bold flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-emerald-500 shrink-0" /> {tr('Criptografado', 'Encrypted')}
                    </span>
                 </div>
              </div>
            </div>

            {/* Card de Ativação Se Pendente */}
            {!user?.isEmailVerificado && (
              <div className="glass rounded-2xl sm:rounded-[2rem] p-5 sm:p-8 border border-amber-500/20 bg-amber-500/5 animate-pulse-subtle">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-amber-500/20 rounded-lg">
                    <Send size={20} className="text-amber-500" />
                  </div>
                  <h3 className="font-bold text-white uppercase text-sm tracking-wider">{tr('Ativar Conta', 'Activate Account')}</h3>
                </div>
                <p className="text-xs text-amber-500/80 mb-6 font-medium leading-relaxed">
                  {tr('Insira o codigo enviado para seu e-mail para desbloquear todas as funcoes.', 'Enter the code sent to your email to unlock all features.')}
                </p>
                <form onSubmit={(e) => { e.preventDefault(); ativarContaMutation.mutate(codigo); }} className="space-y-4">
                  <Input 
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value)}
                    placeholder={tr('CODIGO', 'CODE')}
                    maxLength={6}
                    className="text-center font-black tracking-widest text-lg bg-amber-500/10 border-amber-500/30 text-amber-500"
                  />
                  <button 
                    type="submit"
                    className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-amber-950 font-black rounded-2xl transition-all uppercase tracking-widest text-xs shadow-lg shadow-amber-500/20"
                  >
                    {ativarContaMutation.isPending ? tr('Validando...', 'Validating...') : tr('Finalizar Ativacao', 'Finish Activation')}
                  </button>

                  <button
                    type="button"
                    onClick={() => reenviarCodigoMutation.mutate()}
                    disabled={reenviarCodigoMutation.isPending || cooldown > 0}
                    className="w-full text-2xs font-bold uppercase tracking-widest text-amber-500/60 hover:text-amber-500 transition-colors disabled:opacity-50"
                  >
                    {reenviarCodigoMutation.isPending ? tr('Enviando...', 'Sending...') : cooldown > 0 ? tr(`Aguarde ${cooldown}s`, `Wait ${cooldown}s`) : tr('Nao recebeu o codigo? Reenviar', 'Did not receive the code? Resend')}
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Coluna Direita: Balanço Geral e Formulário */}
          <div className="xl:col-span-8 space-y-5 sm:space-y-8 animate-in fade-in slide-in-from-right-4 duration-700 delay-200">
            
            {/* Seção Balanço Geral (Cards Premium — clicáveis) */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
               {/* Receitas */}
               <Link to="/receitas" className="glass rounded-2xl sm:rounded-3xl p-3 sm:p-5 border border-white/5 group hover:border-emerald-500/30 transition-all cursor-pointer min-w-0">
                  <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-4">
                    <div className="p-1.5 sm:p-2 bg-emerald-500/20 rounded-lg sm:rounded-xl text-emerald-500 shrink-0">
                      <ArrowUpCircle size={16} className="md:hidden" />
                      <ArrowUpCircle size={20} className="hidden md:block" />
                    </div>
                    <span className="text-2xs sm:text-2xs font-black uppercase text-muted-foreground tracking-wider sm:tracking-widest leading-tight truncate">{tr('Receitas', 'Income')}</span>
                  </div>
                  <p className="text-sm sm:text-lg xl:text-xl font-bold text-white truncate">
                    {isLoadingResumo ? '---' : formatarMoeda(resumo?.totalReceitas || 0, moeda as UsuarioAtualizacaoRequestDTO.moeda)}
                  </p>
               </Link>

               {/* Despesas */}
               <Link to="/despesas" className="glass rounded-2xl sm:rounded-3xl p-3 sm:p-5 border border-white/5 group hover:border-rose-500/30 transition-all cursor-pointer min-w-0">
                  <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-4">
                    <div className="p-1.5 sm:p-2 bg-rose-500/20 rounded-lg sm:rounded-xl text-rose-500 shrink-0">
                      <ArrowDownCircle size={16} className="md:hidden" />
                      <ArrowDownCircle size={20} className="hidden md:block" />
                    </div>
                    <span className="text-2xs sm:text-2xs font-black uppercase text-muted-foreground tracking-wider sm:tracking-widest leading-tight truncate">{tr('Despesas', 'Expenses')}</span>
                  </div>
                  <p className="text-sm sm:text-lg xl:text-xl font-bold text-white truncate">
                    {isLoadingResumo ? '---' : formatarMoeda(resumo?.totalDespesas || 0, moeda as UsuarioAtualizacaoRequestDTO.moeda)}
                  </p>
               </Link>

               {/* Saldo Contas */}
               <Link to="/contas" className="glass rounded-2xl sm:rounded-3xl p-3 sm:p-5 border border-white/5 group hover:border-primary/30 transition-all cursor-pointer min-w-0">
                  <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-4">
                    <div className="p-1.5 sm:p-2 bg-primary/20 rounded-lg sm:rounded-xl text-primary shrink-0">
                      <Wallet size={16} className="md:hidden" />
                      <Wallet size={20} className="hidden md:block" />
                    </div>
                    <span className="text-2xs sm:text-2xs font-black uppercase text-muted-foreground tracking-wider sm:tracking-widest leading-tight truncate">{tr('Saldo Atual', 'Balance')}</span>
                  </div>
                  <p className="text-sm sm:text-lg xl:text-xl font-bold text-white truncate">
                    {isLoadingResumo ? '---' : formatarMoeda(resumo?.saldoContas || 0, moeda as UsuarioAtualizacaoRequestDTO.moeda)}
                  </p>
               </Link>

               {/* Investimentos */}
               <Link to="/investimentos" className="glass rounded-2xl sm:rounded-3xl p-3 sm:p-5 border border-white/5 group hover:border-amber-500/30 transition-all cursor-pointer min-w-0">
                  <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-4">
                    <div className="p-1.5 sm:p-2 bg-amber-500/20 rounded-lg sm:rounded-xl text-amber-500 shrink-0">
                      <TrendingUp size={16} className="md:hidden" />
                      <TrendingUp size={20} className="hidden md:block" />
                    </div>
                    <span className="text-2xs sm:text-2xs font-black uppercase text-muted-foreground tracking-wider sm:tracking-widest leading-tight truncate">{tr('Investido', 'Invested')}</span>
                  </div>
                  <p className="text-sm sm:text-lg xl:text-xl font-bold text-white truncate">
                    {isLoadingResumo ? '---' : formatarMoeda(resumo?.totalInvestido || 0, moeda as UsuarioAtualizacaoRequestDTO.moeda)}
                  </p>
               </Link>
            </section>

            {/* Formulário de Edição */}
            <div className="glass rounded-2xl sm:rounded-[2rem] p-5 sm:p-8 lg:p-10 border border-white/10 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
               
              <form onSubmit={handleUpdatePerfil} className="relative z-10 space-y-6 sm:space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-8">
                    <div className="space-y-2">
                        <label className="text-2xs font-black uppercase text-muted-foreground tracking-[0.2em] ml-1">{tr('Nome Completo', 'Full Name')}</label>
                       <div className="relative">
                          <UserIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                          <input 
                             value={nome}
                             onChange={(e) => setNome(e.target.value)}
                             className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white font-bold focus:border-primary/50 outline-none transition-all"
                              placeholder={tr('Seu nome', 'Your name')}
                          />
                       </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-2xs font-black uppercase text-muted-foreground tracking-[0.2em] ml-1">{tr('Telefone Celular', 'Mobile Phone')}</label>
                       <div className="relative">
                          <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                          <input 
                             value={celular}
                             onChange={(e) => setCelular(e.target.value.replace(/\D/g, ''))}
                             className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white font-bold focus:border-primary/50 outline-none transition-all tracking-widest"
                              placeholder={tr('Apenas numeros', 'Numbers only')}
                             maxLength={11}
                          />
                       </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-8">
                    <div className="space-y-2">
                        <label className="text-2xs font-black uppercase text-muted-foreground tracking-[0.2em] ml-1">{tr('Sistema de Moeda', 'Currency System')}</label>
                       <div className="relative">
                          <Coins size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                          <select
                             value={moeda}
                             onChange={(e) => setMoeda(e.target.value as UsuarioAtualizacaoRequestDTO.moeda)}
                             className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white font-bold focus:border-primary/50 outline-none transition-all appearance-none"
                          >
                              <option value="BRL" className="bg-slate-900">{tr('Real Brasileiro (R$)', 'Brazilian Real (R$)')}</option>
                              <option value="USD" className="bg-slate-900">{tr('Dolar Americano (US$)', 'US Dollar (US$)')}</option>
                          </select>
                       </div>
                    </div>

                      <div className="space-y-2">
                        <label className="text-2xs font-black uppercase text-muted-foreground tracking-[0.2em] ml-1">{tr('Idioma da Interface', 'Interface Language')}</label>
                        <div className="relative">
                          <select
                            value={idioma}
                              onChange={handleIdiomaChange}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 text-white font-bold focus:border-primary/50 outline-none transition-all appearance-none"
                          >
                            <option value="pt-BR" className="bg-slate-900">{tr('Portugues (Brasil)', 'Portuguese (Brazil)')}</option>
                            <option value="en-US" className="bg-slate-900">English (US)</option>
                          </select>
                        </div>
                      </div>
                  </div>

                  <div className="pt-2">
                     <button
                        type="submit"
                        disabled={updatePerfilMutation.isPending}
                        className="w-full py-4 bg-primary hover:bg-primary/80 text-white font-black rounded-2xl transition-all uppercase tracking-widest text-sm shadow-xl shadow-primary/20 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                     >
                      {updatePerfilMutation.isPending ? tr('Salvando...', 'Saving...') : tr('Salvar Alteracoes', 'Save Changes')}
                     </button>
                  </div>
               </form>
            </div>

          </div>
        </div>

        {/* Zona de Perigo */}
        <section className="glass rounded-2xl sm:rounded-[2rem] p-5 sm:p-8 border border-rose-500/20 bg-rose-500/5 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-500/20 rounded-xl border border-rose-500/20 shrink-0">
                <ShieldAlert className="text-rose-500 w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-white uppercase text-sm tracking-wider">
                  {tr('Zona de Perigo', 'Danger Zone')}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {tr(
                    'Desativar ou excluir sua conta são ações que requerem confirmação por e-mail.',
                    'Deactivating or deleting your account requires email confirmation.'
                  )}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowAccountActionModal(true)}
              className="shrink-0 px-5 py-3 bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20 hover:border-rose-500/60 text-rose-500 font-black rounded-2xl transition-all uppercase tracking-widest text-xs active:scale-95"
            >
              {tr('Gerenciar Conta', 'Manage Account')}
            </button>
          </div>
        </section>
      </div>

      <AccountActionModal
        isOpen={showAccountActionModal}
        onClose={() => setShowAccountActionModal(false)}
        onSuccess={handleAccountActionSuccess}
      />
    </MainLayout>
  );
}
