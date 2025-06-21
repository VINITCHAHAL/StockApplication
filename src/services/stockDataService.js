import { mockStockDataService } from './mockStockDataService.js';

class StockDataService {
  constructor() {
    this.cache = new Map();
    this.baseUrl = 'http://20.244.56.144/evaluation-service';
    this.cacheTTL = 60000;
    this.useMockData = false;
    this.authToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiJ2aW5pdGNoYWhhbDI0MUBnbWFpbC5jb20iLCJleHAiOjE3NTA0ODYwMDEsImlhdCI6MTc1MDQ4NTcwMSwiaXNzIjoiQWZmb3JkIE1lZGljYWwgVGVjaG5vbG9naWVzIFByaXZhdGUgTGltaXRlZCIsImp0aSI6Ijc4OWZhNDk1LTM1NjEtNDAwMC1hYTQ2LWJlMTViN2UwNDdiYiIsImxvY2FsZSI6ImVuLUlOIiwibmFtZSI6InZpbml0IGt1bWFyIGNob3VkaGFyeSIsInN1YiI6IjY2YTYxYzA4LTI4OWItNDdlZC1iNjhjLWM4MTVhOTUyYmE1YSJ9LCJlbWFpbCI6InZpbml0Y2hhaGFsMjQxQGdtYWlsLmNvbSIsIm5hbWUiOiJ2aW5pdCBrdW1hciBjaG91ZGhhcnkiLCJyb2xsTm8iOiIyMmJjczE0MCIsImFjY2Vzc0NvZGUiOiJXY1RTS3YiLCJjbGllbnRJRCI6IjY2YTYxYzA4LTI4OWItNDdlZC1iNjhjLWM4MTVhOTUyYmE1YSIsImNsaWVudFNlY3JldCI6InB6Tk1uRmJIRVBSbWtYd0QifQ.UOpGZpTPR1GucUCxcC04mU3EYZWu9nPeHqvFd7OANxY';
  }

  getHeaders() {
    return {
      'Authorization': `Bearer ${this.authToken}`,
      'Content-Type': 'application/json'
    };
  }

  async checkApiAvailability() {
    try {
      const response = await fetch(`${this.baseUrl}/stocks`, { 
        method: 'GET',
        headers: this.getHeaders()
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  getCacheKey(stock, minutes) {
    return `${stock}_${minutes}_${Math.floor(Date.now() / this.cacheTTL)}`;
  }
  isCacheValid(cacheEntry) {
    return Date.now() - cacheEntry.timestamp < this.cacheTTL;
  }
  async getStockList() {
    const cacheKey = 'stockList';
    const cached = this.cache.get(cacheKey);
    
    if (cached && this.isCacheValid(cached)) {
      return cached.data;
    }
    try {
      const response = await fetch(`${this.baseUrl}/stocks`, {
        headers: this.getHeaders()
      });
      if (!response.ok) {
        throw new Error('API not available');
      }
      const data = await response.json();
      const symbols = Object.values(data.stocks);
      this.cache.set(cacheKey, {
        data: symbols,
        timestamp: Date.now()
      });
      return symbols;
    } catch (error) {
      console.error('API Error:', error);
      this.useMockData = true;
      return await mockStockDataService.getStockList();
    }
  }
  async getStockData(stock, minutes = 50) {
    if (this.useMockData) {
      return await mockStockDataService.getStockData(stock, minutes);
    }
    const cacheKey = this.getCacheKey(stock, minutes);
    const cached = this.cache.get(cacheKey);
    if (cached && this.isCacheValid(cached)) {
      return cached.data;
    }
    try {
      const response = await fetch(`${this.baseUrl}/stocks/${stock}?minutes=${minutes}`, {
        headers: this.getHeaders()
      });
      if (!response.ok) {
        throw new Error('API not available');
      }
      const data = await response.json();
      
      // Transform the API response to match our StockPrice interface
      const transformedData = Array.isArray(data) ? data.map(item => ({
        price: item.price,
        timestamp: item.lastUpdatedAt || new Date().toISOString()
      })) : [];
      
      this.cache.set(cacheKey, {
        data: transformedData,
        timestamp: Date.now()
      });
      return transformedData;
    } catch (error) {
      console.error('Stock data fetch error:', error);
      this.useMockData = true;
      return await mockStockDataService.getStockData(stock, minutes);
    }
  }
  async getMultipleStocksData(stocks, minutes = 50) {
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
    }, {});
  }
  clearExpiredCache() {
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