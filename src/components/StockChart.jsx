import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { 
  Typography, 
  Paper, 
  Box, 
  CircularProgress, 
  Alert,
  Chip
} from '@mui/material';
import 'chart.js/auto';
import { stockDataService } from '../services/stockDataService';
import { calculateStandardDeviation, calculateMean } from '../utils/correlationUtils';

const StockChart = ({ stock }) => {
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [statistics, setStatistics] = useState({
    mean: '0',
    stdDev: '0',
    min: '0',
    max: '0',
    latest: '0',
    change: '0',
    changePercent: '0'
  });

  useEffect(() => {
    if (!stock) return;
    
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const data = await stockDataService.getStockData(stock, 50);
        setPrices(data);
        
        if (data.length > 0) {
          const priceValues = data.map(p => p.price);
          const mean = calculateMean(priceValues);
          const stdDev = calculateStandardDeviation(priceValues);
          const min = Math.min(...priceValues);
          const max = Math.max(...priceValues);
          const latest = priceValues[priceValues.length - 1];
          const change = priceValues.length > 1 ? latest - priceValues[0] : 0;
          const changePercent = priceValues.length > 1 ? (change / priceValues[0]) * 100 : 0;
          
          setStatistics({
            mean: mean.toFixed(2),
            stdDev: stdDev.toFixed(2),
            min: min.toFixed(2),
            max: max.toFixed(2),
            latest: latest.toFixed(2),
            change: change.toFixed(2),
            changePercent: changePercent.toFixed(2)
          });
        }
      } catch (err) {
        setError(`Failed to load data for ${stock}`);
        console.error('Chart data fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [stock]);

  if (!stock) {
    return (
      <Paper sx={{ p: 3, mt: 2 }}>
        <Alert severity="info">
          Select a stock to view its price chart
        </Alert>
      </Paper>
    );
  }

  const chartData = {
    labels: prices.map((_, i) => `${prices.length - i - 1}m ago`),
    datasets: [{
      label: `${stock} Price ($)`,
      data: prices.map(p => p.price),
      borderColor: '#2196F3',
      backgroundColor: 'rgba(33, 150, 243, 0.1)',
      fill: true,
      tension: 0.1,
      pointRadius: 2,
      pointHoverRadius: 5,
      borderWidth: 2
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: `${stock} Price Movement (Last 50 Minutes)`
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        title: {
          display: true,
          text: 'Price ($)'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Time'
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index'
    }
  };

  return (
    <Paper sx={{ p: 3, mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        📈 {stock} Stock Analysis
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" p={4}>
          <CircularProgress />
          <Typography variant="body2" ml={2}>
            Loading {stock} data...
          </Typography>
        </Box>
      ) : prices.length > 0 ? (
        <>
          <div style={{ marginBottom: '16px' }}>
            <Typography variant="subtitle2" gutterBottom>
              Key Statistics:
            </Typography>
            <Box display="flex" gap={1} flexWrap="wrap">
              <Chip 
                label={`Current: $${statistics.latest}`} 
                color="primary" 
                variant="outlined"
              />
              <Chip 
                label={`Change: $${statistics.change} (${statistics.changePercent}%)`}
                color={parseFloat(statistics.change) >= 0 ? "success" : "error"}
                variant="outlined"
              />
              <Chip 
                label={`Avg: $${statistics.mean}`} 
                variant="outlined"
              />
              <Chip 
                label={`Range: $${statistics.min} - $${statistics.max}`} 
                variant="outlined"
              />
              <Chip 
                label={`Volatility (σ): $${statistics.stdDev}`} 
                variant="outlined"
              />
            </Box>
          </div>

          <Box height={400}>
            <Line data={chartData} options={chartOptions} />
          </Box>

          <Typography variant="caption" color="textSecondary" mt={2} display="block">
            Data points: {prices.length} | Last updated: {new Date().toLocaleTimeString()}
          </Typography>
        </>
      ) : (
        <Alert severity="warning">
          No data available for {stock}
        </Alert>
      )}
    </Paper>
  );
};

export default StockChart;