import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Circle, ArrowRight, Wallet, CreditCard, Tag, TrendingUp, TrendingDown, Target, ShieldCheck, Compass } from 'lucide-react';
import { MainLayout } from '../../components/layout/MainLayout';
import { useAuthStore } from '../../store/useAuthStore';
import { useI18nStore } from '../../store/useI18nStore';
import { ContasService } from '../../api/services/ContasService';
import { CartoesService } from '../../api/services/CartoesService';
import { CategoriasService } from '../../api/services/CategoriasService';
import { TransacoesService } from '../../api/services/TransacoesService';
import { TransacaoResponseDTO } from '../../api/models/TransacaoResponseDTO';
import { investimentosApi } from '../../lib/investimentosApi';

type TutorialStep = {
  id: string;
  title: string;
  description: string;
  route: string;
  completed: boolean;
  optional?: boolean;
};

const ensureArray = <T,>(value: unknown): T[] => {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === 'object' && Array.isArray((value as any).content)) {
    return (value as any).content as T[];
  }
  return [];
};

export const TutorialPage = () => {
  const language = useI18nStore((s) => s.language);
  const tr = (pt: string, en: string) => (language === 'en-US' ? en : pt);
  const user = useAuthStore((s) => s.user);

  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = hoje.getMonth() + 1;

  const { data: contasRaw = [] } = useQuery({
    queryKey: ['tutorial-contas'],
    queryFn: () => ContasService.listarContas(),
  });

  const { data: cartoesRaw = [] } = useQuery({
    queryKey: ['tutorial-cartoes'],
    queryFn: () => CartoesService.listarCartoes(),
  });

  const { data: categoriasRaw = [] } = useQuery({
    queryKey: ['tutorial-categorias'],
    queryFn: () => CategoriasService.listarCategorias(),
  });

  const { data: transacoesRaw = [] } = useQuery({
    queryKey: ['tutorial-transacoes', ano, mes],
    queryFn: () => TransacoesService.listarPaginado({}) as Promise<any>,
  });

  const { data: investimentosRaw = [] } = useQuery({
    queryKey: ['tutorial-investimentos'],
    queryFn: () => investimentosApi.listar(),
  });

  const contas = ensureArray<any>(contasRaw);
  const cartoes = ensureArray<any>(cartoesRaw);
  const categorias = ensureArray<any>(categoriasRaw);
  const transacoes = ensureArray<any>(transacoesRaw);
  const investimentos = ensureArray<any>(investimentosRaw);

  const transacoesSemTransferencias = transacoes.filter((t) => !t.isTransferencia);
  const receitas = transacoesSemTransferencias.filter((t) => t.tipo === TransacaoResponseDTO.tipo.RECEITA);
  const despesas = transacoesSemTransferencias.filter((t) => t.tipo === TransacaoResponseDTO.tipo.DESPESA);

  const possuiSaldoInicialDefinido = contas.length > 0 && contas.every((c) => c.saldo !== null && c.saldo !== undefined);
  const possuiMetaInvestimento = investimentos.some((i) => i.metaAtual !== null && i.metaAtual !== undefined && Number(i.metaAtual) > 0);

  const steps: TutorialStep[] = [
    {
      id: 'verificacao',
      title: tr('Verifique seu e-mail', 'Verify your email'),
      description: tr('Confirme sua conta para liberar todas as funcionalidades do sistema.', 'Confirm your account to unlock all system features.'),
      route: '/perfil',
      completed: Boolean(user?.isEmailVerificado),
    },
    {
      id: 'conta',
      title: tr('Cadastre sua primeira conta', 'Add your first account'),
      description: tr('Adicione cada banco/carteira que você usa no dia a dia.', 'Add each bank account/wallet you use daily.'),
      route: '/contas',
      completed: contas.length > 0,
    },
    {
      id: 'saldo-inicial',
      title: tr('Defina o saldo inicial de cada conta', 'Set the initial balance of each account'),
      description: tr('Use o saldo real atual de cada conta para começar com um painel fiel à sua realidade.', 'Use each account current real balance to start with an accurate dashboard.'),
      route: '/contas',
      completed: possuiSaldoInicialDefinido,
    },
    {
      id: 'categorias',
      title: tr('Organize categorias', 'Organize categories'),
      description: tr('Crie ou ajuste categorias para manter seus relatórios mais claros.', 'Create or adjust categories to keep reports clear.'),
      route: '/categorias',
      completed: categorias.length >= 3,
    },
    {
      id: 'receita',
      title: tr('Registre sua primeira receita', 'Register your first income'),
      description: tr('Exemplo: salário, freelas, renda extra, reembolsos.', 'Examples: salary, freelance, side income, reimbursements.'),
      route: '/receitas',
      completed: receitas.length > 0,
    },
    {
      id: 'despesa',
      title: tr('Registre sua primeira despesa', 'Register your first expense'),
      description: tr('Inclua gastos fixos e variáveis para o sistema começar a gerar insights.', 'Include fixed and variable expenses so the system can generate insights.'),
      route: '/despesas',
      completed: despesas.length > 0,
    },
    {
      id: 'cartao',
      title: tr('Cadastre cartões de crédito (opcional)', 'Add credit cards (optional)'),
      description: tr('Se usar cartão, cadastre limite, fechamento e vencimento para controlar faturas automaticamente.', 'If you use cards, register limit, closing and due dates to track invoices automatically.'),
      route: '/cartoes',
      completed: cartoes.length > 0,
      optional: true,
    },
    {
      id: 'investimento',
      title: tr('Crie seu primeiro investimento e meta', 'Create your first investment and goal'),
      description: tr('Defina meta e acompanhe evolução do valor investido com aportes e resgates.', 'Set a goal and track invested value with deposits and withdrawals.'),
      route: '/investimentos',
      completed: investimentos.length > 0 && possuiMetaInvestimento,
    },
  ];

  const obrigatorios = steps.filter((s) => !s.optional);
  const concluidosObrigatorios = obrigatorios.filter((s) => s.completed).length;
  const progresso = obrigatorios.length > 0 ? Math.round((concluidosObrigatorios / obrigatorios.length) * 100) : 0;

  return (
    <MainLayout>
      <div className="p-3 sm:p-4 lg:p-6 space-y-6 animate-in fade-in duration-500">
        <header className="glass rounded-2xl p-4 sm:p-6 border border-white/10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {tr('Primeiros Passos no Equilibra', 'Getting Started in Equilibra')}
              </h1>
              <p className="text-sm text-muted-foreground mt-2 max-w-3xl">
                {tr('Siga este onboarding para configurar tudo com segurança: saldo inicial correto, lançamentos consistentes e visão completa no dashboard.', 'Follow this onboarding to set everything up safely: accurate initial balances, consistent transactions and a complete dashboard view.')}
              </p>
            </div>
            <div className="glass rounded-xl p-4 border border-primary/20 min-w-[200px]">
              <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground">{tr('Progresso', 'Progress')}</p>
              <p className="text-2xl font-black text-primary mt-1">{progresso}%</p>
              <div className="w-full h-2 bg-white/10 rounded-full mt-2 overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progresso}%` }} />
              </div>
            </div>
          </div>
        </header>

        <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {steps.map((step) => (
            <div key={step.id} className="glass rounded-2xl p-4 border border-white/10">
              <div className="flex items-start gap-3">
                <div className="pt-0.5">
                  {step.completed ? (
                    <CheckCircle2 size={20} className="text-emerald-400" />
                  ) : (
                    <Circle size={20} className="text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm sm:text-base font-bold text-white">{step.title}</h3>
                    {step.optional && (
                      <span className="text-[10px] uppercase tracking-wide font-bold px-2 py-0.5 rounded bg-white/10 text-muted-foreground">
                        {tr('Opcional', 'Optional')}
                      </span>
                    )}
                    {step.completed && (
                      <span className="text-[10px] uppercase tracking-wide font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400">
                        {tr('Concluído', 'Done')}
                      </span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-2 leading-relaxed">{step.description}</p>
                  <Link
                    to={step.route}
                    className="inline-flex items-center gap-2 text-xs sm:text-sm mt-3 font-bold text-primary hover:underline"
                  >
                    {tr('Ir para etapa', 'Go to step')} <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="glass rounded-2xl p-4 border border-white/10">
            <div className="flex items-center gap-2 text-primary">
              <Wallet size={18} />
              <h3 className="font-bold text-white text-sm">{tr('Como definir saldo inicial', 'How to set initial balance')}</h3>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-3 leading-relaxed">
              {tr('Informe o saldo real de cada conta no momento do cadastro. Inclua apenas dinheiro disponível (conta corrente, poupança, carteira), sem somar limite de cartão.', 'Enter each account real current balance at registration time. Include only available money (checking, savings, wallet), without adding card limit.')}
            </p>
          </div>

          <div className="glass rounded-2xl p-4 border border-white/10">
            <div className="flex items-center gap-2 text-primary">
              <Target size={18} />
              <h3 className="font-bold text-white text-sm">{tr('Investimento e meta na prática', 'Investments and goals in practice')}</h3>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-3 leading-relaxed">
              {tr('Crie um investimento, escolha a conta de origem e defina uma meta. Aportes aumentam o valor investido; resgates reduzem. O progresso da meta aparece automaticamente.', 'Create an investment, choose the source account and set a goal. Deposits increase invested value; withdrawals reduce it. Goal progress is shown automatically.')}
            </p>
          </div>

          <div className="glass rounded-2xl p-4 border border-white/10">
            <div className="flex items-center gap-2 text-primary">
              <Compass size={18} />
              <h3 className="font-bold text-white text-sm">{tr('Fluxo recomendado', 'Recommended flow')}</h3>
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground mt-3 space-y-2 leading-relaxed">
              <p className="flex items-center gap-2"><ShieldCheck size={14} className="text-emerald-400" /> {tr('Conta e e-mail verificado', 'Account and verified email')}</p>
              <p className="flex items-center gap-2"><Wallet size={14} className="text-emerald-400" /> {tr('Contas e saldo inicial', 'Accounts and initial balance')}</p>
              <p className="flex items-center gap-2"><Tag size={14} className="text-emerald-400" /> {tr('Categorias', 'Categories')}</p>
              <p className="flex items-center gap-2"><TrendingUp size={14} className="text-emerald-400" /> {tr('Receitas', 'Income')}</p>
              <p className="flex items-center gap-2"><TrendingDown size={14} className="text-emerald-400" /> {tr('Despesas', 'Expenses')}</p>
              <p className="flex items-center gap-2"><CreditCard size={14} className="text-emerald-400" /> {tr('Cartões (se usar)', 'Cards (if you use them)')}</p>
              <p className="flex items-center gap-2"><Target size={14} className="text-emerald-400" /> {tr('Investimentos e metas', 'Investments and goals')}</p>
            </div>
          </div>
        </section>
      </div>
    </MainLayout>
  );
};
