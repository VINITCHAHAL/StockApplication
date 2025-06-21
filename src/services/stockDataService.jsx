import { StockPrice, StockData, CacheEntry } from '../types/stock';
import { mockStockDataService } from './mockStockDataService';

class StockDataService {
  private cache = new Map<string, CacheEntry<any>>();
  private baseUrl = 'http://20.244.56.144/evaluation-service';
  private cacheTTL = 60000;
  private useMockData = false;

  async checkApiAvailability(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/stocks`, { 
        method: 'GET'
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  private getCacheKey(stock: string, minutes: number): string {
    return `${stock}_${minutes}_${Math.floor(Date.now() / this.cacheTTL)}`;
  }

  private isCacheValid<T>(cacheEntry: CacheEntry<T>): boolean {
    return Date.now() - cacheEntry.timestamp < this.cacheTTL;
  }

  async getStockList(): Promise<string[]> {
    const cacheKey = 'stockList';
    const cached = this.cache.get(cacheKey);
    
    if (cached && this.isCacheValid(cached)) {
      return cached.data;
    }

    try {
      const response = await fetch(`${this.baseUrl}/stocks`);
      if (!response.ok) {
        throw new Error('API not available');
      }
      const data: StockData = await response.json();
      const symbols = Object.values(data.stocks);
      
      this.cache.set(cacheKey, {
        data: symbols,
        timestamp: Date.now()
      });
      
      return symbols;
    } catch (error) {
      this.useMockData = true;
      return await mockStockDataService.getStockList();
    }
  }

  async getStockData(stock: string, minutes: number = 50): Promise<StockPrice[]> {
    if (this.useMockData) {
      return await mockStockDataService.getStockData(stock, minutes);
    }

    const cacheKey = this.getCacheKey(stock, minutes);
    const cached = this.cache.get(cacheKey);
    
    if (cached && this.isCacheValid(cached)) {
      return cached.data;
    }

    try {
      const response = await fetch(`${this.baseUrl}/stocks/${stock}?minutes=${minutes}`);
      if (!response.ok) {
        throw new Error('API not available');
      }
      const data: StockPrice[] = await response.json();
      
      this.cache.set(cacheKey, {
        data: data,
        timestamp: Date.now()
      });
      
      return data;
    } catch (error) {
      this.useMockData = true;
      return await mockStockDataService.getStockData(stock, minutes);
    }
  }

  async getMultipleStocksData(stocks: string[], minutes: number = 50): Promise<Record<string, StockPrice[]>> {
    if (this.useMockData) {
      return await mockStockDataService.getMultipleStocksData(stocks, minutes);
    }

    const promises = stocks.map(stock => this.getStockData(stock, minutes));
    const results = await Promise.allSettled(promises);
    
    return results.reduce((acc, result, index) => {
      if (result.status === 'fulfilled') {
        acc[stocks[index]] = result.value;
      }
      return acc;
    }, {} as Record<string, StockPrice[]>);
  }

  clearExpiredCache(): void {
    for (const [key, entry] of this.cache.entries()) {
      if (!this.isCacheValid(entry)) {
        this.cache.delete(key);
      }
    }
  }

  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      usingMockData: this.useMockData
    };
  }
}

export const stockDataService = new StockDataService();

setInterval(() => {
  stockDataService.clearExpiredCache();
}, 300000);

export default stockDataService;