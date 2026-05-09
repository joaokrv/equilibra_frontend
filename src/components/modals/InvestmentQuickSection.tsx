import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Target } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input, Select } from '../ui/Input';
import { toast } from '../../store/useToastStore';
import { getApiErrorMessage } from '../../lib/errorMessage';
import { useI18nStore } from '../../store/useI18nStore';
import { ContasService } from '../../api';
import { investimentosApi, type InvestimentoItem } from '../../lib/investimentosApi';

const tr = (language: 'pt-BR' | 'en-US', pt: string, en: string) =>
  language === 'en-US' ? en : pt;

const ensureArray = <T,>(value: unknown): T[] => {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === 'object' && Array.isArray((value as any).content)) {
    return (value as any).content as T[];
  }
  return [];
};

const buildQuickInvestmentSchema = (language: 'pt-BR' | 'en-US') =>
  z.object({
    investimentoId: z.string().min(1, tr(language, 'Selecione um investimento', 'Select an investment')),
    operacao: z.enum(['APORTE', 'RESGATE']),
    valor: z
      .string()
      .min(1, tr(language, 'Valor é obrigatório', 'Amount is required'))
      .refine((v) => !Number.isNaN(Number(v)) && Number(v) > 0, tr(language, 'Valor deve ser positivo', 'Amount must be positive')),
    contaId: z.string().min(1, tr(language, 'Selecione uma conta', 'Select an account')),
  });

type QuickInvestmentFormValues = z.infer<ReturnType<typeof buildQuickInvestmentSchema>>;

interface InvestmentQuickSectionProps {
  onSuccess?: () => void;
  onCancel: () => void;
}

