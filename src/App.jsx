import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Grid, 
  Paper, 
  Box,
  Alert,
  CircularProgress
} from '@mui/material';
import StockSelector from './components/StockSelector.jsx';
import StockChart from './components/StockChart.jsx';
import Heatmap from './components/Heatmap.jsx';
import { stockDataService } from './services/stockDataService.js';

function App() {
  const [selectedStock, setSelectedStock] = useState('');
  const [selectedStocksForCorrelation, setSelectedStocksForCorrelation] = useState([]);
  const [stockList, setStockList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStocks = async () => {
      try {
        setLoading(true);
        setError(null);
        const symbols = await stockDataService.getStockList();
        setStockList(symbols);
      } catch (err) {
        console.error('Error fetching stocks:', err);
        setStockList(['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA']);
        setError(null);
      } finally {
        setLoading(false);
      }
    };

    fetchStocks();
  }, []);

  const handleSingleStockSelect = (stock) => {
    setSelectedStock(stock);
  };

  const handleMultipleStockSelect = (stocks) => {
    setSelectedStocksForCorrelation(stocks);
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress size={60} />
          <Typography variant="h6" ml={2}>
            Loading Stock Price Aggregator...
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <Typography variant="h3" component="h1" gutterBottom align="center">
          📈 Stock Price Aggregator
        </Typography>
        <Typography variant="h6" align="center" sx={{ opacity: 0.9 }}>
          Real-time stock analysis with correlation insights
        </Typography>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} lg={6}>
          <Paper elevation={2} sx={{ p: 3, height: 'fit-content' }}>
            <Typography variant="h5" gutterBottom color="primary">
              📊 Individual Stock Analysis
            </Typography>
            <StockSelector 
              stocks={stockList} 
              onSelect={handleSingleStockSelect}
              selectedStocks={selectedStock ? [selectedStock] : []}
              multiSelect={false}
            />
            {selectedStock && <StockChart stock={selectedStock} />}
          </Paper>
        </Grid>

        <Grid item xs={12} lg={6}>
          <Paper elevation={2} sx={{ p: 3, height: 'fit-content' }}>
            <Typography variant="h5" gutterBottom color="primary">
              🔗 Correlation Analysis
            </Typography>
            <StockSelector 
              stocks={stockList} 
              onSelect={handleMultipleStockSelect}
              selectedStocks={selectedStocksForCorrelation}
              multiSelect={true}
            />
            
            {selectedStocksForCorrelation.length >= 2 && (
              <Alert severity="info" sx={{ mt: 2 }}>
                Analyzing correlations for {selectedStocksForCorrelation.length} stocks using Pearson&apos;s correlation coefficient
              </Alert>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Heatmap stockList={selectedStocksForCorrelation} />
        </Grid>
      </Grid>
    </Container>
  );
}

export default App;
