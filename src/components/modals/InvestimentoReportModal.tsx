import { useEffect, useState, useMemo } from 'react';
import { X, FileDown, FileText } from 'lucide-react';
import { Button } from '../ui/Button';
import { useModalA11y } from '../../hooks/useModalA11y';
import { useI18nStore } from '../../store/useI18nStore';
import { toast } from '../../store/useToastStore';
import { MovimentacaoInvestimentoItem } from '../../lib/movimentacoesInvestimentoApi';
import { formatarMoeda } from '../../lib/formatters';
import { useAuthStore } from '../../store/useAuthStore';

const TIPO_LABEL: Record<string, string> = {
  APORTE: 'Aporte',
  RESGATE: 'Resgate',
  RENDIMENTO: 'Rendimento',
};

interface InvestimentoReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  dados: MovimentacaoInvestimentoItem[];
  dataInicio: string;
  dataFim: string;
}

export const InvestimentoReportModal = ({
  isOpen,
  onClose,
  dados,
  dataInicio,
  dataFim,
}: InvestimentoReportModalProps) => {
  const language = useI18nStore((s) => s.language);
  const moeda = (useAuthStore((s) => s.user?.moeda) as 'BRL' | 'USD' | 'EUR') || 'BRL';
  const tr = (pt: string, en: string) => (language === 'en-US' ? en : pt);

  const [formato, setFormato] = useState<'PDF' | 'CSV'>('PDF');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) setFormato('PDF');
  }, [isOpen]);

  const dialogRef = useModalA11y(isOpen, onClose);

  function exportarCSV() {
    const bom = '﻿';
    const header = [
      tr('Tipo', 'Type'),
      tr('Investimento', 'Investment'),
      tr('Data', 'Date'),
      tr('Conta', 'Account'),
      tr('Observação', 'Notes'),
      tr('Valor', 'Value'),
    ].join(';');
    const rows = dados.map((m) => {
      const sinal = m.tipo === 'RESGATE' ? '-' : m.tipo === 'RENDIMENTO' && m.valor < 0 ? '-' : '+';
      const valorFormatado = `${sinal}${Math.abs(m.valor).toFixed(2).replace('.', ',')}`;
      return [
        TIPO_LABEL[m.tipo] ?? m.tipo,
        m.descricaoInvestimento,
        new Date(m.data + 'T00:00:00').toLocaleDateString('pt-BR'),
        m.nomeContaOrigem ?? '',
        m.observacao ?? '',
        valorFormatado,
      ].map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';');
    });
    const csv = bom + [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `historico-investimentos-${dataInicio}-${dataFim}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleSubmit() {
    if (formato === 'CSV') {
      setLoading(true);
      try {
        exportarCSV();
        toast.success(tr('Planilha gerada com sucesso!', 'Spreadsheet generated successfully!'));
        onClose();
      } finally {
        setLoading(false);
      }
      return;
    }
    toast.error(tr(
      'Relatório PDF para investimentos em desenvolvimento. Use o CSV por enquanto.',
      'Investment PDF report is under development. Use CSV for now.',
    ));
  }

  const totalItens = dados.length;
  const totalCSV = useMemo(() => dados.reduce((s, m) => {
    if (m.tipo === 'APORTE') return s + Math.abs(m.valor);
    if (m.tipo === 'RESGATE') return s - Math.abs(m.valor);
    return s + m.valor;
  }, 0), [dados]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-2 sm:p-4 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />

      <div
        ref={dialogRef}
        className="glass w-full max-w-xl max-h-[94dvh] overflow-y-auto rounded-2xl sm:rounded-3xl p-4 sm:p-8 relative z-10 animate-in zoom-in-95 duration-300"
      >
        <div className="flex items-start sm:items-center justify-between mb-6 sm:mb-8 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <FileDown size={20} />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-white leading-tight">
                {tr('Exportar Relatório', 'Export Report')}
              </h3>
              <p className="text-2xs uppercase font-bold text-muted-foreground tracking-widest">
                {tr('Investimentos', 'Investments')}
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

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setFormato('PDF')}
              className={`relative py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all border ${
                formato === 'PDF'
                  ? 'bg-primary/20 border-primary text-primary shadow-lg shadow-primary/10'
                  : 'bg-secondary/20 border-transparent text-muted-foreground'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <FileText size={14} />
                {tr('Gerar PDF', 'Generate PDF')}
              </div>
              <span className="absolute -top-2 -right-2 bg-amber-500/90 text-amber-950 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md leading-none">
                {tr('Em breve', 'Soon')}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setFormato('CSV')}
              className={`py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all border ${
                formato === 'CSV'
                  ? 'bg-primary/20 border-primary text-primary shadow-lg shadow-primary/10'
                  : 'bg-secondary/20 border-transparent text-muted-foreground'
              }`}
            >
              {tr('Gerar Planilha CSV', 'Generate CSV')}
            </button>
          </div>

          <div className="bg-white/5 rounded-xl p-4 space-y-2">
            <p className="text-2xs font-bold text-muted-foreground uppercase tracking-widest">
              {tr('Período do relatório', 'Report period')}
            </p>
            <p className="text-sm text-white font-semibold">
              {new Date(dataInicio + 'T00:00:00').toLocaleDateString(language, { day: '2-digit', month: 'long', year: 'numeric' })}
              {' → '}
              {new Date(dataFim + 'T00:00:00').toLocaleDateString(language, { day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
            <div className="flex gap-4 mt-2 pt-2 border-t border-white/5">
              <div>
                <p className="text-2xs text-muted-foreground">{tr('Registros', 'Records')}</p>
                <p className="text-sm font-bold text-white">{totalItens}</p>
              </div>
              <div>
                <p className="text-2xs text-muted-foreground">{tr('Saldo líquido', 'Net balance')}</p>
                <p className={`text-sm font-bold ${totalCSV >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {formatarMoeda(Math.abs(totalCSV), moeda)}
                </p>
              </div>
            </div>
          </div>

          {dados.length === 0 && (
            <p className="text-sm text-amber-400 text-center py-2">
              {tr('Nenhuma movimentação no período selecionado.', 'No movements in selected period.')}
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2 sm:pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              {tr('CANCELAR', 'CANCEL')}
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              isLoading={loading}
              disabled={dados.length === 0}
              className="flex-1"
            >
              {tr('BAIXAR ARQUIVO', 'DOWNLOAD FILE')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