export const InvestmentQuickSection = ({ onSuccess, onCancel }: InvestmentQuickSectionProps) => {
  const queryClient = useQueryClient();
  const language = useI18nStore((state) => state.language);
  const schema = useMemo(() => buildQuickInvestmentSchema(language), [language]);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<QuickInvestmentFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      investimentoId: '',
      operacao: 'APORTE',
      valor: '',
      contaId: '',
    },
  });

  const operacao = watch('operacao');

  const { data: investimentosRaw = [], isLoading: isLoadingInvestimentos } = useQuery({
    queryKey: ['investimentos'],
    queryFn: () => investimentosApi.listar(),
  });

  const { data: contasRaw = [], isLoading: isLoadingContas } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => ContasService.listarContas(),
  });

  const investimentos = ensureArray<InvestimentoItem>(investimentosRaw);
  const contas = ensureArray<any>(contasRaw);

  const invalidarCaches = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['investimentos'] }),
      queryClient.invalidateQueries({ queryKey: ['accounts'] }),
      queryClient.invalidateQueries({ queryKey: ['transactions'] }),
      queryClient.invalidateQueries({ queryKey: ['transacoes'] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] }),
      queryClient.invalidateQueries({ queryKey: ['patrimony-evolution'] }),
    ]);
  };

  const mutation = useMutation({
    mutationFn: async (values: QuickInvestmentFormValues) => {
      const investimentoId = Number(values.investimentoId);
      const valor = Number(values.valor);
      const contaId = Number(values.contaId);

      if (values.operacao === 'APORTE') {
        return investimentosApi.depositar(investimentoId, valor, contaId);
      }

      return investimentosApi.resgatar(investimentoId, valor, contaId);
    },
    onSuccess: async () => {
      await invalidarCaches();
      toast.success(tr(language, 'Movimentação de investimento registrada.', 'Investment movement recorded.'));
      reset({ investimentoId: '', operacao: 'APORTE', valor: '', contaId: '' });
      onSuccess?.();
      onCancel();
    },
    onError: (error: unknown) => {
      toast.error(
        getApiErrorMessage(
          error,
          tr(
            language,
            'Não foi possível concluir a movimentação do investimento. Verifique os dados e tente novamente.',
            'Could not complete the investment movement. Check the data and try again.',
          ),
        ),
      );
    },
  });

  const onSubmit = (values: QuickInvestmentFormValues) => {
    mutation.mutate(values);
  };

  const investimentoOptions = [
    { label: tr(language, 'Selecione o Investimento', 'Select Investment'), value: '' },
    ...investimentos.map((investimento) => ({
      label: investimento.descricao || tr(language, 'Investimento sem nome', 'Unnamed investment'),
      value: String(investimento.id),
    })),
  ];

  const contaOptions = [
    { label: tr(language, 'Selecione a Conta', 'Select Account'), value: '' },
    ...contas.map((conta) => ({
      label: conta.nome,
      value: String(conta.id),
    })),
  ];

  const contaLabel = operacao === 'APORTE'
    ? tr(language, 'Conta de origem', 'Source account')
    : tr(language, 'Conta de destino', 'Destination account');

  const submitLabel = operacao === 'APORTE'
    ? tr(language, 'Registrar aporte', 'Register deposit')
    : tr(language, 'Registrar resgate', 'Register withdrawal');

  return (
    <section className="space-y-5">
      <div className="rounded-2xl border border-white/5 bg-secondary/20 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Target size={18} />
          </div>
          <div>
            <h4 className="text-sm sm:text-base font-bold text-white">
              {tr(language, 'Movimentação de investimento', 'Investment movement')}
            </h4>
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {tr(
                language,
                'Use este fluxo para aportes e resgates sem inflar receitas ou despesas.',
                'Use this flow for deposits and withdrawals without inflating income or expenses.',
              )}
            </p>
          </div>
        </div>
      </div>

      {investimentos.length === 0 ? (
        <div className="rounded-2xl border border-white/5 bg-background/40 p-5 text-center">
          <p className="text-sm font-medium text-muted-foreground">
            {tr(
              language,
              'Ainda não existem investimentos cadastrados para movimentar.',
              'There are no investments registered yet to move money into.',
            )}
          </p>
          <p className="mt-2 text-xs text-muted-foreground/80">
            {tr(
              language,
              'Cadastre um investimento na página de investimentos e volte aqui para registrar aporte ou resgate.',
              'Create an investment on the investments page and come back here to register deposits or withdrawals.',
            )}
          </p>
          <Link
            to="/investimentos"
            className="mt-4 inline-flex items-center justify-center rounded-xl border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/20"
          >
            {tr(language, 'Ir para investimentos', 'Go to investments')}
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setValue('operacao', 'APORTE')}
              className={`rounded-xl border px-4 py-3 text-xs font-bold uppercase tracking-widest transition-all ${
                operacao === 'APORTE'
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 shadow-lg shadow-emerald-500/10'
                  : 'border-transparent bg-secondary/20 text-muted-foreground hover:text-white'
              }`}
            >
              {tr(language, 'Aporte', 'Deposit')}
            </button>
            <button
              type="button"
              onClick={() => setValue('operacao', 'RESGATE')}
              className={`rounded-xl border px-4 py-3 text-xs font-bold uppercase tracking-widest transition-all ${
                operacao === 'RESGATE'
                  ? 'border-sky-500 bg-sky-500/10 text-sky-400 shadow-lg shadow-sky-500/10'
                  : 'border-transparent bg-secondary/20 text-muted-foreground hover:text-white'
              }`}
            >
              {tr(language, 'Resgate', 'Withdraw')}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              {...register('investimentoId')}
              label={tr(language, 'Investimento ativo', 'Active investment')}
              id="quick-investment"
              options={investimentoOptions}
              error={errors.investimentoId?.message}
            />
            <Select
              {...register('contaId')}
              label={contaLabel}
              id="quick-investment-account"
              options={contaOptions}
              error={errors.contaId?.message}
            />
          </div>

          <Input
            {...register('valor')}
            label={tr(language, 'Valor', 'Amount')}
            id="quick-investment-valor"
            type="number"
            step="0.01"
            placeholder={tr(language, '0,00', '0.00')}
            error={errors.valor?.message}
          />

          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1"
            >
              {tr(language, 'DESCARTAR', 'DISCARD')}
            </Button>
            <Button
              type="submit"
              isLoading={mutation.isPending || isLoadingInvestimentos || isLoadingContas}
              className="flex-1"
            >
              {submitLabel}
            </Button>
          </div>
        </form>
      )}
    </section>
  );
};
