import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Box, 
  Container, 
  Grid, 
  Paper, 
  TextField, 
  Button, 
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Chip
} from '@mui/material';
import { useAuth } from '../context/AuthContext';

function MultiCurrency() {
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [baseCurrency, setBaseCurrency] = useState('USD');
  const [amount, setAmount] = useState('');
  const [convertedAmount, setConvertedAmount] = useState('');
  const [targetCurrency, setTargetCurrency] = useState('EUR');
  const [exchangeRates, setExchangeRates] = useState({});
  const [loanCurrency, setLoanCurrency] = useState('USD');
  const [loanAmount, setLoanAmount] = useState('');
  const [loans, setLoans] = useState([]);
  
  const currencies = [
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'GBP', name: 'British Pound', symbol: '£' },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
    { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
    { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
    { code: 'CHF', name: 'Swiss Franc', symbol: 'Fr' },
    { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
    { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
    { code: 'BTC', name: 'Bitcoin', symbol: '₿' },
    { code: 'ETH', name: 'Ethereum', symbol: 'Ξ' }
  ];

  useEffect(() => {
    const fetchExchangeRates = async () => {
      setLoading(true);
      try {
        // In a real app, you would fetch exchange rates from an API
        // For demo purposes, we'll use sample data
        const sampleRates = {
          USD: 1.0,
          EUR: 0.92,
          GBP: 0.78,
          JPY: 151.67,
          CAD: 1.36,
          AUD: 1.51,
          CHF: 0.91,
          CNY: 7.24,
          INR: 83.45,
          BTC: 0.000016,
          ETH: 0.00031
        };
        
        setExchangeRates(sampleRates);
        
        // Sample loans in different currencies
        const sampleLoans = [
          {
            id: 1,
            amount: 5000,
            currency: 'USD',
            interest_rate: 8.5,
            duration: 90,
            status: 'Approved'
          },
          {
            id: 2,
            amount: 4600,
            currency: 'EUR',
            interest_rate: 7.2,
            duration: 30,
            status: 'Pending'
          },
          {
            id: 3,
            amount: 3900,
            currency: 'GBP',
            interest_rate: 9.0,
            duration: 180,
            status: 'Repaid'
          },
          {
            id: 4,
            amount: 750000,
            currency: 'JPY',
            interest_rate: 6.5,
            duration: 120,
            status: 'Approved'
          },
          {
            id: 5,
            amount: 0.75,
            currency: 'BTC',
            interest_rate: 10.0,
            duration: 365,
            status: 'Pending'
          }
        ];
        
        setLoans(sampleLoans);
      } catch (error) {
        console.error('Error fetching exchange rates:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchExchangeRates();
  }, []);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleConvert = () => {
    if (!amount || !baseCurrency || !targetCurrency) return;
    
    const baseRate = exchangeRates[baseCurrency];
    const targetRate = exchangeRates[targetCurrency];
    
    if (baseRate && targetRate) {
      const result = (amount / baseRate) * targetRate;
      setConvertedAmount(result.toFixed(targetCurrency === 'BTC' || targetCurrency === 'ETH' ? 8 : 2));
    }
  };

  const convertCurrency = (amount, fromCurrency, toCurrency) => {
    if (!fromCurrency || !toCurrency || !amount) return '0';
    
    const fromRate = exchangeRates[fromCurrency];
    const toRate = exchangeRates[toCurrency];
    
    if (fromRate && toRate) {
      const result = (amount / fromRate) * toRate;
      return result.toFixed(toCurrency === 'BTC' || toCurrency === 'ETH' ? 8 : 2);
    }
    
    return '0';
  };

  const getCurrencySymbol = (code) => {
    const currency = currencies.find(c => c.code === code);
    return currency ? currency.symbol : '';
  };

  const formatCurrency = (amount, currencyCode) => {
    const symbol = getCurrencySymbol(currencyCode);
    
    if (currencyCode === 'BTC' || currencyCode === 'ETH') {
      return `${symbol}${parseFloat(amount).toFixed(8)}`;
    }
    
    return `${symbol}${parseFloat(amount).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const renderCurrencyConverter = () => (
    <Box>
      <Typography variant="h6" gutterBottom>Currency Converter</Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Convert between different currencies using real-time exchange rates.
      </Typography>
      
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} sm={5}>
          <TextField
            fullWidth
            label="Amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            InputProps={{
              startAdornment: getCurrencySymbol(baseCurrency),
            }}
          />
        </Grid>
        
        <Grid item xs={12} sm={3}>
          <FormControl fullWidth>
            <InputLabel>From</InputLabel>
            <Select
              value={baseCurrency}
              label="From"
              onChange={(e) => setBaseCurrency(e.target.value)}
            >
              {currencies.map((currency) => (
                <MenuItem key={currency.code} value={currency.code}>
                  {currency.code} - {currency.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} sm={3}>
          <FormControl fullWidth>
            <InputLabel>To</InputLabel>
            <Select
              value={targetCurrency}
              label="To"
              onChange={(e) => setTargetCurrency(e.target.value)}
            >
              {currencies.map((currency) => (
                <MenuItem key={currency.code} value={currency.code}>
                  {currency.code} - {currency.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} sm={1} sx={{ display: 'flex', alignItems: 'center' }}>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleConvert}
            fullWidth
          >
            Convert
          </Button>
        </Grid>
      </Grid>
      
      {convertedAmount && (
        <Paper elevation={3} sx={{ p: 3, mt: 3, textAlign: 'center' }}>
          <Typography variant="h5" gutterBottom>
            {formatCurrency(amount, baseCurrency)} = {formatCurrency(convertedAmount, targetCurrency)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Exchange rate: 1 {baseCurrency} = {convertCurrency(1, baseCurrency, targetCurrency)} {targetCurrency}
          </Typography>
        </Paper>
      )}
      
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>Exchange Rates</Typography>
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Currency</TableCell>
                <TableCell align="right">Code</TableCell>
                <TableCell align="right">Rate (USD)</TableCell>
                <TableCell align="right">Inverse</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {currencies.map((currency) => (
                <TableRow key={currency.code}>
                  <TableCell component="th" scope="row">
                    {currency.name}
                  </TableCell>
                  <TableCell align="right">{currency.code}</TableCell>
                  <TableCell align="right">
                    {currency.code === 'USD' ? '1.0000' : convertCurrency(1, 'USD', currency.code)}
                  </TableCell>
                  <TableCell align="right">
                    {currency.code === 'USD' ? '1.0000' : convertCurrency(1, currency.code, 'USD')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );

  const renderMultiCurrencyLoans = () => (
    <Box>
      <Typography variant="h6" gutterBottom>Multi-Currency Loans</Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Apply for loans in different currencies based on your needs.
      </Typography>
      
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Typography variant="subtitle1" gutterBottom>Apply for a Multi-Currency Loan</Typography>
        
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Loan Amount"
              type="number"
              value={loanAmount}
              onChange={(e) => setLoanAmount(e.target.value)}
              InputProps={{
                startAdornment: getCurrencySymbol(loanCurrency),
              }}
            />
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Currency</InputLabel>
              <Select
                value={loanCurrency}
                label="Currency"
                onChange={(e) => setLoanCurrency(e.target.value)}
              >
                {currencies.map((currency) => (
                  <MenuItem key={currency.code} value={currency.code}>
                    {currency.code} - {currency.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={2} sx={{ display: 'flex', alignItems: 'center' }}>
            <Button 
              variant="contained" 
              color="primary" 
              fullWidth
              disabled={!loanAmount}
            >
              Apply
            </Button>
          </Grid>
        </Grid>
        
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Equivalent to approximately {loanAmount ? formatCurrency(convertCurrency(loanAmount, loanCurrency, 'USD'), 'USD') : '$0'} USD
        </Typography>
      </Paper>
      
      <Typography variant="h6" gutterBottom>Your Multi-Currency Loans</Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>USD Equivalent</TableCell>
              <TableCell>Interest Rate</TableCell>
              <TableCell>Duration (days)</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loans.map((loan) => (
              <TableRow key={loan.id}>
                <TableCell>{loan.id}</TableCell>
                <TableCell>{formatCurrency(loan.amount, loan.currency)}</TableCell>
                <TableCell>{formatCurrency(convertCurrency(loan.amount, loan.currency, 'USD'), 'USD')}</TableCell>
                <TableCell>{loan.interest_rate}%</TableCell>
                <TableCell>{loan.duration}</TableCell>
                <TableCell>
                  <Chip 
                    label={loan.status} 
                    color={
                      loan.status === 'Approved' ? 'success' : 
                      loan.status === 'Pending' ? 'warning' : 
                      loan.status === 'Repaid' ? 'info' : 'default'
                    } 
                    size="small" 
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  return (
    <Container>
      <Typography variant="h4" component="h1" gutterBottom>
        Multi-Currency Support
      </Typography>
      
      {!isAuthenticated ? (
        <Alert severity="info" sx={{ mb: 3 }}>
          Please connect your wallet to access all multi-currency features.
        </Alert>
      ) : null}
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ width: '100%' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="multi-currency tabs">
              <Tab label="Currency Converter" />
              <Tab label="Multi-Currency Loans" />
            </Tabs>
          </Box>
          
          <Box sx={{ p: 1 }}>
            {tabValue === 0 && renderCurrencyConverter()}
            {tabValue === 1 && renderMultiCurrencyLoans()}
          </Box>
        </Box>
      )}
      
      <Box sx={{ mt: 6 }}>
        <Typography variant="h5" gutterBottom>Benefits of Multi-Currency Support</Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom>Global Accessibility</Typography>
              <Typography variant="body2">
                Access loans and make investments in your preferred currency, regardless of your location.
                Eliminate the need for costly currency conversions and exchange fees.
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom>Diversification</Typography>
              <Typography variant="body2">
                Diversify your investment portfolio across multiple currencies to hedge against
                currency fluctuations and reduce overall risk exposure.
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom>Cryptocurrency Integration</Typography>
              <Typography variant="body2">
                Seamlessly integrate traditional fiat currencies with cryptocurrencies like Bitcoin and Ethereum,
                providing flexibility for both traditional and crypto-native users.
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
}

export default MultiCurrency;
