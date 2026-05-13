import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { X, ReceiptText, Target } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '../ui/Button';
import { Input, Select } from '../ui/Input';
import { toast } from '../../store/useToastStore';
import { getApiErrorMessage } from '../../lib/errorMessage';
import { useI18nStore } from '../../store/useI18nStore';
import { InvestmentQuickSection } from './InvestmentQuickSection';
import {
  TransacoesService,
  ContasService,
  CartoesService,
  CategoriasService,
} from '../../api';
import type { TransacaoResponseDTO } from '../../api/models/TransacaoResponseDTO';

type ModalSection = 'receita' | 'despesa' | 'investimento';
type TipoFixo = 'RECEITA' | 'DESPESA';

const tr = (language: 'pt-BR' | 'en-US', pt: string, en: string) =>
  language === 'en-US' ? en : pt;

const inferSectionFromTipo = (tipo?: string | null): ModalSection =>
  tipo === 'RECEITA' ? 'receita' : 'despesa';

const getTipoDaSection = (section: ModalSection): TipoFixo | undefined => {
  if (section === 'receita') return 'RECEITA';
  if (section === 'despesa') return 'DESPESA';
  return undefined;
};

const buildTransactionSchema = (language: 'pt-BR' | 'en-US') =>
  z.object({
    descricao: z.string().min(3, tr(language, 'Descrição muito curta', 'Description is too short')),
    valor: z
      .string()
      .min(1, tr(language, 'Valor é obrigatório', 'Amount is required'))
      .refine((v) => !isNaN(Number(v)) && Number(v) > 0, tr(language, 'Valor deve ser positivo', 'Amount must be positive')),
    data: z.string().min(1, tr(language, 'Data é obrigatória', 'Date is required')),
    tipo: z.enum(['RECEITA', 'DESPESA']),
    status: z.enum(['PAGO', 'PENDENTE']),
    metodoPagamento: z.enum([
      'PIX', 'BOLETO', 'CARTAO_CREDITO', 'DINHEIRO', 'TRANSFERENCIA',
      'CARTAO_DEBITO', 'VALE_ALIMENTACAO',
    ]),
    contaId: z.string().optional(),
    cartaoId: z.string().optional(),
    categoriaId: z.string().min(1, tr(language, 'Selecione uma categoria', 'Select a category')),
    numeroParcela: z.string().optional(),
    totalParcelas: z.string().optional(),
    idempotencyKey: z.string().min(1),
  });

type TransactionFormValues = z.infer<ReturnType<typeof buildTransactionSchema>>;

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  transacaoParaEditar?: TransacaoResponseDTO;
  defaultTipo?: TipoFixo;
  tipoFixo?: TipoFixo;
  initialSection?: ModalSection;
  allowSectionSwitch?: boolean;
}

