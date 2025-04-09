import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Box, 
  Container, 
  Grid, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Button,
  Chip,
  CircularProgress,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { useAuth } from '../context/AuthContext';

function LoanMarketplace() {
  const { isAuthenticated, userProfile, connectWallet } = useAuth();
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [investAmount, setInvestAmount] = useState('');

  useEffect(() => {
    // Fetch available loans
    const fetchLoans = async () => {
      setLoading(true);
      try {
        // In a real app, this would fetch from your backend
        // const response = await axios.get('/api/loans');
        // setLoans(response.data);
        
        // For demo purposes, create sample data
        const sampleLoans = [
          {
            id: 1,
            borrower: '0x1234...5678',
            amount: 5000,
            funded: 2500,
            interest_rate: 8.5,
            duration: 90,
            risk_score: 0.15,
            status: 'Pending'
          },
          {
            id: 2,
            borrower: '0x8765...4321',
            amount: 10000,
            funded: 3000,
            interest_rate: 9.2,
            duration: 180,
            risk_score: 0.25,
            status: 'Pending'
          },
          {
            id: 3,
            borrower: '0xabcd...efgh',
            amount: 2500,
            funded: 2500,
            interest_rate: 7.5,
            duration: 60,
            risk_score: 0.10,
            status: 'Funded'
          },
          {
            id: 4,
            borrower: '0x9876...5432',
            amount: 15000,
            funded: 7500,
            interest_rate: 10.0,
            duration: 365,
            risk_score: 0.35,
            status: 'Pending'
          }
        ];
        setLoans(sampleLoans);
      } catch (error) {
        console.error('Error fetching loans:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLoans();
  }, []);

  const handleInvestClick = (loan) => {
    if (!isAuthenticated) {
      connectWallet();
      return;
    }
    
    setSelectedLoan(loan);
    setInvestAmount('');
    setDialogOpen(true);
  };

  const handleInvestSubmit = () => {
    // In a real app, this would call your backend to process the investment
    console.log(`Investing ${investAmount} in loan ${selectedLoan.id}`);
    
    // Update the loan in the UI
    setLoans(loans.map(loan => {
      if (loan.id === selectedLoan.id) {
        const newFunded = loan.funded + Number(investAmount);
        return {
          ...loan,
          funded: newFunded,
          status: newFunded >= loan.amount ? 'Funded' : 'Pending'
        };
      }
      return loan;
    }));
    
    setDialogOpen(false);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getRiskLabel = (score) => {
    if (score < 0.15) return 'Low';
    if (score < 0.30) return 'Medium';
    return 'High';
  };

  const getRiskColor = (score) => {
    if (score < 0.15) return 'success';
    if (score < 0.30) return 'warning';
    return 'error';
  };

  return (
    <Container>
      <Typography variant="h4" component="h1" gutterBottom>
        Loan Marketplace
      </Typography>
      
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Available Loans
        </Typography>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : loans.length > 0 ? (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Borrower</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Funded</TableCell>
                  <TableCell>Interest Rate</TableCell>
                  <TableCell>Duration (days)</TableCell>
                  <TableCell>Risk</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loans.map((loan) => (
                  <TableRow key={loan.id}>
                    <TableCell>{loan.id}</TableCell>
                    <TableCell>{loan.borrower}</TableCell>
                    <TableCell>{formatCurrency(loan.amount)}</TableCell>
                    <TableCell>
                      {formatCurrency(loan.funded)} 
                      ({Math.round((loan.funded / loan.amount) * 100)}%)
                    </TableCell>
                    <TableCell>{loan.interest_rate}%</TableCell>
                    <TableCell>{loan.duration}</TableCell>
                    <TableCell>
                      <Chip 
                        label={getRiskLabel(loan.risk_score)} 
                        color={getRiskColor(loan.risk_score)} 
                        size="small" 
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={loan.status} 
                        color={loan.status === 'Funded' ? 'success' : 'warning'} 
                        size="small" 
                      />
                    </TableCell>
                    <TableCell>
                      {loan.status === 'Pending' && (
                        <Button 
                          variant="outlined" 
                          size="small"
                          onClick={() => handleInvestClick(loan)}
                        >
                          Invest
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Typography variant="body1" sx={{ py: 2 }}>
            No loans available at the moment.
          </Typography>
        )}
      </Paper>
      
      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Why Invest with LendSmart?
            </Typography>
            <Typography variant="body1" paragraph>
              Investing in peer-to-peer loans offers competitive returns while helping borrowers access fair financing.
            </Typography>
            <Typography variant="body2" component="ul" sx={{ pl: 2 }}>
              <li>AI-powered risk assessment ensures informed investment decisions</li>
              <li>Smart contracts automate repayments and enforce loan terms</li>
              <li>Diversify your portfolio across multiple borrowers</li>
              <li>Transparent blockchain records for all transactions</li>
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Investment Strategy Tips
            </Typography>
            <Typography variant="body1" paragraph>
              Maximize returns while managing risk with these strategies:
            </Typography>
            <Typography variant="body2" component="ul" sx={{ pl: 2 }}>
              <li>Diversify across multiple loans to reduce risk exposure</li>
              <li>Consider risk scores and interest rates when selecting loans</li>
              <li>Start with smaller investments to build experience</li>
              <li>Monitor your portfolio regularly through your dashboard</li>
            </Typography>
          </Paper>
        </Grid>
      </Grid>
      
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>Invest in Loan #{selectedLoan?.id}</DialogTitle>
        <DialogContent>
          {selectedLoan && (
            <Box sx={{ pt: 1 }}>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Loan Amount:</Typography>
                  <Typography variant="body1">{formatCurrency(selectedLoan.amount)}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Already Funded:</Typography>
                  <Typography variant="body1">{formatCurrency(selectedLoan.funded)}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Interest Rate:</Typography>
                  <Typography variant="body1">{selectedLoan.interest_rate}%</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Duration:</Typography>
                  <Typography variant="body1">{selectedLoan.duration} days</Typography>
                </Grid>
              </Grid>
              
              <TextField
                fullWidth
                label="Investment Amount"
                type="number"
                value={investAmount}
                onChange={(e) => setInvestAmount(e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
                sx={{ mb: 2 }}
              />
              
              <Typography variant="body2" color="text.secondary">
                Remaining amount needed: {formatCurrency(selectedLoan.amount - selectedLoan.funded)}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleInvestSubmit} 
            variant="contained" 
            color="primary"
            disabled={!investAmount || Number(investAmount) <= 0}
          >
            Confirm Investment
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default LoanMarketplace;
