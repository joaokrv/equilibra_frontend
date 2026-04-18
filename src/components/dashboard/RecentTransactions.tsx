import { TrendingUp, TrendingDown } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { enUS } from 'date-fns/locale';
import { formatarMoeda } from '../../lib/formatters';
import { TransacaoResponseDTO } from '../../api/models/TransacaoResponseDTO';
import { Link } from 'react-router-dom';
import { useI18nStore } from '../../store/useI18nStore';
import { t as translate } from '../../lib/i18n';


interface RecentTransactionsProps {
  transacoesList: TransacaoResponseDTO[];
}

export const RecentTransactions = ({ transacoesList }: RecentTransactionsProps) => {
  const language = useI18nStore((state) => state.language);
  const dateLocale = language === 'en-US' ? enUS : ptBR;

  return (
  <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
    <div className="glass p-4 sm:p-6 lg:p-8 rounded-2xl sm:rounded-3xl pb-6 sm:pb-10">
      <div className="flex items-center justify-between gap-3 mb-5 sm:mb-8">
        <h4 className="text-lg sm:text-xl font-bold text-white">{translate(language, 'topTransactions')}</h4>
        <Link 
          to="/extrato" 
          className="text-xs font-bold text-primary hover:underline uppercase tracking-widest transition-all hover:opacity-80"
        >
          {translate(language, 'viewAll')}
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-5 lg:gap-6">
        {transacoesList.slice(0, 3).map((transacao) => (
          <div
            key={transacao.id}
            className="flex items-start justify-between gap-3 p-3 sm:p-5 bg-secondary/20 rounded-xl sm:rounded-2xl border border-white/5 hover:border-primary/30 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
              <div
                className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl ${
                  transacao.tipo === TransacaoResponseDTO.tipo.RECEITA
                    ? 'bg-emerald-500/10 text-emerald-500'
                    : 'bg-rose-500/10 text-rose-500'
                } flex items-center justify-center group-hover:bg-primary/10 transition-colors`}
              >
                {transacao.tipo === TransacaoResponseDTO.tipo.RECEITA ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-white mb-0.5 truncate">{transacao.descricao}</p>
                <p className="text-[11px] uppercase text-muted-foreground tracking-[0.12em] font-bold truncate">
                  {transacao.nomeCategoria || translate(language, 'uncategorized')} •{' '}
                  {format(new Date(transacao.data!), 'dd MMM', { locale: dateLocale })}
                </p>
              </div>
            </div>
            <div className="text-right shrink-0 pl-2">
              <p
                className={`text-sm font-bold whitespace-nowrap ${
                  transacao.tipo === TransacaoResponseDTO.tipo.RECEITA ? 'text-emerald-500' : 'text-rose-500'
                }`}
              >
                {transacao.tipo === TransacaoResponseDTO.tipo.RECEITA ? '+' : '-'} {formatarMoeda(transacao.valor!)}
              </p>
            </div>
          </div>
        ))}
        {transacoesList.length === 0 && (
          <div className="col-span-full text-center py-10 text-muted-foreground text-sm font-medium">
            {translate(language, 'noTransactions')}
          </div>
        )}
      </div>
    </div>
  </div>
  );
};
