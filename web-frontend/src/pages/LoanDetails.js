import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  TextField,
  InputAdornment
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useApi } from '../contexts/ApiContext';
import { useBlockchain } from '../contexts/BlockchainContext';
import { ethers } from 'ethers';

const LoanDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getLoan } = useApi();
  const {
    getLoanDetails: getBlockchainLoanDetails,
    fundLoan,
    disburseLoan,
    repayLoan,
    depositCollateral,
    cancelLoanRequest,
    isConnected,
    connectWallet,
    account
  } = useBlockchain();

  const [loan, setLoan] = useState(null);
  const [blockchainLoan, setBlockchainLoan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [privateKey, setPrivateKey] = useState('');
  const [repayAmount, setRepayAmount] = useState('');

  useEffect(() => {
    fetchLoanDetails();
  }, [id]);

  const fetchLoanDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get loan from backend
      const result = await getLoan(id);
      setLoan(result.data);

      // Get loan from blockchain
      const blockchainResult = await getBlockchainLoanDetails(id);
      setBlockchainLoan(blockchainResult);

      setLoading(false);
    } catch (err) {
      console.error('Error fetching loan details:', err);
      setError('Failed to fetch loan details');
      setLoading(false);
    }
  };

  const handleFundLoan = async () => {
    if (!isConnected) {
      try {
        await connectWallet();
      } catch (err) {
        setError('Please connect your wallet to fund this loan');
        return;
      }
    }

    if (!privateKey) {
      setError('Private key is required for blockchain transaction');
      return;
    }

    try {
      setActionLoading(true);
      setError(null);
      setSuccess(null);

      const result = await fundLoan(id);

      if (result) {
        setSuccess('Loan funded successfully!');
        // Refresh loan details after a short delay
        setTimeout(() => {
          fetchLoanDetails();
        }, 2000);
      } else {
        throw new Error('Failed to fund loan');
      }

      setActionLoading(false);
    } catch (err) {
      console.error('Error funding loan:', err);
      setError(err.message || 'Failed to fund loan');
      setActionLoading(false);
    }
  };

  const handleDisburseLoan = async () => {
    if (!isConnected) {
      try {
        await connectWallet();
      } catch (err) {
        setError('Please connect your wallet to disburse this loan');
        return;
      }
    }

    if (!privateKey) {
      setError('Private key is required for blockchain transaction');
      return;
    }

    try {
      setActionLoading(true);
      setError(null);
      setSuccess(null);

      const result = await disburseLoan(id);

      if (result) {
        setSuccess('Loan disbursed successfully!');
        // Refresh loan details after a short delay
        setTimeout(() => {
          fetchLoanDetails();
        }, 2000);
      } else {
        throw new Error('Failed to disburse loan');
      }

      setActionLoading(false);
    } catch (err) {
      console.error('Error disbursing loan:', err);
      setError(err.message || 'Failed to disburse loan');
      setActionLoading(false);
    }
  };

  const handleRepayLoan = async () => {
    if (!isConnected) {
      try {
        await connectWallet();
      } catch (err) {
        setError('Please connect your wallet to repay this loan');
        return;
      }
    }

    if (!privateKey) {
      setError('Private key is required for blockchain transaction');
      return;
    }

    if (!repayAmount) {
      setError('Repayment amount is required');
      return;
    }

    try {
      setActionLoading(true);
      setError(null);
      setSuccess(null);

      const result = await repayLoan(id, repayAmount, blockchainLoan?.loan?.decimals || 18);

      if (result) {
        setSuccess('Loan repayment successful!');
        setRepayAmount('');
        // Refresh loan details after a short delay
        setTimeout(() => {
          fetchLoanDetails();
        }, 2000);
      } else {
        throw new Error('Failed to repay loan');
      }

      setActionLoading(false);
    } catch (err) {
      console.error('Error repaying loan:', err);
      setError(err.message || 'Failed to repay loan');
      setActionLoading(false);
    }
  };

  const handleDepositCollateral = async () => {
    if (!isConnected) {
      try {
        await connectWallet();
      } catch (err) {
        setError('Please connect your wallet to deposit collateral');
        return;
      }
    }

    if (!privateKey) {
      setError('Private key is required for blockchain transaction');
      return;
    }

    try {
      setActionLoading(true);
      setError(null);
      setSuccess(null);

      const result = await depositCollateral(id);

      if (result) {
        setSuccess('Collateral deposited successfully!');
        // Refresh loan details after a short delay
        setTimeout(() => {
          fetchLoanDetails();
        }, 2000);
      } else {
        throw new Error('Failed to deposit collateral');
      }

      setActionLoading(false);
    } catch (err) {
      console.error('Error depositing collateral:', err);
      setError(err.message || 'Failed to deposit collateral');
      setActionLoading(false);
    }
  };

  const handleCancelLoan = async () => {
    if (!isConnected) {
      try {
        await connectWallet();
      } catch (err) {
        setError('Please connect your wallet to cancel this loan');
        return;
      }
    }

    if (!privateKey) {
      setError('Private key is required for blockchain transaction');
      return;
    }

    try {
      setActionLoading(true);
      setError(null);
      setSuccess(null);

      const result = await cancelLoanRequest(id);

      if (result) {
        setSuccess('Loan cancelled successfully!');
        // Refresh loan details after a short delay
        setTimeout(() => {
          fetchLoanDetails();
        }, 2000);
      } else {
        throw new Error('Failed to cancel loan');
      }

      setActionLoading(false);
    } catch (err) {
      console.error('Error cancelling loan:', err);
      setError(err.message || 'Failed to cancel loan');
      setActionLoading(false);
    }
  };

  const formatAddress = (address) => {
    if (!address) return 'N/A';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const formatDate = (timestamp) => {
    if (!timestamp || timestamp === '0') return 'N/A';
    return new Date(parseInt(timestamp) * 1000).toLocaleString();
  };

  const formatAmount = (amount, decimals = 18) => {
    if (!amount) return '0';
    return ethers.formatUnits(amount, decimals);
  };

  const isUserBorrower = () => {
    if (!blockchainLoan || !account) return false;
    return blockchainLoan.loan.borrower.toLowerCase() === account.toLowerCase();
  };

  const isUserLender = () => {
    if (!blockchainLoan || !account) return false;
    return blockchainLoan.loan.lender.toLowerCase() === account.toLowerCase();
  };

  const renderLoanActions = () => {
    if (!blockchainLoan) return null;

    const status = blockchainLoan.loan.status;

    return (
      <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Loan Actions
        </Typography>

        <TextField
          label="Private Key (for blockchain transaction)"
          type="password"
          fullWidth
          value={privateKey}
          onChange={(e) => setPrivateKey(e.target.value)}
          margin="normal"
          helperText="Your private key is only used for this transaction and not stored"
        />

        {status === 'Requested' && isUserBorrower() && (
          <Button
            variant="outlined"
            color="error"
            fullWidth
            sx={{ mt: 2 }}
            onClick={handleCancelLoan}
            disabled={actionLoading || !privateKey}
          >
            {actionLoading ? <CircularProgress size={24} /> : 'Cancel Loan Request'}
          </Button>
        )}

        {status === 'Requested' && !isUserBorrower() && (
          <Button
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 2 }}
            onClick={handleFundLoan}
            disabled={actionLoading || !privateKey}
          >
            {actionLoading ? <CircularProgress size={24} /> : 'Fund This Loan'}
          </Button>
        )}

        {status === 'Funded' && (isUserLender() || isUserBorrower()) && (
          <Button
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 2 }}
            onClick={handleDisburseLoan}
            disabled={actionLoading || !privateKey}
          >
            {actionLoading ? <CircularProgress size={24} /> : 'Disburse Funds'}
          </Button>
        )}

        {blockchainLoan.loan.isCollateralized && status === 'Requested' && isUserBorrower() && (
          <Button
            variant="contained"
            color="secondary"
            fullWidth
            sx={{ mt: 2 }}
            onClick={handleDepositCollateral}
            disabled={actionLoading || !privateKey}
          >
            {actionLoading ? <CircularProgress size={24} /> : 'Deposit Collateral'}
          </Button>
        )}

        {(status === 'Active' || status === 'Funded') && isUserBorrower() && (
          <>
            <TextField
              label="Repayment Amount"
              type="number"
              fullWidth
              value={repayAmount}
              onChange={(e) => setRepayAmount(e.target.value)}
              margin="normal"
              InputProps={{
                endAdornment: <InputAdornment position="end">Tokens</InputAdornment>,
              }}
            />
            <Button
              variant="contained"
              color="primary"
              fullWidth
              sx={{ mt: 2 }}
              onClick={handleRepayLoan}
              disabled={actionLoading || !privateKey || !repayAmount}
            >
              {actionLoading ? <CircularProgress size={24} /> : 'Repay Loan'}
            </Button>
          </>
        )}
      </Paper>
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && !loan && !blockchainLoan) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        {error}
      </Alert>
    );
  }

  // Use blockchain data as primary, fall back to backend data
  const loanData = blockchainLoan?.loan || loan || {};

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Loan Details
        </Typography>
        <Chip
          label={loanData.status}
          color={
            loanData.status === 'Active' ? 'success' :
            loanData.status === 'Requested' ? 'primary' :
            loanData.status === 'Funded' ? 'info' :
            loanData.status === 'Repaid' ? 'success' :
            loanData.status === 'Defaulted' ? 'error' :
            'default'
          }
        />
      </Box>

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Loan Information
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Loan ID
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {loanData.id || id}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Status
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {loanData.status}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Principal Amount
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {blockchainLoan ? formatAmount(loanData.principal) : loanData.principal} Tokens
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Interest Rate
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {loanData.interestRate}%
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Duration
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {loanData.duration} days
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Token Address
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {formatAddress(loanData.token)}
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">
                  Purpose
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {loanData.purpose}
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Borrower
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {formatAddress(loanData.borrower)}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Lender
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {loanData.lender && loanData.lender !== ethers.ZeroAddress ? formatAddress(loanData.lender) : 'Not funded yet'}
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Requested Time
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {formatDate(loanData.requestedTime)}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Funded Time
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {formatDate(loanData.fundedTime)}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Disbursed Time
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {formatDate(loanData.disbursedTime)}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Risk Score
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {loanData.riskScore || 'Not assessed yet'}
                </Typography>
              </Grid>
            </Grid>
          </Paper>

          {loanData.isCollateralized && (
            <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Collateral Information
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Collateral Token
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {formatAddress(loanData.collateralToken)}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Collateral Amount
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {blockchainLoan ? formatAmount(loanData.collateralAmount) : loanData.collateralAmount} Tokens
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    Collateral Status
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {loanData.collateralDeposited ? 'Deposited' : 'Not Deposited'}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          )}

          {blockchainLoan && blockchainLoan.repaymentSchedule && blockchainLoan.repaymentSchedule.length > 0 && (
            <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Repayment Schedule
              </Typography>

              <List>
                {blockchainLoan.repaymentSchedule.map((time, index) => (
                  <ListItem key={index} divider={index < blockchainLoan.repaymentSchedule.length - 1}>
                    <ListItemText
                      primary={`Payment ${index + 1}`}
                      secondary={`Due: ${formatDate(time)}`}
                    />
                    <Typography variant="body1" fontWeight="medium">
                      {formatAmount(blockchainLoan.repaymentAmounts[index])} Tokens
                    </Typography>
                  </ListItem>
                ))}
              </List>

              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Total Repaid
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {formatAmount(loanData.amountRepaid)} / {formatAmount(loanData.repaymentAmount)} Tokens
                </Typography>
              </Box>
            </Paper>
          )}
        </Grid>

        <Grid item xs={12} md={4}>
          {renderLoanActions()}

          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Need Help?
              </Typography>
              <Typography variant="body2" color="text.secondary">
                If you have any questions about this loan or need assistance with the platform, please contact our support team.
              </Typography>
              <Button
                variant="outlined"
                fullWidth
                sx={{ mt: 2 }}
                onClick={() => navigate('/')}
              >
                Back to Home
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default LoanDetails;
