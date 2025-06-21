import React, { useState, useEffect, useCallback } from 'react';
import { 
  Typography, 
  Paper, 
  Grid, 
  Box, 
  CircularProgress, 
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Alert
} from '@mui/material';
import { stockDataService } from '../services/stockDataService';
import { 
  calculatePearsonCorrelation, 
  alignTimeSeriesData, 
  getCorrelationStrength,
  getCorrelationColor 
} from '../utils/correlationUtils';

function Heatmap({ stockList = [] }) {
  const [correlationMatrix, setCorrelationMatrix] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const calculateCorrelations = useCallback(async () => {
    if (stockList.length < 2) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const stockData = await stockDataService.getMultipleStocksData(stockList, 100);
      const matrix = {};
      for (let i = 0; i < stockList.length; i++) {
        matrix[stockList[i]] = {};
        for (let j = 0; j < stockList.length; j++) {
          const stock1 = stockList[i];
          const stock2 = stockList[j];
          if (i === j) {
            matrix[stock1][stock2] = 1;
          } else if (matrix[stock2] && matrix[stock2][stock1] !== undefined) {
            matrix[stock1][stock2] = matrix[stock2][stock1];
          } else {
            const data1 = stockData[stock1] || [];
            const data2 = stockData[stock2] || [];
            if (data1.length > 0 && data2.length > 0) {
              const { aligned1, aligned2 } = alignTimeSeriesData(data1, data2);
              const prices1 = aligned1.map(item => item.price);
              const prices2 = aligned2.map(item => item.price);
              matrix[stock1][stock2] = calculatePearsonCorrelation(prices1, prices2);
            } else {
              matrix[stock1][stock2] = 0;
            }
          }
        }
      }
      setCorrelationMatrix(matrix);
      setLastUpdated(new Date());
    } catch (err) {
      setError('Failed to calculate correlations. Please try again.');
      console.error('Correlation calculation error:', err);
    } finally {
      setLoading(false);
    }
  }, [stockList]);

  useEffect(() => {
    if (stockList.length >= 2) {
      calculateCorrelations();
    }
  }, [stockList, calculateCorrelations]);

  const renderCorrelationCell = (stock1, stock2, correlation) => {
    const cellStyle = {
      backgroundColor: getCorrelationColor(correlation),
      color: Math.abs(correlation) > 0.5 ? 'white' : 'black',
      fontWeight: 'bold',
      textAlign: 'center',
      minWidth: '80px',
      height: '60px'
    };
    return (
      <Tooltip 
        key={`${stock1}-${stock2}`}
        title={`${stock1} vs ${stock2}: ${correlation.toFixed(3)} (${getCorrelationStrength(correlation)})`}
      >
        <TableCell style={cellStyle}>
          {correlation.toFixed(2)}
        </TableCell>
      </Tooltip>
    );
  };

  if (stockList.length < 2) {
    return (
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Correlation Heatmap
        </Typography>
        <Alert severity="info">
          Select at least 2 stocks to view correlation analysis
        </Alert>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3, mt: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">
          Stock Correlation Heatmap
        </Typography>
        {lastUpdated && (
          <Typography variant="caption" color="textSecondary">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </Typography>
        )}
      </Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <Grid container spacing={2} mb={2}>
        <Grid item xs={12}>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Correlation coefficients range from -1 to +1. Values closer to ±1 indicate stronger correlation.
          </Typography>
          <Box display="flex" gap={1} flexWrap="wrap">
            <Chip 
              label="Strong Positive (0.6 to 1.0)" 
              style={{ backgroundColor: 'rgba(33, 150, 243, 0.8)', color: 'white' }}
              size="small"
            />
            <Chip 
              label="Moderate (0.3 to 0.6)" 
              style={{ backgroundColor: 'rgba(33, 150, 243, 0.5)' }}
              size="small"
            />
            <Chip 
              label="Weak (-0.3 to 0.3)" 
              style={{ backgroundColor: 'rgba(158, 158, 158, 0.3)' }}
              size="small"
            />
            <Chip 
              label="Strong Negative (-1.0 to -0.6)" 
              style={{ backgroundColor: 'rgba(244, 67, 54, 0.8)', color: 'white' }}
              size="small"
            />
          </Box>
        </Grid>
      </Grid>
      {loading ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
          <Typography variant="body2" ml={2}>
            Calculating correlations...
          </Typography>
        </Box>
      ) : (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell style={{ fontWeight: 'bold' }}>Stock</TableCell>
                {stockList.map(stock => (
                  <TableCell 
                    key={stock} 
                    style={{ fontWeight: 'bold', textAlign: 'center', minWidth: '80px' }}
                  >
                    {stock}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {stockList.map(stock1 => (
                <TableRow key={stock1}>
                  <TableCell style={{ fontWeight: 'bold' }}>
                    {stock1}
                  </TableCell>
                  {stockList.map(stock2 => {
                    const correlation = correlationMatrix[stock1]?.[stock2] || 0;
                    return renderCorrelationCell(stock1, stock2, correlation);
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Paper>
  );
}

export default Heatmap;