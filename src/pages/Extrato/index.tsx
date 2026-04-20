import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Receipt, ChevronLeft, ChevronRight, Loader2, TrendingUp, TrendingDown, Search, Pencil, Trash2, Repeat, FileDown } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { MainLayout } from '../../components/layout/MainLayout';
import { SortIcon } from '../../components/icons/SortIcon';
import { TransaEsService } from '../../api/services/TransaEsService';
import { TransacaoResponseDTO } from '../../api/models/TransacaoResponseDTO';
import { TransactionModal } from '../../components/modals/TransactionModal';
import { DeleteConfirmationModal } from '../../components/modals/DeleteConfirmationModal';
import { ReportModal } from '../../components/modals/ReportModal';
import { formatarMoeda } from '../../lib/formatters';
import { METODO_PAGAMENTO_LABELS, STATUS_TRANSACAO_LABELS } from '../../lib/constants';
import { getApiErrorMessage } from '../../lib/errorMessage';
import { useAuthStore } from '../../store/useAuthStore';
import { toast } from '../../store/useToastStore';
import { useI18nStore } from '../../store/useI18nStore';

interface ExtratoPageProps {
  filtroTipo?: TransacaoResponseDTO.tipo;
  titulo?: string;
  descricao?: string;
}

type SortField = 'data' | 'descricao' | 'categoria' | 'status' | 'valor' | 'metodoPagamento';
type SortDirection = 'asc' | 'desc';

