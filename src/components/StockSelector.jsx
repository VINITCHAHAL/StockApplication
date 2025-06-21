import React from 'react';
import { 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem,
  Chip,
  Box,
  OutlinedInput,
  Typography,
  Alert
} from '@mui/material';

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

function StockSelector({ stocks, onSelect, selectedStocks = [], multiSelect = false }) {
  const handleChange = (event) => {
    const value = event.target.value;
    if (multiSelect) {
      onSelect(typeof value === 'string' ? value.split(',') : value);
    } else {
      onSelect(value);
    }
  };

  const handleDelete = (stockToDelete) => {
    if (multiSelect) {
      onSelect(selectedStocks.filter(stock => stock !== stockToDelete));
    }
  };

  if (stocks.length === 0) {
    return (
      <Alert severity="warning" sx={{ mt: 2 }}>
        Loading available stocks...
      </Alert>
    );
  }

  return (
    <FormControl fullWidth margin="normal">
      <InputLabel id="stock-selector-label">
        {multiSelect ? 'Select Stocks for Correlation Analysis' : 'Select a Stock for Chart'}
      </InputLabel>
      <Select
        labelId="stock-selector-label"
        multiple={multiSelect}
        value={multiSelect ? selectedStocks : selectedStocks[0] || ''}
        onChange={handleChange}
        input={<OutlinedInput label={multiSelect ? 'Select Stocks for Correlation Analysis' : 'Select a Stock for Chart'} />}
        MenuProps={MenuProps}
        renderValue={multiSelect ? (selected) => (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {selected.map((value) => (
              <Chip 
                key={value} 
                label={value} 
                onDelete={() => handleDelete(value)}
                size="small"
                color="primary"
                variant="outlined"
              />
            ))}
          </Box>
        ) : undefined}
      >
        {stocks.map((stock) => (
          <MenuItem 
            key={stock} 
            value={stock}
            style={{
              fontWeight: multiSelect && selectedStocks.indexOf(stock) !== -1 ? 600 : 400,
            }}
          >
            {stock}
          </MenuItem>
        ))}
      </Select>
      
      {multiSelect && (
        <Typography variant="caption" color="textSecondary" sx={{ mt: 1 }}>
          Select multiple stocks to analyze correlations. Minimum 2 stocks required.
        </Typography>
      )}
    </FormControl>
  );
}

export default StockSelector;