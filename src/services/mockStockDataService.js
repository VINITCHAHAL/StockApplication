class MockStockDataService {
  constructor() {
    this.cache = new Map();
    this.cacheTTL = 60000;
    this.mockStocks = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'META', 'NFLX', 'NVDA'];
  }

  generateMockPriceData(stock, minutes = 50) {
    const basePrice = this.getBasePriceForStock(stock);
    const data = [];
    let currentPrice = basePrice;
    
    for (let i = 0; i < minutes; i++) {
      const change = (Math.random() - 0.5) * (basePrice * 0.02);
      currentPrice = Math.max(currentPrice + change, basePrice * 0.8);
      
      data.push({
        price: parseFloat(currentPrice.toFixed(2)),
        timestamp: new Date(Date.now() - (minutes - i) * 60000).toISOString()
      });
    }
    
    return data;
  }

  getBasePriceForStock(stock) {
    const basePrices = {
      'AAPL': 150,
      'GOOGL': 2800,
      'MSFT': 310,
      'AMZN': 3200,
      'TSLA': 800,
      'META': 250,
      'NFLX': 400,
      'NVDA': 450
    };
    return basePrices[stock] || 100;
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

    await new Promise(resolve => setTimeout(resolve, 200));
    
    const data = this.mockStocks;
    
    this.cache.set(cacheKey, {
      data: data,
      timestamp: Date.now()
    });
    
    return data;
  }

  async getStockData(stock, minutes = 50) {
    const cacheKey = this.getCacheKey(stock, minutes);
    const cached = this.cache.get(cacheKey);
    
    if (cached && this.isCacheValid(cached)) {
      return cached.data;
    }

    await new Promise(resolve => setTimeout(resolve, 300));
    
    const data = this.generateMockPriceData(stock, minutes);
    
    this.cache.set(cacheKey, {
      data: data,
      timestamp: Date.now()
    });
    
    return data;
  }

  async getMultipleStocksData(stocks, minutes = 50) {
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
      keys: Array.from(this.cache.keys())
    };
  }
}

export const mockStockDataService = new MockStockDataService();