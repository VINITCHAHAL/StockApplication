export const calculateMean = (data) => {
  return data.reduce((sum, value) => sum + value, 0) / data.length;
};

export const calculateStandardDeviation = (data) => {
  const mean = calculateMean(data);
  const squaredDiffs = data.map(value => Math.pow(value - mean, 2));
  const variance = calculateMean(squaredDiffs);
  return Math.sqrt(variance);
};

export const calculateCovariance = (dataX, dataY) => {
  if (dataX.length !== dataY.length) {
    throw new Error('Datasets must have the same length');
  }
  
  const meanX = calculateMean(dataX);
  const meanY = calculateMean(dataY);
  
  const covariance = dataX.reduce((sum, x, i) => {
    return sum + (x - meanX) * (dataY[i] - meanY);
  }, 0) / (dataX.length - 1);
  
  return covariance;
};

export const calculatePearsonCorrelation = (dataX, dataY) => {
  if (dataX.length !== dataY.length || dataX.length < 2) {
    return 0;
  }
  
  const covariance = calculateCovariance(dataX, dataY);
  const stdDevX = calculateStandardDeviation(dataX);
  const stdDevY = calculateStandardDeviation(dataY);
  
  if (stdDevX === 0 || stdDevY === 0) {
    return 0;
  }
  
  return covariance / (stdDevX * stdDevY);
};

export const alignTimeSeriesData = (stockData1, stockData2) => {
  const timestamps1 = new Set(stockData1.map(item => item.timestamp));
  const timestamps2 = new Set(stockData2.map(item => item.timestamp));
  
  const commonTimestamps = [...timestamps1].filter(ts => timestamps2.has(ts));
  
  const aligned1 = stockData1
    .filter(item => commonTimestamps.includes(item.timestamp))
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
  const aligned2 = stockData2
    .filter(item => commonTimestamps.includes(item.timestamp))
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
  return { aligned1, aligned2 };
};

export const getCorrelationStrength = (correlation) => {
  const abs = Math.abs(correlation);
  if (abs >= 0.8) return 'Very Strong';
  if (abs >= 0.6) return 'Strong';
  if (abs >= 0.4) return 'Moderate';
  if (abs >= 0.2) return 'Weak';
  return 'Very Weak';
};

export const getCorrelationColor = (correlation) => {
  const intensity = Math.abs(correlation);
  if (correlation > 0) {
    return `rgba(33, 150, 243, ${intensity})`;
  } else {
    return `rgba(244, 67, 54, ${intensity})`;
  }
};