export const ExtratoPage = ({ filtroTipo, titulo, descricao }: ExtratoPageProps) => {
  const moeda = (useAuthStore((s) => s.user?.moeda) as 'BRL' | 'USD' | 'EUR') || 'BRL';
  const language = useI18nStore((s) => s.language);
  const tr = (pt: string, en: string) => (language === 'en-US' ? en : pt);
  const tituloPagina = titulo ?? tr('Extrato', 'Statement');
  const descricaoPagina = descricao ?? tr('Histórico completo de transações.', 'Complete transaction history.');
  
  const metodoLabel = (metodo: keyof typeof METODO_PAGAMENTO_LABELS) => {
    const enLabels: Partial<Record<keyof typeof METODO_PAGAMENTO_LABELS, string>> = {
      CARTAO_CREDITO: 'Credit Card',
      PIX: 'Pix',
      VALE_ALIMENTACAO: 'Meal Voucher',
      DINHEIRO: 'Cash',
      TRANSFERENCIA: 'Transfer',
      BOLETO: 'Bank Slip',
      CARTAO_DEBITO: 'Debit Card',
    };
    return language === 'en-US' ? (enLabels[metodo] ?? METODO_PAGAMENTO_LABELS[metodo]) : METODO_PAGAMENTO_LABELS[metodo];
  };
  
  const statusLabel = (status: keyof typeof STATUS_TRANSACAO_LABELS) => {
    const enLabels: Partial<Record<keyof typeof STATUS_TRANSACAO_LABELS, string>> = {
      PAGO: 'Paid',
      PENDENTE: 'Pending',
    };
    return language === 'en-US' ? (enLabels[status] ?? STATUS_TRANSACAO_LABELS[status]) : STATUS_TRANSACAO_LABELS[status];
  };
  
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const buscaParam = searchParams.get('busca') ?? '';
  const hoje = new Date();
  const [ano, setAno] = useState(hoje.getFullYear());
  const [mes, setMes] = useState(hoje.getMonth() + 1);
  const [busca, setBusca] = useState(buscaParam);

  // Estados de Ordenação
  const [sortField, setSortField] = useState<SortField>('data');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc'); // data desc é o padrão

  // Estado do Relatório
  const [modalRelatorioAberto, setModalRelatorioAberto] = useState(false);
  const tipoContextoFixo = filtroTipo === TransacaoResponseDTO.tipo.RECEITA ? 'RECEITA' : (filtroTipo === TransacaoResponseDTO.tipo.DESPESA ? 'DESPESA' : 'GERAL');

  useEffect(() => {
    setBusca(buscaParam);
  }, [buscaParam]);

  // Edição
  const [transacaoParaEditar, setTransacaoParaEditar] = useState<TransacaoResponseDTO | undefined>(undefined);
  const [modalEditarAberto, setModalEditarAberto] = useState(false);

  // Exclusão
  const [transacaoParaDeletar, setTransacaoParaDeletar] = useState<TransacaoResponseDTO | undefined>(undefined);

  const { data: transacoes = [], isLoading } = useQuery({
    queryKey: ['transacoes', ano, mes],
    queryFn: () => TransaEsService.listarPaginado({ page: 0, size: 500 }, ano, mes),
  });

  const deletarMutation = useMutation({
    mutationFn: (id: number) => TransaEsService.deletarTransacao(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transacoes'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success(tr('Transação excluída com sucesso.', 'Transaction deleted successfully.'));
      setTransacaoParaDeletar(undefined);
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, tr('Erro ao excluir a transação.', 'Error deleting transaction.')));
    },
  });

  const lista = Array.isArray(transacoes) ? transacoes : (transacoes as any)?.content ?? [];
  const totalElements: number = (transacoes as any)?.totalElements ?? 0;

  useEffect(() => {
    if (lista.length >= 500 && totalElements > lista.length) {
      toast.error(
        tr(
          'Muitas transações neste mês. Exibindo apenas as 500 primeiras. Use o Relatório para exportar todos os dados.',
          'Many transactions this month. Showing first 500 only. Use the Report feature to export all.'
        )
      );
    }
  }, [lista.length, totalElements]);

  // Passo 1: Filtragem
  const filtradas = lista.filter((t: TransacaoResponseDTO) => {
    if (filtroTipo && t.tipo !== filtroTipo) return false;
    if (busca && !t.descricao?.toLowerCase().includes(busca.toLowerCase())) return false;
    return true;
  });

  // Passo 2: Ordenação
  const filtradasEOrdenadas = [...filtradas].sort((a: TransacaoResponseDTO, b: TransacaoResponseDTO) => {
    let cmp = 0;
    switch(sortField) {
      case 'data': {
         const dateA = a.data ? new Date(a.data).getTime() : -Infinity;
         const dateB = b.data ? new Date(b.data).getTime() : -Infinity;
         cmp = dateA - dateB;
         break;
      }
      case 'descricao':
         cmp = (a.descricao || '').localeCompare(b.descricao || ''); 
         break;
      case 'categoria':
         cmp = (a.nomeCategoria || '').localeCompare(b.nomeCategoria || ''); 
         break;
      case 'metodoPagamento':
         cmp = (a.metodoPagamento || '').localeCompare(b.metodoPagamento || ''); 
         break;
      case 'status':
         cmp = (a.status || '').localeCompare(b.status || ''); 
         break;
      case 'valor': {
         const valA = a.tipo === TransacaoResponseDTO.tipo.DESPESA ? -(a.valor || 0) : (a.valor || 0);
         const valB = b.tipo === TransacaoResponseDTO.tipo.DESPESA ? -(b.valor || 0) : (b.valor || 0);
         cmp = valA - valB;
         break;
      }
    }
    return sortDirection === 'asc' ? cmp : -cmp; // Inverte o sinal dependendo da direção
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc'); // Default ao mudar field
    }
  };

  const totalReceitas = filtradas.filter((t: TransacaoResponseDTO) => t.tipo === TransacaoResponseDTO.tipo.RECEITA).reduce((s: number, t: TransacaoResponseDTO) => s + (t.valor ?? 0), 0);
  const totalDespesas = filtradas.filter((t: TransacaoResponseDTO) => t.tipo === TransacaoResponseDTO.tipo.DESPESA).reduce((s: number, t: TransacaoResponseDTO) => s + (t.valor ?? 0), 0);

  const totalPendentes = filtradas.filter((t: TransacaoResponseDTO) => t.status === TransacaoResponseDTO.status.PENDENTE).reduce((s: number, t: TransacaoResponseDTO) => s + (t.valor ?? 0), 0);
  const totalPagos = filtradas.filter((t: TransacaoResponseDTO) => t.status === TransacaoResponseDTO.status.PAGO).reduce((s: number, t: TransacaoResponseDTO) => s + (t.valor ?? 0), 0);

  const navMes = (dir: -1 | 1) => {
    let m = mes + dir;
    let a = ano;
    if (m < 1) { m = 12; a--; }
    if (m > 12) { m = 1; a++; }
    setMes(m);
    setAno(a);
  };

  const nomeMes = new Date(ano, mes - 1).toLocaleDateString(language, { month: 'long', year: 'numeric' });

  const handleBuscaChange = (valor: string) => {
    setBusca(valor);
    if (valor.trim()) {
      setSearchParams({ busca: valor });
    } else {
      setSearchParams({});
    }
  };

  const abrirEditar = (t: TransacaoResponseDTO) => {
    setTransacaoParaEditar(t);
    setModalEditarAberto(true);
  };

  const fecharEditar = () => {
    setModalEditarAberto(false);
    setTransacaoParaEditar(undefined);
  };

  return (
    <MainLayout>
      <div className="p-3 sm:p-4 lg:p-6 space-y-5 sm:space-y-6 animate-in fade-in duration-500 relative">
        <div>
          <h1 className="text-2xl font-bold text-white">{tituloPagina}</h1>
          <p className="text-sm text-muted-foreground mt-1">{descricaoPagina}</p>
        </div>

        {/* Navegação por mês + busca + botões no mesmo nível linear e espaçado! */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 w-full">
          
          {/* Navegação de Datas */}
          <div className="flex items-center justify-between gap-3 glass rounded-xl px-3 py-2 flex-shrink-0 h-[44px]">
            <button onClick={() => navMes(-1)} className="p-1 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-white transition-all"><ChevronLeft size={18} /></button>
            <span className="text-sm font-bold text-white capitalize min-w-[120px] text-center">{nomeMes}</span>
            <button onClick={() => navMes(1)} className="p-1 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-white transition-all"><ChevronRight size={18} /></button>
          </div>

          {/* Busca (Expande para usar o vazio entre o botão) */}
          <div className="relative w-full flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
               type="text" 
               value={busca} 
               onChange={(e) => handleBuscaChange(e.target.value)} 
               placeholder={tr('Buscar transação...', 'Search transaction...')} 
               className="w-full bg-secondary/30 border border-white/5 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-medium placeholder:text-muted-foreground/30 h-[44px]" 
            />
          </div>

          {/* Relatório (Fixo na direita) */}
          <button 
            onClick={() => setModalRelatorioAberto(true)}
            className="w-full sm:w-auto bg-primary/10 border-transparent text-primary hover:bg-primary/20 transition-all font-bold text-[11px] uppercase tracking-wider px-6 rounded-xl flex flex-row justify-center items-center gap-2 flex-shrink-0 h-[44px]"
          >
            <FileDown size={16} /> 
            {tr('Relatório', 'Report')}
          </button>
        </div>

        {/* Resumo */}
        {!filtroTipo && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass rounded-2xl p-4">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">{tr('Receitas', 'Income')}</p>
              <p className="text-xl font-bold text-emerald-400 mt-1">{formatarMoeda(totalReceitas, moeda)}</p>
            </div>
            <div className="glass rounded-2xl p-4">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">{tr('Despesas', 'Expenses')}</p>
              <p className="text-xl font-bold text-rose-400 mt-1">{formatarMoeda(totalDespesas, moeda)}</p>
            </div>
            <div className="glass rounded-2xl p-4">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">{tr('Balanço', 'Balance')}</p>
              <p className={`text-xl font-bold mt-1 ${totalReceitas - totalDespesas >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {formatarMoeda(totalReceitas - totalDespesas, moeda)}
              </p>
            </div>
          </div>
        )}

        {filtroTipo && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass rounded-2xl p-4">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                {tr('Total de', 'Total')} {filtroTipo === TransacaoResponseDTO.tipo.RECEITA ? tr('Receitas', 'Income') : tr('Despesas', 'Expenses')}
              </p>
              <p className={`text-xl sm:text-2xl font-bold mt-1 ${filtroTipo === TransacaoResponseDTO.tipo.RECEITA ? 'text-emerald-400' : 'text-rose-400'}`}>
                {formatarMoeda(filtroTipo === TransacaoResponseDTO.tipo.RECEITA ? totalReceitas : totalDespesas, moeda)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {language === 'en-US'
                  ? `${filtradas.length} transaction${filtradas.length !== 1 ? 's' : ''} in month`
                  : `${filtradas.length} transaç${filtradas.length !== 1 ? 'ões' : 'ão'} no mês`}
              </p>
            </div>
            
            <div className="glass rounded-2xl p-4">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                {filtroTipo === TransacaoResponseDTO.tipo.RECEITA ? tr('Recebido', 'Received') : tr('Pago', 'Paid')}
              </p>
              <p className={`text-xl sm:text-2xl font-bold mt-1 ${filtroTipo === TransacaoResponseDTO.tipo.RECEITA ? 'text-emerald-400' : 'text-rose-400'}`}>
                {formatarMoeda(totalPagos, moeda)}
              </p>
            </div>
            
            <div className="glass rounded-2xl p-4">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">{tr('Pendente', 'Pending')}</p>
              <p className="text-xl sm:text-2xl font-bold mt-1 text-amber-400">
                {formatarMoeda(totalPendentes, moeda)}
              </p>
            </div>
          </div>
        )}

        {/* Lista */}
        {isLoading ? (
          <div className="flex items-center justify-center h-48"><Loader2 className="animate-spin text-primary" size={32} /></div>
        ) : filtradasEOrdenadas.length === 0 ? (
          <div className="glass rounded-2xl p-6 sm:p-10 lg:p-12 flex flex-col items-center justify-center gap-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary/50"><Receipt size={32} /></div>
            <p className="text-sm text-muted-foreground font-medium max-w-xs leading-relaxed">
              {busca ? tr('Nenhuma transação encontrada para esta busca.', 'No transactions found for this search.') : tr('Nenhuma transação neste mês.', 'No transactions in this month.')}
            </p>
          </div>
        ) : (
          <div className="glass flex flex-col rounded-2xl shadow-xl border border-white/5 relative bg-background/40">
            {/* Wrapper de Overflow Horizontal para Telas Médias (iPads/Laptops menores) */}
            <div className="w-full overflow-x-auto">
              <div className="w-full xl:min-w-max">
                
                {/* Cabeçalho de Organização Expandida com Ações no Fim (Grid limpo e dividido com exatidão) */}
                <div className="hidden xl:grid xl:grid-cols-[40px_minmax(120px,1fr)_90px_100px_80px_70px_100px_70px] items-center gap-4 px-4 sm:px-6 py-4 bg-white/5 border-b border-white/5 select-none font-bold text-[10px] uppercase text-muted-foreground tracking-widest z-10 w-full">
                   
                   <div></div> {/* 40px Icon Spacer */}
                   
                   {/* Nome */}
                   <div className="flex items-center gap-1 xl:gap-2 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('descricao')}>
                      <span>{tr('Nome', 'Name')}</span>
                      <SortIcon currentField={sortField} field="descricao" direction={sortDirection} />
                   </div>

                   {/* Categoria */}
                   <div className="flex items-center gap-1 xl:gap-2 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('categoria')}>
                      <span>{tr('Categoria', 'Category')}</span>
                      <SortIcon currentField={sortField} field="categoria" direction={sortDirection} />
                   </div>

                   {/* Metodo de Pagamento */}
                   <div className="flex items-center gap-1 xl:gap-2 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('metodoPagamento')}>
                      <span>{tr('Método', 'Method')}</span>
                      <SortIcon currentField={sortField} field="metodoPagamento" direction={sortDirection} />
                   </div>

                   {/* Data */}
                   <div className="flex justify-start items-center gap-1 xl:gap-2 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('data')}>
                      <span>{tr('Data', 'Date')}</span>
                      <SortIcon currentField={sortField} field="data" direction={sortDirection} />
                   </div>

                   {/* Status */}
                   <div className="flex justify-start items-center gap-1 xl:gap-2 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('status')}>
                      <span>{tr('Status', 'Status')}</span>
                      <SortIcon currentField={sortField} field="status" direction={sortDirection} />
                   </div>

                   {/* Valor */}
                   <div className="flex items-center gap-1 xl:gap-2 cursor-pointer hover:text-white transition-colors justify-end pr-1 xl:pr-2" onClick={() => handleSort('valor')}>
                     <SortIcon currentField={sortField} field="valor" direction={sortDirection} />
                     <span>{tr('Valor', 'Value')}</span>
                   </div>

                   {/* Ações não são clicáveis para sort, apenas label fixa no canto */}
                   <div className="text-right pr-1 xl:pr-2">
                     {tr('Ações', 'Actions')}
                   </div>
                   
                </div>

                {/* Linhas (Reconstruídas com grid alinhado nativamente ao header ao invés de flex que flutua) */}
                <div className="flex-1 w-full bg-black/10">
                  {filtradasEOrdenadas.map((t: TransacaoResponseDTO) => (
                    <div key={t.id} className="group relative flex flex-col xl:grid xl:grid-cols-[40px_minmax(120px,1fr)_90px_100px_80px_70px_100px_70px] xl:items-center gap-3 xl:gap-4 px-4 sm:px-6 py-4 hover:bg-white/5 transition-all outline-none border-b border-white/5 last:border-0 border-transparent">
                      
                      {/* (Mobi/Desk) Icone de Categoria Dinâmico */}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        t.tipo === TransacaoResponseDTO.tipo.RECEITA ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                      }`}>
                        {t.tipo === TransacaoResponseDTO.tipo.RECEITA ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                      </div>
                      
                      {/* Nome da Transação e Tag Fixa */}
                      <div className="flex flex-col justify-center min-w-0 pr-1 xl:pr-2">
                          <p className="text-[14px] xl:text-[15px] font-bold text-white truncate">{t.descricao}</p>
                          {t.isRecorrente && (
                            <span className="block mt-1 sm:mt-1 xl:mt-0 max-w-fit items-center gap-1 text-[9px] font-bold text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-md truncate">
                              <Repeat size={10} className="inline mr-1 mb-0.5"/> {tr('Fixa', 'Recurring')}
                            </span>
                          )}
                      </div>

                      {/* Categoria */}
                      <div className="hidden xl:flex flex-col items-start gap-1 justify-center min-w-0 pr-1 xl:pr-2">
                          <span className="text-[10px] text-muted-foreground bg-white/5 px-2 py-1 rounded w-full truncate uppercase tracking-wider font-semibold">
                              {t.nomeCategoria || 'Sem cat'}
                          </span>
                      </div>

                      {/* Método */}
                      <div className="hidden xl:flex flex-col items-start gap-1 justify-center min-w-0 pr-1 xl:pr-2">
                          {t.metodoPagamento ? (
                             <span className="text-[10px] text-muted-foreground/80 font-semibold px-1 truncate w-full">
                               {metodoLabel(t.metodoPagamento)}
                             </span>
                          ) : (
                             <span className="text-[10px] text-muted-foreground/30 px-1">—</span>
                          )}
                      </div>

                          {/* Data (Substituído lugar com Status) */}
                          <div className="hidden xl:flex justify-start text-[12px] text-muted-foreground font-medium min-w-0 truncate">
                            {t.data ? new Date(t.data + 'T12:00:00').toLocaleDateString(language, { day: '2-digit', month: '2-digit', year: 'numeric' }) : ''}
                          </div>

                      {/* Status */}
                      <div className="hidden xl:flex justify-start">
                          {t.status && (
                            <span className={`text-[9px] uppercase tracking-wider font-bold px-1.5 xl:px-2 py-1 rounded w-[70px] text-center truncate ${
                              t.status === TransacaoResponseDTO.status.PAGO ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                            }`}>
                              {statusLabel(t.status)}
                            </span>
                          )}
                      </div>

                      {/* Valor Fixo no Layout Grid */}
                      <div className="hidden xl:flex justify-end pr-1 xl:pr-3 truncate">
                        <p className={`text-[14px] xl:text-base font-bold tabular-nums tracking-tight whitespace-nowrap truncate ${t.tipo === TransacaoResponseDTO.tipo.RECEITA ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {t.tipo === TransacaoResponseDTO.tipo.RECEITA ? '+' : ''} {formatarMoeda(t.valor ?? 0, moeda)}
                        </p>
                      </div>

                      {/* Ações Limpas Fixas em uma Coluna Final - Aparece no Desktop transparente e no hover opaco! */}
                      <div className="hidden xl:flex items-center justify-end gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => abrirEditar(t)}
                          className="p-1.5 xl:p-2 rounded-lg text-muted-foreground hover:bg-white/10 hover:text-primary transition-all"
                          title={tr('Editar transação', 'Edit transaction')}
                        >
                          <Pencil size={18}/>
                        </button>
                        <button
                          onClick={() => setTransacaoParaDeletar(t)}
                          className="p-1.5 xl:p-2 rounded-lg text-muted-foreground hover:bg-rose-500/10 hover:text-rose-400 transition-all"
                          title={tr('Excluir transação', 'Delete transaction')}
                        >
                          <Trash2 size={18}/>
                        </button>
                      </div>

                      {/* MOBILE VIEW COMPONENTS - Renderizam dados compactos quando sm: é hidden */}
                      <div className="xl:hidden flex flex-col gap-2 mt-1 px-1 w-full border-t border-white/5 pt-2">
                          {/* Valores, Categorias e Data resumidos inline para Mobile */}
                          <div className="flex items-center justify-between">
                             <div className="flex items-center gap-2">
                               <span className="text-[11px] text-muted-foreground bg-white/5 px-2 py-1 rounded inline-flex uppercase tracking-wider font-semibold">
                                   {t.nomeCategoria || 'S/Categoria'}
                               </span>
                               {t.metodoPagamento && (
                                  <span className="text-[10px] text-muted-foreground/80 font-semibold px-1 max-w-[80px] truncate">
                                    {metodoLabel(t.metodoPagamento)}
                                  </span>
                               )}
                             </div>
                             <span className="text-[12px] text-muted-foreground font-medium whitespace-nowrap">
                                {t.data ? new Date(t.data + 'T12:00:00').toLocaleDateString(language, { day: '2-digit', month: 'short' }) : ''}
                             </span>
                          </div>
                          <div className="flex items-center justify-between mt-1 pt-1">
                             {t.status && (
                                <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded ${
                                  t.status === TransacaoResponseDTO.status.PAGO ? 'text-emerald-400 bg-emerald-500/10' : 'text-amber-400 bg-amber-500/10'
                                }`}>
                                  {statusLabel(t.status)}
                                </span>
                             )}
                             <p className={`text-lg font-bold tabular-nums tracking-tight ${t.tipo === TransacaoResponseDTO.tipo.RECEITA ? 'text-emerald-400' : 'text-rose-400'}`}>
                               {t.tipo === TransacaoResponseDTO.tipo.RECEITA ? '+' : ''} {formatarMoeda(t.valor ?? 0, moeda)}
                             </p>
                          </div>
                          
                          {/* Botoes de Ação no Mobile ficam cheios e lado a lado */}
                          <div className="flex items-center gap-2 mt-2">
                             <button onClick={() => abrirEditar(t)} className="flex-1 py-2 bg-secondary/30 rounded-lg flex items-center justify-center gap-2 text-xs font-bold text-muted-foreground hover:text-white transition-colors">
                                <Pencil size={14}/> {tr('Editar', 'Edit')}
                             </button>
                             <button onClick={() => setTransacaoParaDeletar(t)} className="flex-1 py-2 bg-rose-500/10 rounded-lg flex items-center justify-center gap-2 text-xs font-bold text-rose-400/80 hover:text-rose-400 transition-colors">
                                <Trash2 size={14}/> {tr('Excluir', 'Delete')}
                             </button>
                          </div>
                      </div>

                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Relatório */}
      <ReportModal 
         isOpen={modalRelatorioAberto}
         onClose={() => setModalRelatorioAberto(false)}
         tipoContextoFixo={tipoContextoFixo}
      />

      {/* Modal de Edição */}
      <TransactionModal
        isOpen={modalEditarAberto}
        onClose={fecharEditar}
        onSuccess={fecharEditar}
        transacaoParaEditar={transacaoParaEditar}
      />

      <DeleteConfirmationModal
        isOpen={!!transacaoParaDeletar}
        title={tr('Excluir Transação?', 'Delete Transaction?')}
        description={
          <>
            {tr('Você está prestes a excluir', 'You are about to delete')} <span className="text-white font-semibold">"{transacaoParaDeletar?.descricao}"</span>.
            <br />
            {tr('Esta ação não pode ser desfeita e o impacto no saldo será revertido.', 'This action cannot be undone and the balance impact will be reverted.')}
          </>
        }
        confirmText={tr('CONFIRMAR', 'CONFIRM')}
        loadingText={tr('EXCLUINDO...', 'DELETING...')}
        isLoading={deletarMutation.isPending}
        onCancel={() => {
          if (!deletarMutation.isPending) {
            setTransacaoParaDeletar(undefined);
          }
        }}
        onConfirm={() => {
          if (!transacaoParaDeletar?.id) return;
          deletarMutation.mutate(transacaoParaDeletar.id);
        }}
      />
    </MainLayout>
  );
};