export const TransactionModal = ({
  isOpen,
  onClose,
  onSuccess,
  transacaoParaEditar,
  defaultTipo,
  tipoFixo,
  initialSection = 'despesa',
  allowSectionSwitch = true,
}: TransactionModalProps) => {
  const queryClient = useQueryClient();
  const isEditMode = !!transacaoParaEditar;
  const language = useI18nStore((state) => state.language);
  const [activeSection, setActiveSection] = useState<ModalSection>(initialSection);
  const schema = useMemo(() => buildTransactionSchema(language), [language]);
  const tipoInicial = tipoFixo ?? defaultTipo ?? getTipoDaSection(initialSection) ?? 'DESPESA';

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    reset,
    formState: { errors },
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      tipo: tipoInicial,
      status: 'PAGO',
      metodoPagamento: 'PIX',
      data: new Date().toISOString().split('T')[0],
      numeroParcela: '1',
      totalParcelas: '1',
      idempotencyKey: '',
    },
  });

  const tipo = watch('tipo');
  const metodo = watch('metodoPagamento');

  useEffect(() => {
    if (isOpen) {
      setActiveSection(isEditMode ? inferSectionFromTipo(transacaoParaEditar?.tipo) : initialSection);
    }
  }, [isOpen, isEditMode, initialSection, transacaoParaEditar]);

  useEffect(() => {
    if (tipoFixo) {
      setValue('tipo', tipoFixo);
      return;
    }

    if (activeSection === 'receita') {
      setValue('tipo', 'RECEITA');
    } else if (activeSection === 'despesa') {
      setValue('tipo', 'DESPESA');
    }
  }, [activeSection, setValue, tipoFixo]);
  useEffect(() => {
    const currentStatus = getValues('status');
    if (metodo === 'CARTAO_CREDITO' && currentStatus !== 'PENDENTE') {
      setValue('status', 'PENDENTE');
    } else if (metodo !== 'CARTAO_CREDITO' && currentStatus === 'PENDENTE') {
      setValue('status', 'PAGO');
    }
  }, [metodo, getValues, setValue]);
  useEffect(() => {
    if (!isOpen) return;

    if (isEditMode && transacaoParaEditar) {
      setValue('descricao', transacaoParaEditar.descricao ?? '');
      setValue('valor', String(transacaoParaEditar.valor ?? ''));
      setValue('data', transacaoParaEditar.data ?? new Date().toISOString().split('T')[0]);
      setValue('tipo', (transacaoParaEditar.tipo as any) ?? 'DESPESA');
      setValue('status', (transacaoParaEditar.status as any) ?? 'PAGO');
      setValue('metodoPagamento', (transacaoParaEditar.metodoPagamento as any) ?? 'PIX');
      setValue('categoriaId', transacaoParaEditar.categoriaId ? String(transacaoParaEditar.categoriaId) : '');
      setValue('contaId', transacaoParaEditar.contaId ? String(transacaoParaEditar.contaId) : '');
      setValue('cartaoId', transacaoParaEditar.cartaoId ? String(transacaoParaEditar.cartaoId) : '');
      setValue('numeroParcela', transacaoParaEditar.numeroParcela ? String(transacaoParaEditar.numeroParcela) : '1');
      setValue('totalParcelas', transacaoParaEditar.totalParcelas ? String(transacaoParaEditar.totalParcelas) : '1');
      setValue('idempotencyKey', uuidv4());
    } else {
      reset({
        tipo: tipoInicial,
        status: 'PAGO',
        metodoPagamento: 'PIX',
        data: new Date().toISOString().split('T')[0],
        numeroParcela: '1',
        totalParcelas: '1',
        idempotencyKey: uuidv4(),
      });
    }
  }, [isOpen, isEditMode, transacaoParaEditar, setValue, reset, tipoInicial]);

  // ─── Queries Dinâmicas ────────────────────────────────────────────
  const { data: contas = [] } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => ContasService.listarContas(),
    enabled: isOpen && activeSection !== 'investimento',
  });

  const { data: cartoes = [] } = useQuery({
    queryKey: ['cards'],
    queryFn: () => CartoesService.listarCartoes(),
    enabled: isOpen && activeSection !== 'investimento',
  });

  const { data: categorias = [] } = useQuery({
    queryKey: ['categories', tipo],
    queryFn: () => CategoriasService.listarCategorias(tipo),
    enabled: isOpen && activeSection !== 'investimento',
  });

  // ─── Mutation: Criar ──────────────────────────────────────────────
  const criarMutation = useMutation({
    mutationFn: (payload: any) => TransacoesService.criarTransacao(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['transacoes'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      queryClient.invalidateQueries({ queryKey: ['patrimony-evolution'] });
      onSuccess?.();
      reset();
      onClose();
    },
    onError: (error: unknown) => {
      const errorStatus = typeof error === 'object' && error !== null && 'status' in error
        ? (error as { status?: number }).status
        : undefined;
      const message = getApiErrorMessage(
        error,
        tr(language, 'Não foi possível registrar o lançamento. Revise os dados e tente novamente.', 'Could not save the entry. Review the data and try again.'),
      );
      if (errorStatus === 409) {
        toast.warning(tr(language, 'Este lançamento já foi processado.', 'This entry has already been processed.'));
      } else {
        toast.error(message);
      }
    },
  });

  // ─── Mutation: Atualizar ──────────────────────────────────────────
  const atualizarMutation = useMutation({
    mutationFn: (payload: any) => TransacoesService.atualizarTransacao(transacaoParaEditar!.id!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['transacoes'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      queryClient.invalidateQueries({ queryKey: ['patrimony-evolution'] });
      toast.success(tr(language, 'Lançamento atualizado com sucesso!', 'Entry updated successfully!'));
      onSuccess?.();
      reset();
      onClose();
    },
    onError: (error: unknown) => {
      toast.error(
        getApiErrorMessage(
          error,
          tr(
            language,
            'Não foi possível salvar a edição do lançamento. Revise os dados e tente novamente.',
            'Could not save the entry changes. Review the data and try again.',
          ),
        ),
      );
    },
  });

  const onTransactionSubmit = (data: TransactionFormValues) => {
    let finalContaId = data.contaId ? Number(data.contaId) : undefined;
    let finalCartaoId = data.cartaoId ? Number(data.cartaoId) : undefined;

    if (data.metodoPagamento === 'CARTAO_CREDITO') {
      finalContaId = undefined;
    } else {
      finalCartaoId = undefined;
      data.numeroParcela = undefined;
      data.totalParcelas = undefined;
    }

    const payload = {
      ...data,
      valor: Number(data.valor),
      contaId: finalContaId,
      cartaoId: finalCartaoId,
      categoriaId: Number(data.categoriaId),
      numeroParcela: data.numeroParcela ? Number(data.numeroParcela) : undefined,
      totalParcelas: data.totalParcelas ? Number(data.totalParcelas) : undefined,
    };

    if (isEditMode) {
      atualizarMutation.mutate(payload);
    } else {
      criarMutation.mutate(payload);
    }
  };

  if (!isOpen) return null;

  const isInvestmentSection = activeSection === 'investimento' && !isEditMode;
  const showSectionSwitch = allowSectionSwitch && !isEditMode;
  const isPending = criarMutation.isPending || atualizarMutation.isPending;
  const headerTitle = isEditMode
    ? tr(language, 'Editar Lançamento', 'Edit Entry')
    : isInvestmentSection
      ? tr(language, 'Movimentação de Investimento', 'Investment Movement')
      : activeSection === 'receita'
        ? tr(language, 'Nova Receita', 'New Income')
        : activeSection === 'despesa'
          ? tr(language, 'Nova Despesa', 'New Expense')
          : tr(language, 'Novo Lançamento', 'New Entry');
  const headerDescription = isEditMode
    ? tr(language, 'Atualize os dados do lançamento', 'Update the entry data')
    : isInvestmentSection
      ? tr(language, 'Aporte ou resgate sem inflar receitas nem despesas.', 'Deposit or withdraw without inflating income or expenses.')
      : activeSection === 'receita'
        ? tr(language, 'Registre suas entradas com o contexto da tela.', 'Register your income with the page context.')
        : activeSection === 'despesa'
          ? tr(language, 'Registre seus gastos com o contexto da tela.', 'Register your expenses with the page context.')
          : tr(language, 'Controle sua saúde financeira', 'Track your financial health');

  // ─── Opções dinâmicas para os selects ─────────────────────────────
  const contaOptions = [
    { label: tr(language, 'Selecione a Conta', 'Select Account'), value: '' },
    ...(contas as any[]).map((c: any) => ({
      label: c.nome,
      value: String(c.id),
    })),
  ];

  const cartaoOptions = [
    { label: tr(language, 'Selecione o Cartão', 'Select Card'), value: '' },
    ...(cartoes as any[]).map((c: any) => ({
      label: c.nome,
      value: String(c.id),
    })),
  ];

  const categoriaOptions = [
    { label: tr(language, 'Selecione a Categoria', 'Select Category'), value: '' },
    ...(categorias as any[]).map((c: any) => ({
      label: c.nome,
      value: String(c.id),
    })),
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-2 sm:items-center sm:p-4 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />

      <div className="glass relative z-10 w-full max-w-xl max-h-[94dvh] overflow-y-auto rounded-2xl p-4 sm:rounded-3xl sm:p-8 animate-in zoom-in-95 duration-300">
        <div className="mb-6 flex items-start justify-between gap-3 sm:mb-8 sm:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary sm:h-12 sm:w-12 sm:rounded-2xl">
              {isInvestmentSection ? <Target size={20} /> : <ReceiptText size={20} />}
            </div>
            <div>
              <h3 className="text-lg font-bold leading-tight text-white sm:text-xl">
                {headerTitle}
              </h3>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                {headerDescription}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-muted-foreground transition-all hover:bg-white/5 hover:text-white"
            aria-label={tr(language, 'Fechar modal', 'Close modal')}
          >
            <X size={20} />
          </button>
        </div>

        {showSectionSwitch && (
          <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <button
              type="button"
              onClick={() => setActiveSection('receita')}
              className={`rounded-xl border px-4 py-3 text-xs font-bold uppercase tracking-widest transition-all ${
                activeSection === 'receita'
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500 shadow-lg shadow-emerald-500/10'
                  : 'border-transparent bg-secondary/20 text-muted-foreground hover:text-white'
              }`}
            >
              {tr(language, 'Receita', 'Income')}
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('despesa')}
              className={`rounded-xl border px-4 py-3 text-xs font-bold uppercase tracking-widest transition-all ${
                activeSection === 'despesa'
                  ? 'border-rose-500 bg-rose-500/10 text-rose-500 shadow-lg shadow-rose-500/10'
                  : 'border-transparent bg-secondary/20 text-muted-foreground hover:text-white'
              }`}
            >
              {tr(language, 'Despesa', 'Expense')}
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('investimento')}
              className={`rounded-xl border px-4 py-3 text-xs font-bold uppercase tracking-widest transition-all ${
                activeSection === 'investimento'
                  ? 'border-sky-500 bg-sky-500/10 text-sky-400 shadow-lg shadow-sky-500/10'
                  : 'border-transparent bg-secondary/20 text-muted-foreground hover:text-white'
              }`}
            >
              {tr(language, 'Investimento', 'Investment')}
            </button>
          </div>
        )}

        {isInvestmentSection ? (
          <InvestmentQuickSection onCancel={onClose} onSuccess={onSuccess} />
        ) : (
          <form onSubmit={handleSubmit(onTransactionSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <Input
                {...register('descricao')}
                label={tr(language, 'Descrição', 'Description')}
                id="desc-trans"
                placeholder={tr(language, 'Ex: Assinatura Netflix', 'Ex: Netflix subscription')}
                error={errors.descricao?.message}
              />
              <Input
                {...register('valor')}
                label={tr(language, 'Valor', 'Amount')}
                id="val-trans"
                type="number"
                step="0.01"
                placeholder={tr(language, '0,00', '0.00')}
                error={errors.valor?.message}
              />
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <Input
                {...register('data')}
                label={tr(language, 'Data', 'Date')}
                id="data-trans"
                type="date"
                error={errors.data?.message}
              />
              <Select
                {...register('metodoPagamento')}
                label={tr(language, 'Método', 'Method')}
                id="metodo-trans"
                options={[
                  { label: 'PIX', value: 'PIX' },
                  { label: tr(language, 'Cartão de Crédito', 'Credit Card'), value: 'CARTAO_CREDITO' },
                  { label: tr(language, 'Cartão de Débito', 'Debit Card'), value: 'CARTAO_DEBITO' },
                  { label: tr(language, 'Boleto', 'Bank Slip'), value: 'BOLETO' },
                  { label: tr(language, 'Transferência', 'Transfer'), value: 'TRANSFERENCIA' },
                  { label: tr(language, 'Dinheiro', 'Cash'), value: 'DINHEIRO' },
                  { label: tr(language, 'Vale Alimentação', 'Meal Voucher'), value: 'VALE_ALIMENTACAO' },
                ]}
                error={errors.metodoPagamento?.message}
              />
              <Select
                {...register('status')}
                label={tr(language, 'Status', 'Status')}
                id="status-trans"
                disabled={metodo === 'CARTAO_CREDITO'}
                options={[
                  { label: tr(language, 'Pago', 'Paid'), value: 'PAGO' },
                  { label: tr(language, 'Pendente', 'Pending'), value: 'PENDENTE' },
                ]}
                error={errors.status?.message}
              />
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {metodo === 'CARTAO_CREDITO' ? (
                <Select
                  {...register('cartaoId')}
                  label={tr(language, 'Cartão', 'Card')}
                  id="cartao-trans"
                  options={cartaoOptions}
                  error={errors.cartaoId?.message}
                />
              ) : (
                <Select
                  {...register('contaId')}
                  label={tr(language, 'Conta Origem/Destino', 'Source/Destination Account')}
                  id="conta-trans"
                  options={contaOptions}
                  error={errors.contaId?.message}
                />
              )}

              <Select
                {...register('categoriaId')}
                label={tr(language, 'Categoria', 'Category')}
                id="cat-trans"
                options={categoriaOptions}
                error={errors.categoriaId?.message}
              />
            </div>

            {metodo === 'CARTAO_CREDITO' && (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <Input
                  {...register('numeroParcela')}
                  label={tr(language, 'Parcela', 'Installment Number')}
                  id="num-parcela-trans"
                  type="number"
                  min="1"
                  placeholder={tr(language, '1', '1')}
                  error={errors.numeroParcela?.message}
                />
                <Input
                  {...register('totalParcelas')}
                  label={tr(language, 'Total de Parcelas', 'Total Installments')}
                  id="total-parcelas-trans"
                  type="number"
                  min="1"
                  placeholder={tr(language, '1', '1')}
                  error={errors.totalParcelas?.message}
                />
              </div>
            )}

            <input type="hidden" {...register('idempotencyKey')} />

            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:gap-4 sm:pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
                id="btn-cancel-modal"
              >
                {tr(language, 'DESCARTAR', 'DISCARD')}
              </Button>
              <Button
                type="submit"
                isLoading={isPending}
                className="flex-1"
                id="btn-confirm-modal"
              >
                {isEditMode
                  ? tr(language, 'ATUALIZAR', 'UPDATE')
                  : activeSection === 'receita'
                    ? tr(language, 'REGISTRAR RECEITA', 'SAVE INCOME')
                    : activeSection === 'despesa'
                      ? tr(language, 'REGISTRAR DESPESA', 'SAVE EXPENSE')
                      : tr(language, 'REGISTRAR LANÇAMENTO', 'SAVE ENTRY')}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
