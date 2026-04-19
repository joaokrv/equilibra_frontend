import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, FileDown } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input, Select } from '../ui/Input';
import { useI18nStore } from '../../store/useI18nStore';
import { toast } from '../../store/useToastStore';
import { OpenAPI } from '../../api/core/OpenAPI';

const tr = (language: 'pt-BR' | 'en-US', pt: string, en: string) =>
  language === 'en-US' ? en : pt;

const buildReportSchema = (language: 'pt-BR' | 'en-US') =>
  z.object({
    dataInicio: z.string().min(1, tr(language, 'Data inicial obrigatória', 'Start date required')),
    dataFim: z.string().min(1, tr(language, 'Data final obrigatória', 'End date required')),
    statusTransacao: z.string().optional(),
    formato: z.enum(['PDF', 'CSV']),
  });

type ReportFormValues = z.infer<ReturnType<typeof buildReportSchema>>;

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  tipoContextoFixo: 'RECEITA' | 'DESPESA' | 'GERAL'; 
}

export const ReportModal = ({ isOpen, onClose, tipoContextoFixo }: ReportModalProps) => {
  const language = useI18nStore((state) => state.language);
  const schema = useMemo(() => buildReportSchema(language), [language]);
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors },
  } = useForm<ReportFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      statusTransacao: '', 
      formato: 'PDF',
    },
  });

  const formatoSelecionado = watch('formato');

  useEffect(() => {
    if (!isOpen) { 
        reset();
        return; 
    }

    const date = new Date();
    // 1º e Ultimo dia do Mes para os campos Date
    const start = new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0];

    setValue('dataInicio', start);
    setValue('dataFim', end);
    setValue('formato', 'PDF');
    setValue('statusTransacao', '');
  }, [isOpen, setValue, reset]);

  const onSubmit = async (data: ReportFormValues) => {
    try {
      setIsSubmittingManual(true);
      
      // Resgata dinamicamente o Token Bearer JWT do escopo da API
      const token = typeof OpenAPI.TOKEN === 'function'
        ? await OpenAPI.TOKEN({ method: 'POST', url: '/api/v1/relatorios/exportar' })
        : OpenAPI.TOKEN;
      
      const payload = {
          dataInicio: data.dataInicio,
          dataFim: data.dataFim,
          tipoFiltro: tipoContextoFixo,
          statusTransacao: data.statusTransacao === '' ? null : data.statusTransacao
      };

      // Dispara o JS Vanilla nativo para controlar o array de bytes (Blob)
      const response = await fetch(`${OpenAPI.BASE}/api/v1/relatorios/exportar?formato=${data.formato}`, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
      });

      if (!response.ok) {
          throw new Error('Falha ao exportar da API.');
      }

      // Converte a reposta bruta em Objeto Vinculado Binário e injeta em URL Volátil
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      
      const filename = `equilibra-extrato-${tipoContextoFixo.toLowerCase()}.${data.formato.toLowerCase()}`;
      link.setAttribute('download', filename);
      
      document.body.appendChild(link);
      link.click();
      
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success(tr(language, 'Relatório gerado com sucesso!', 'Report generated successfully!'));
      onClose();
      
    } catch (error) {
       toast.error(tr(language, 'Ocorreu um erro gerando o Relatório. Tente novamente mais tarde.', 'An error occurred. Try again later.'));
    } finally {
        setIsSubmittingManual(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-2 sm:p-4 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />

      <div className="glass w-full max-w-xl max-h-[94dvh] overflow-y-auto rounded-2xl sm:rounded-3xl p-4 sm:p-8 relative z-10 animate-in zoom-in-95 duration-300">
         <div className="flex items-start sm:items-center justify-between mb-6 sm:mb-8 gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <FileDown size={20} />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-white leading-tight">
                  {tr(language, 'Exportar Relatório', 'Export Report')}
                </h3>
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                  {tipoContextoFixo}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/5 rounded-full text-muted-foreground hover:text-white transition-all"
            >
              <X size={20} />
            </button>
         </div>

         <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            
            <div className="grid grid-cols-2 gap-4">
               <button
                 type="button"
                 onClick={() => setValue('formato', 'PDF')}
                 className={`py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all border ${formatoSelecionado === 'PDF' ? 'bg-primary/20 border-primary text-primary shadow-lg shadow-primary/10' : 'bg-secondary/20 border-transparent text-muted-foreground'}`}
               >
                 {tr(language, 'Gerar PDF', 'Generate PDF')}
               </button>
               <button
                 type="button"
                 onClick={() => setValue('formato', 'CSV')}
                 className={`py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all border ${formatoSelecionado === 'CSV' ? 'bg-primary/20 border-primary text-primary shadow-lg shadow-primary/10' : 'bg-secondary/20 border-transparent text-muted-foreground'}`}
               >
                 {tr(language, 'Gerar Planilha CSV', 'Generate CSV')}
               </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                {...register('dataInicio')}
                label={tr(language, 'Data Inicial', 'Start Date')}
                id="data-inicio"
                type="date"
                error={errors.dataInicio?.message}
              />
              <Input
                {...register('dataFim')}
                label={tr(language, 'Data Final', 'End Date')}
                id="data-fim"
                type="date"
                error={errors.dataFim?.message}
              />
            </div>

            <div className="grid grid-cols-1 gap-6">
              <Select
                {...register('statusTransacao')}
                label={tr(language, 'Status das Transações', 'Transaction Status')}
                id="status-trans"
                options={[
                  { label: tr(language, 'Todas as transações', 'All transactions'), value: '' },
                  { label: tr(language, 'Apenas Pagas/Recebidas', 'Only Paid/Received'), value: 'PAGO' },
                  { label: tr(language, 'Apenas Pendentes', 'Only Pending'), value: 'PENDENTE' },
                ]}
                error={errors.statusTransacao?.message}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2 sm:pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                {tr(language, 'CANCELAR', 'CANCEL')}
              </Button>
              <Button
                type="submit"
                isLoading={isSubmittingManual}
                className="flex-1"
              >
                {tr(language, 'BAIXAR ARQUIVO', 'DOWNLOAD FILE')}
              </Button>
            </div>
         </form>
      </div>
    </div>
  );
};
