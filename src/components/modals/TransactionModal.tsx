import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { X, ReceiptText } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '../ui/Button';
import { Input, Select } from '../ui/Input';
import { toast } from '../../store/useToastStore';
import { getApiErrorMessage } from '../../lib/errorMessage';
import { useI18nStore } from '../../store/useI18nStore';
import {
  TransaEsService,
  ContaControllerService,
  CartaoControllerService,
  CategoriaControllerService,
} from '../../api';
import type { TransacaoResponseDTO } from '../../api/models/TransacaoResponseDTO';

const tr = (language: 'pt-BR' | 'en-US', pt: string, en: string) =>
  language === 'en-US' ? en : pt;

const buildTransactionSchema = (language: 'pt-BR' | 'en-US') =>
  z.object({
    descricao: z.string().min(3, tr(language, 'Descricao muito curta', 'Description is too short')),
    valor: z
      .string()
      .min(1, tr(language, 'Valor e obrigatorio', 'Amount is required'))
      .refine((v) => !isNaN(Number(v)) && Number(v) > 0, tr(language, 'Valor deve ser positivo', 'Amount must be positive')),
    data: z.string().min(1, tr(language, 'Data e obrigatoria', 'Date is required')),
    tipo: z.enum(['RECEITA', 'DESPESA']),
    status: z.enum(['PAGO', 'PENDENTE']),
    metodoPagamento: z.enum([
      'PIX', 'BOLETO', 'CARTAO_CREDITO', 'DINHEIRO', 'TRANSFERENCIA',
      'CARTAO_DEBITO', 'VALE_ALIMENTACAO',
    ]),
    contaId: z.string().optional(),
    cartaoId: z.string().optional(),
    categoriaId: z.string().min(1, tr(language, 'Selecione uma categoria', 'Select a category')),
    idempotencyKey: z.string().min(1),
  });

type TransactionFormValues = z.infer<ReturnType<typeof buildTransactionSchema>>;

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  transacaoParaEditar?: TransacaoResponseDTO;
}

