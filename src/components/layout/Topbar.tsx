import { useState, useRef, useEffect } from 'react';
import { Search, User, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ContasService } from '../../api/services/ContasService';
import { CategoriasService } from '../../api/services/CategoriasService';
import { TransacoesService } from '../../api/services/TransacoesService';
import { formatarMoeda } from '../../lib/formatters';
import { useI18nStore } from '../../store/useI18nStore';
import { t } from '../../lib/i18n';
import { usePrivacyStore } from '../../store/usePrivacyStore';

interface ResultadoBusca {
  tipo: 'conta' | 'categoria' | 'transacao';
  label: string;
  detalhe: string;
  rota: string;
}

export const Topbar = () => {
  const user = useAuthStore((state) => state.user);
  const language = useI18nStore((state) => state.language);
  const hideValues = usePrivacyStore((state) => state.hideValues);
  const toggleHideValues = usePrivacyStore((state) => state.toggleHideValues);
  const moeda = (user?.moeda as 'BRL' | 'USD' | 'EUR') || 'BRL';
  const navigate = useNavigate();
  const [busca, setBusca] = useState('');
  const [focado, setFocado] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const hoje = new Date();

  const { data: contas = [] } = useQuery({
    queryKey: ['contas'],
    queryFn: () => ContasService.listarContas(),
  });

  const { data: categorias = [] } = useQuery({
    queryKey: ['categorias'],
    queryFn: () => CategoriasService.listarCategorias(),
  });

  const { data: transacoes = [] } = useQuery({
    queryKey: ['transacoes', hoje.getFullYear(), hoje.getMonth() + 1],
    queryFn: () => TransacoesService.listarMensal(hoje.getFullYear(), hoje.getMonth() + 1),
  });

  const listaTransacoes = Array.isArray(transacoes) ? transacoes : (transacoes as any)?.content ?? [];
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setFocado(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const termo = busca.toLowerCase().trim();

  const resultados: ResultadoBusca[] = termo.length < 2 ? [] : [
    ...contas
      .filter((c) => c.nome?.toLowerCase().includes(termo))
      .map((c): ResultadoBusca => ({
        tipo: 'conta',
        label: c.nome || '',
        detalhe: hideValues ? '• • • • • •' : formatarMoeda(c.saldo ?? 0, moeda),
        rota: `/contas?busca=${encodeURIComponent(busca.trim())}`,
      })),
    ...categorias
      .filter((c: any) => c.nome?.toLowerCase().includes(termo))
      .map((c: any): ResultadoBusca => ({
        tipo: 'categoria',
        label: c.nome || '',
        detalhe: c.tipo === 'RECEITA' ? t(language, 'typeIncome') : t(language, 'typeExpense'),
        rota: `/categorias?busca=${encodeURIComponent(busca.trim())}`,
      })),
    ...listaTransacoes
      .filter((t: any) =>
        t.descricao?.toLowerCase().includes(termo)
        || t.nomeCategoria?.toLowerCase().includes(termo)
        || t.nomeConta?.toLowerCase().includes(termo)
        || t.nomeCartao?.toLowerCase().includes(termo),
      )
      .slice(0, 5)
      .map((t: any): ResultadoBusca => ({
        tipo: 'transacao',
        label: t.descricao || '',
        detalhe: hideValues ? '• • • • • •' : `${t.tipo === 'RECEITA' ? '+' : '-'} ${formatarMoeda(t.valor ?? 0, moeda)}${t.nomeCategoria ? ` • ${t.nomeCategoria}` : ''}`,
        rota: `/extrato?busca=${encodeURIComponent(busca.trim())}`,
      })),
  ].slice(0, 8);

  const handleSelect = (r: ResultadoBusca) => {
    navigate(r.rota);
    setBusca('');
    setFocado(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && termo.length >= 2) {
      const primeiroResultado = resultados[0];
      const rotaDestino = primeiroResultado?.rota ?? `/extrato?busca=${encodeURIComponent(busca.trim())}`;
      navigate(rotaDestino);
      setFocado(false);
      inputRef.current?.blur();
      return;
    }

    if (e.key === 'Escape') {
      setBusca('');
      setFocado(false);
      inputRef.current?.blur();
    }
  };

  return (
    <header className="min-h-14 sm:h-16 flex items-center justify-between gap-3 px-3 sm:px-4 lg:px-8 border-b border-white/5 bg-background/70 backdrop-blur-sm sticky top-0 z-[70]">
      <div className="flex-1 max-w-none sm:max-w-xl" ref={containerRef}>
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={16} />
          <input
            ref={inputRef}
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            onFocus={() => setFocado(true)}
            onKeyDown={handleKeyDown}
            placeholder={t(language, 'searchPlaceholder')}
            id="search-global"
            className="w-full bg-secondary/30 h-9 sm:h-10 pl-9 sm:pl-10 pr-3 sm:pr-4 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all border border-transparent focus:bg-secondary/50"
          />

          {/* Dropdown de resultados */}
          {focado && termo.length >= 2 && (
            <div className="absolute top-11 sm:top-12 left-0 w-full rounded-xl border border-white/10 bg-slate-950/95 backdrop-blur-xl shadow-2xl overflow-hidden z-[80] animate-in fade-in slide-in-from-top-2 duration-150">
              {resultados.length === 0 ? (
                <div className="px-4 py-3 text-xs text-muted-foreground">{t(language, 'searchNoResults')} "{busca}"</div>
              ) : (
                resultados.map((r, i) => (
                  <button
                    key={`${r.tipo}-${r.label}-${i}`}
                    onClick={() => handleSelect(r)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/10 transition-all text-left"
                  >
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                      r.tipo === 'conta' ? 'bg-primary/10 text-primary' :
                      r.tipo === 'categoria' ? 'bg-amber-500/10 text-amber-400' :
                      'bg-emerald-500/10 text-emerald-400'
                    }`}>
                      {r.tipo === 'conta' ? t(language, 'searchTagAccount') : r.tipo === 'categoria' ? t(language, 'searchTagCategory') : t(language, 'searchTagTransaction')}
                    </span>
                    <span className="text-sm font-medium text-white truncate flex-1">{r.label}</span>
                    <span className="text-xs text-muted-foreground flex-shrink-0">{r.detalhe}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 ml-0 sm:ml-4 lg:ml-8">
        <button
          type="button"
          onClick={toggleHideValues}
          aria-label={hideValues ? t(language, 'privacyShowValues') : t(language, 'privacyHideValues')}
          title={hideValues ? t(language, 'privacyShowValues') : t(language, 'privacyHideValues')}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-secondary/50 border border-white/10 hover:border-primary/50 text-muted-foreground hover:text-white transition-all flex items-center justify-center"
        >
          {hideValues ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>

        <Link to="/perfil" className="flex items-center gap-2 sm:gap-3 pl-0 sm:pl-4 lg:pl-6 border-l-0 sm:border-l border-white/5 cursor-pointer group min-w-0">
          <div className="text-right hidden md:block min-w-0">
            <p className="text-sm font-semibold group-hover:text-primary transition-colors">
              {user?.nome || t(language, 'userFallback')}
            </p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold truncate max-w-[180px] lg:max-w-[260px]">
              {user?.email || ''}
            </p>
          </div>
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-secondary border border-white/10 flex items-center justify-center overflow-hidden group-hover:border-primary/50 transition-all shadow-inner">
            {user?.fotoBase64 ? (
              <img
                src={`data:image/png;base64,${user.fotoBase64}`}
                alt={user.nome}
                className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500"
              />
            ) : (
              <User size={18} className="text-muted-foreground group-hover:text-white transition-colors" />
            )}
          </div>
        </Link>
      </div>
    </header>
  );
};
