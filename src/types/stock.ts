export interface StockPrice {
  price: number;
  timestamp: string;
}

export interface StockData {
  stocks: Record<string, string>;
}

export interface CorrelationMatrix {
  [stockSymbol: string]: {
    [stockSymbol: string]: number;
  };
}

export interface StockStatistics {
  mean: string;
  stdDev: string;
  min: string;
  max: string;
  latest: string;
  change: string;
  changePercent: string;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
}