export const TransactionModal = ({ isOpen, onClose, onSuccess, transacaoParaEditar }: TransactionModalProps) => {
  const queryClient = useQueryClient();
  const isEditMode = !!transacaoParaEditar;
  const language = useI18nStore((state) => state.language);
  const schema = useMemo(() => buildTransactionSchema(language), [language]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      tipo: 'DESPESA',
      status: 'PAGO',
      metodoPagamento: 'PIX',
      data: new Date().toISOString().split('T')[0],
      idempotencyKey: '',
    },
  });

  const tipo = watch('tipo');
  const metodo = watch('metodoPagamento');

  // Preencher formulário ao abrir (novo ou edição)
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
      setValue('idempotencyKey', uuidv4());
    } else {
      reset({
        tipo: 'DESPESA',
        status: 'PAGO',
        metodoPagamento: 'PIX',
        data: new Date().toISOString().split('T')[0],
        idempotencyKey: uuidv4(),
      });
    }
  }, [isOpen, isEditMode, transacaoParaEditar, setValue, reset]);

  // ─── Queries Dinâmicas ────────────────────────────────────────────
  const { data: contas = [] } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => ContaControllerService.listarContas(),
    enabled: isOpen,
  });

  const { data: cartoes = [] } = useQuery({
    queryKey: ['cards'],
    queryFn: () => CartaoControllerService.listarCartoes(),
    enabled: isOpen,
  });

  const { data: categorias = [] } = useQuery({
    queryKey: ['categories', tipo],
    queryFn: () => CategoriaControllerService.listarCategorias(tipo),
    enabled: isOpen,
  });

  // ─── Mutation: Criar ──────────────────────────────────────────────
  const criarMutation = useMutation({
    mutationFn: (payload: any) => TransaEsService.criarTransacao(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['transacoes'] });
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
        tr(language, 'Nao foi possivel registrar a transacao. Revise os dados e tente novamente.', 'Could not save the transaction. Review the data and try again.'),
      );
      if (errorStatus === 409) {
        toast.warning(tr(language, 'Esta transacao ja foi processada.', 'This transaction has already been processed.'));
      } else {
        toast.error(message);
      }
    },
  });

  // ─── Mutation: Atualizar ──────────────────────────────────────────
  const atualizarMutation = useMutation({
    mutationFn: (payload: any) => TransaEsService.atualizarTransacao(transacaoParaEditar!.id!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['transacoes'] });
      toast.success(tr(language, 'Transacao atualizada com sucesso!', 'Transaction updated successfully!'));
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
            'Nao foi possivel salvar a edicao da transacao. Revise os dados e tente novamente.',
            'Could not save transaction changes. Review the data and try again.',
          ),
        ),
      );
    },
  });

  const onSubmit = (data: TransactionFormValues) => {
    const payload = {
      ...data,
      valor: Number(data.valor),
      contaId: data.contaId ? Number(data.contaId) : undefined,
      cartaoId: data.cartaoId ? Number(data.cartaoId) : undefined,
      categoriaId: Number(data.categoriaId),
    };

    if (isEditMode) {
      atualizarMutation.mutate(payload);
    } else {
      criarMutation.mutate(payload);
    }
  };

  if (!isOpen) return null;

  const isPending = criarMutation.isPending || atualizarMutation.isPending;

  // ─── Opções dinâmicas para os selects ─────────────────────────────
  const contaOptions = [
    { label: tr(language, 'Selecione a Conta', 'Select Account'), value: '' },
    ...(contas as any[]).map((c: any) => ({
      label: c.nome,
      value: String(c.id),
    })),
  ];

  const cartaoOptions = [
    { label: tr(language, 'Selecione o Cartao', 'Select Card'), value: '' },
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />

      <div className="glass w-full max-w-xl rounded-3xl p-8 relative z-10 animate-in zoom-in-95 duration-300">
         <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <ReceiptText size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white leading-tight">
                  {isEditMode ? tr(language, 'Editar Transacao', 'Edit Transaction') : tr(language, 'Nova Transacao', 'New Transaction')}
                </h3>
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                  {isEditMode
                    ? tr(language, 'Atualize os dados da transacao', 'Update transaction data')
                    : tr(language, 'Controle sua saude financeira', 'Track your financial health')}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/5 rounded-full text-muted-foreground hover:text-white transition-all"
              aria-label={tr(language, 'Fechar modal', 'Close modal')}
            >
              <X size={20} />
            </button>
         </div>

         <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
               <button
                 type="button"
                 onClick={() => setValue('tipo', 'DESPESA')}
                 className={`py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all border ${tipo === 'DESPESA' ? 'bg-rose-500/10 border-rose-500 text-rose-500 shadow-lg shadow-rose-500/10' : 'bg-secondary/20 border-transparent text-muted-foreground'}`}
               >
                 {tr(language, 'Despesa', 'Expense')}
               </button>
               <button
                 type="button"
                 onClick={() => setValue('tipo', 'RECEITA')}
                 className={`py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all border ${tipo === 'RECEITA' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500 shadow-lg shadow-emerald-500/10' : 'bg-secondary/20 border-transparent text-muted-foreground'}`}
               >
                 {tr(language, 'Receita', 'Income')}
               </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                {...register('descricao')}
                label={tr(language, 'Descricao', 'Description')}
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                {...register('data')}
                label={tr(language, 'Data', 'Date')}
                id="data-trans"
                type="date"
                error={errors.data?.message}
              />
              <Select
                {...register('metodoPagamento')}
                label={tr(language, 'Metodo', 'Method')}
                id="metodo-trans"
                options={[
                  { label: 'PIX', value: 'PIX' },
                  { label: tr(language, 'Cartao de Credito', 'Credit Card'), value: 'CARTAO_CREDITO' },
                  { label: tr(language, 'Cartao de Debito', 'Debit Card'), value: 'CARTAO_DEBITO' },
                  { label: tr(language, 'Boleto', 'Bank Slip'), value: 'BOLETO' },
                  { label: tr(language, 'Transferencia', 'Transfer'), value: 'TRANSFERENCIA' },
                  { label: tr(language, 'Dinheiro', 'Cash'), value: 'DINHEIRO' },
                  { label: tr(language, 'Vale Alimentacao', 'Meal Voucher'), value: 'VALE_ALIMENTACAO' },
                ]}
                error={errors.metodoPagamento?.message}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {metodo === 'CARTAO_CREDITO' ? (
                <Select
                  {...register('cartaoId')}
                  label={tr(language, 'Cartao', 'Card')}
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

            {/* Campo Oculto de Idempotência */}
            <input type="hidden" {...register('idempotencyKey')} />

            <div className="flex gap-4 pt-4">
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
                {isEditMode ? tr(language, 'ATUALIZAR', 'UPDATE') : tr(language, 'REGISTRAR NO FLUXO', 'SAVE TRANSACTION')}
              </Button>
            </div>
         </form>
      </div>
    </div>
  );
};
