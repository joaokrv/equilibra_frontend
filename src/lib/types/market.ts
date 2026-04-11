export interface StockQuote {
  symbol: string;
  shortName: string;
  longName: string;
  regularMarketPrice: number;
  regularMarketChangePercent: number;
  logourl?: string;
}

export interface StockQuotesResponse {
  results: StockQuote[];
}

export interface ExchangeRate {
  code: string;
  codein: string;
  name: string;
  bid: string;
  pctChange: string;
  high: string;
  low: string;
}

export interface MoedaInfoDTO {
  valor: number;
  variacao: number;
}

export interface MercadoIndicadoresResponse {
  taxas: Record<string, number>;
  moedas: Record<string, MoedaInfoDTO>;
  indices: Record<string, MoedaInfoDTO>;
}
