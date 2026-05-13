import React from 'react';
import { useMarket } from '../../hooks/useMarket';
import { TrendingUp, TrendingDown, DollarSign, BarChart2, Percent, Bitcoin } from 'lucide-react';
import type { StockQuote } from '../../lib/types/market';

interface TickerItem {
  key: string;
  icon: React.ReactNode;
  label: string;
  value: string;
  change?: string;
  changePositive?: boolean;
  href: string;
  iconBg: string;
}

export const MarketTicker: React.FC = () => {
  const { stocks, exchange, eurExchange, indicadores, isLoading } = useMarket();

  if (isLoading) {
    return (
      <div className="w-full bg-slate-900/50 backdrop-blur-md border-b border-white/5 h-10 flex items-center px-4 overflow-hidden">
        <div className="flex gap-8 animate-pulse">
          <div className="h-4 w-24 bg-white/10 rounded" />
          <div className="h-4 w-24 bg-white/10 rounded" />
          <div className="h-4 w-24 bg-white/10 rounded" />
        </div>
      </div>
    );
  }

  const taxas = indicadores?.taxas ?? {};
  const indices = indicadores?.indices ?? {};

  const ibov = indices['IBOVESPA'];
  const ifix = indices['IFIX'];
  const selic = taxas['SELIC'];
  const cdi = taxas['CDI'];
  const ipca = taxas['IPCA'];
  const juroReal = selic != null && ipca != null ? Number(selic) - Number(ipca) : null;
  const btc = indices['BITCOIN'];
  const nasdaq = indices['NASDAQ'];
  const dowjones = indices['DOWJONES'];
  const items: TickerItem[] = [];

  if (ibov?.valor != null && ibov.variacao != null) {
    const pos = Number(ibov.variacao) >= 0;
    items.push({
      key: 'ibov', label: 'IBOV',
      value: Number(ibov.valor).toLocaleString('pt-BR', { maximumFractionDigits: 0 }),
      change: `${pos ? '+' : ''}${Number(ibov.variacao).toFixed(2)}%`,
      changePositive: pos,
      icon: pos ? <TrendingUp size={14} /> : <TrendingDown size={14} />,
      iconBg: pos ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400',
      href: 'https://finance.yahoo.com/quote/%5EBVSP/',
    });
  }

  if (ifix?.valor != null && ifix.variacao != null) {
    const pos = Number(ifix.variacao) >= 0;
    items.push({
      key: 'ifix', label: 'FIIs',
      value: Number(ifix.valor).toLocaleString('pt-BR', { maximumFractionDigits: 0 }),
      change: `${pos ? '+' : ''}${Number(ifix.variacao).toFixed(2)}%`,
      changePositive: pos,
      icon: pos ? <TrendingUp size={14} /> : <TrendingDown size={14} />,
      iconBg: pos ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400',
      href: 'https://www.b3.com.br/pt_br/market-data-e-indices/indices/indices-de-segmentos-e-setoriais/ifix.htm',
    });
  }

  if (selic != null) {
    items.push({
      key: 'selic', label: 'SELIC', value: `${Number(selic).toFixed(2)}% a.a.`,
      icon: <Percent size={14} />, iconBg: 'bg-violet-500/10 text-violet-400',
      href: 'https://www.bcb.gov.br/controleinflacao/taxaselic',
    });
  }

  if (cdi != null) {
    items.push({
      key: 'cdi', label: 'CDI', value: `${Number(cdi).toFixed(2)}% a.a.`,
      icon: <Percent size={14} />, iconBg: 'bg-indigo-500/10 text-indigo-400',
      href: 'https://www.b3.com.br/pt_br/market-data-e-indices/indices/indices-de-renda-fixa/cdi.htm',
    });
  }

  if (ipca != null) {
    items.push({
      key: 'ipca', label: 'IPCA', value: `${Number(ipca).toFixed(2)}% a.a.`,
      icon: <BarChart2 size={14} />, iconBg: 'bg-amber-500/10 text-amber-400',
      href: 'https://www.ibge.gov.br/explica/inflacao.php',
    });
  }

  if (juroReal != null) {
    const pos = juroReal >= 0;
    items.push({
      key: 'juro-real', label: 'JURO REAL', value: `${juroReal.toFixed(2)}%`,
      change: `${pos ? '+' : ''}${juroReal.toFixed(2)}%`,
      changePositive: pos,
      icon: pos ? <TrendingUp size={14} /> : <TrendingDown size={14} />,
      iconBg: pos ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400',
      href: 'https://www.bcb.gov.br/controleinflacao/taxaselic',
    });
  }

  if (nasdaq?.valor != null) {
    const pos = Number(nasdaq.variacao) >= 0;
    items.push({
      key: 'nasdaq', label: 'NASDAQ',
      value: Number(nasdaq.valor).toLocaleString('pt-BR', { maximumFractionDigits: 0 }),
      change: nasdaq.variacao != null ? `${pos ? '+' : ''}${Number(nasdaq.variacao).toFixed(2)}%` : undefined,
      changePositive: pos,
      icon: pos ? <TrendingUp size={14} /> : <TrendingDown size={14} />,
      iconBg: pos ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400',
      href: 'https://finance.yahoo.com/quote/%5EIXIC/',
    });
  }

  if (dowjones?.valor != null) {
    const pos = Number(dowjones.variacao) >= 0;
    items.push({
      key: 'dowjones', label: 'DOW',
      value: Number(dowjones.valor).toLocaleString('pt-BR', { maximumFractionDigits: 0 }),
      change: dowjones.variacao != null ? `${pos ? '+' : ''}${Number(dowjones.variacao).toFixed(2)}%` : undefined,
      changePositive: pos,
      icon: pos ? <TrendingUp size={14} /> : <TrendingDown size={14} />,
      iconBg: pos ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400',
      href: 'https://finance.yahoo.com/quote/%5EDJI/',
    });
  }

  if (exchange?.bid && exchange.pctChange) {
    const pos = parseFloat(exchange.pctChange) >= 0;
    items.push({
      key: 'usd', label: 'USD', value: `R$ ${parseFloat(exchange.bid).toFixed(2)}`,
      change: `${pos ? '+' : ''}${exchange.pctChange}%`, changePositive: pos,
      icon: <DollarSign size={14} />, iconBg: 'bg-emerald-500/10 text-emerald-400',
      href: 'https://economia.awesomeapi.com.br/last/USD-BRL',
    });
  }

  if (eurExchange?.bid && eurExchange.pctChange) {
    const pos = parseFloat(eurExchange.pctChange) >= 0;
    items.push({
      key: 'eur', label: 'EUR', value: `R$ ${parseFloat(eurExchange.bid).toFixed(2)}`,
      change: `${pos ? '+' : ''}${eurExchange.pctChange}%`, changePositive: pos,
      icon: <DollarSign size={14} />, iconBg: 'bg-blue-500/10 text-blue-400',
      href: 'https://economia.awesomeapi.com.br/last/EUR-BRL',
    });
  }

  if (btc?.valor != null) {
    const pos = Number(btc.variacao) >= 0;
    items.push({
      key: 'btc', label: 'BTC',
      value: `R$ ${Number(btc.valor).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`,
      change: btc.variacao != null ? `${pos ? '+' : ''}${Number(btc.variacao).toFixed(2)}%` : undefined,
      changePositive: pos,
      icon: <Bitcoin size={14} />, iconBg: 'bg-orange-500/10 text-orange-400',
      href: 'https://finance.yahoo.com/quote/BTC-BRL/',
    });
  }
  stocks.forEach((stock: StockQuote) => {
    const pos = stock.regularMarketChangePercent >= 0;
    items.push({
      key: stock.symbol, label: stock.symbol,
      value: `R$ ${stock.regularMarketPrice.toFixed(2)}`,
      change: `${pos ? '+' : ''}${stock.regularMarketChangePercent.toFixed(2)}%`,
      changePositive: pos,
      icon: pos ? <TrendingUp size={14} /> : <TrendingDown size={14} />,
      iconBg: pos ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400',
      href: `https://finance.yahoo.com/quote/${stock.symbol}.SA/`,
    });
  });

  if (items.length === 0) return null;

  const renderItem = (item: TickerItem, suffix: string) => (
    <a
      key={`${item.key}-${suffix}`}
      href={item.href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 pr-6 mr-1 group cursor-pointer hover:bg-white/5 px-2 py-1 rounded transition-all flex-shrink-0"
    >
      <div className={`p-1 rounded ${item.iconBg} group-hover:brightness-125 transition-all`}>{item.icon}</div>
      <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">{item.label}</span>
      <span className="text-sm font-bold text-white">{item.value}</span>
      {item.change && (
        <span className={`text-[10px] font-bold ${item.changePositive ? 'text-emerald-400' : 'text-rose-400'}`}>
          {item.change}
        </span>
      )}
    </a>
  );
  const duration = Math.max(30, items.length * 4);

  return (
    <div className="w-full bg-slate-900/80 backdrop-blur-xl border-b border-white/10 h-11 flex items-center overflow-hidden relative z-40 group/ticker">
      <div
        className="flex items-center whitespace-nowrap ticker-scroll"
        style={{ animationDuration: `${duration}s` }}
        onMouseEnter={(e) => (e.currentTarget.style.animationPlayState = 'paused')}
        onMouseLeave={(e) => (e.currentTarget.style.animationPlayState = 'running')}
      >
        {/* Duplica os itens para criar loop infinito */}
        {items.map((item) => renderItem(item, 'a'))}
        {items.map((item) => renderItem(item, 'b'))}
      </div>

      <style>{`
        @keyframes ticker-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .ticker-scroll {
          animation: ticker-scroll linear infinite;
        }
      `}</style>
    </div>
  );
};
