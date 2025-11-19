import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Paper,
  Grid,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { useApi } from '../contexts/ApiContext';
import { useBlockchain } from '../contexts/BlockchainContext';

const RiskAssessment = () => {
  const { getLoan, setRiskScore } = useApi();
  const { setLoanRiskScore, isConnected, connectWallet } = useBlockchain();

  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [riskScore, setRiskScoreValue] = useState('');
  const [shouldReject, setShouldReject] = useState(false);
  const [privateKey, setPrivateKey] = useState('');

  useEffect(() => {
    fetchPendingLoans();
  }, []);

  const fetchPendingLoans = async () => {
    try {
      setLoading(true);
      setError(null);

      // In a real implementation, this would fetch loans pending risk assessment
      // For now, we'll simulate with a mock API call
      const mockLoans = [
        {
          id: '1',
          blockchainId: '1',
          borrower: {
            name: 'John Doe',
            address: '0x1234567890abcdef1234567890abcdef12345678'
          },
          principal: '1000',
          interestRate: '5',
          duration: '30',
          purpose: 'Business expansion',
          status: 'Requested',
          createdAt: new Date().toISOString(),
          isCollateralized: true,
          collateralAmount: '2000'
        },
        {
          id: '2',
          blockchainId: '2',
          borrower: {
            name: 'Jane Smith',
            address: '0xabcdef1234567890abcdef1234567890abcdef12'
          },
          principal: '5000',
          interestRate: '7',
          duration: '90',
          purpose: 'Home renovation',
          status: 'Requested',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          isCollateralized: false
        }
      ];

      setLoans(mockLoans);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching pending loans:', err);
      setError('Failed to fetch loans pending risk assessment');
      setLoading(false);
    }
  };

  const handleConnectWallet = async () => {
    try {
      await connectWallet();
    } catch (err) {
      setError('Failed to connect wallet');
    }
  };

  const handleSelectLoan = async (loan) => {
    setSelectedLoan(loan);
    setRiskScoreValue('');
    setShouldReject(false);
  };

  const handleSubmitRiskScore = async () => {
    if (!isConnected) {
      try {
        await connectWallet();
      } catch (err) {
        setError('Please connect your wallet to set risk score');
        return;
      }
    }

    if (!privateKey) {
      setError('Private key is required for blockchain transaction');
      return;
    }

    if (!riskScore || isNaN(parseInt(riskScore))) {
      setError('Please enter a valid risk score');
      return;
    }

    try {
      setActionLoading(true);
      setError(null);
      setSuccess(null);

      // Submit to blockchain
      const blockchainResult = await setLoanRiskScore(
        selectedLoan.blockchainId,
        parseInt(riskScore),
        shouldReject
      );

      if (!blockchainResult) {
        throw new Error('Failed to set risk score on blockchain');
      }

      // Submit to backend
      await setRiskScore(selectedLoan.id, {
        riskScore: parseInt(riskScore),
        shouldReject,
        transactionHash: blockchainResult.transactionHash
      });

      setSuccess(`Risk score set successfully for loan ${selectedLoan.blockchainId}`);
      setSelectedLoan(null);

      // Refresh loans after a short delay
      setTimeout(() => {
        fetchPendingLoans();
      }, 2000);

      setActionLoading(false);
    } catch (err) {
      console.error('Error setting risk score:', err);
      setError(err.message || 'Failed to set risk score');
      setActionLoading(false);
    }
  };

  const renderLoanTable = () => {
    if (loans.length === 0) {
      return (
        <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            No loans pending risk assessment
          </Typography>
        </Paper>
      );
    }

    return (
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Borrower</TableCell>
              <TableCell>Principal</TableCell>
              <TableCell>Duration</TableCell>
              <TableCell>Collateralized</TableCell>
              <TableCell>Date Requested</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loans.map((loan) => (
              <TableRow key={loan.id}>
                <TableCell>{loan.blockchainId}</TableCell>
                <TableCell>{loan.borrower.name}</TableCell>
                <TableCell>{loan.principal} Tokens</TableCell>
                <TableCell>{loan.duration} days</TableCell>
                <TableCell>
                  {loan.isCollateralized ? (
                    <Chip label="Yes" color="success" size="small" />
                  ) : (
                    <Chip label="No" color="default" size="small" />
                  )}
                </TableCell>
                <TableCell>{new Date(loan.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => handleSelectLoan(loan)}
                  >
                    Assess Risk
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  const renderRiskAssessmentForm = () => {
    if (!selectedLoan) return null;

    return (
      <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Risk Assessment for Loan #{selectedLoan.blockchainId}
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              Borrower
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {selectedLoan.borrower.name}
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              Borrower Address
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {`${selectedLoan.borrower.address.substring(0, 6)}...${selectedLoan.borrower.address.substring(selectedLoan.borrower.address.length - 4)}`}
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              Principal Amount
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {selectedLoan.principal} Tokens
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              Collateral
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {selectedLoan.isCollateralized ? `${selectedLoan.collateralAmount} Tokens` : 'None'}
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="body2" color="text.secondary">
              Purpose
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {selectedLoan.purpose}
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <TextField
              label="Risk Score (0-100)"
              type="number"
              fullWidth
              value={riskScore}
              onChange={(e) => setRiskScoreValue(e.target.value)}
              inputProps={{ min: 0, max: 100 }}
              required
              margin="normal"
              helperText="0 = Highest Risk, 100 = Lowest Risk"
            />
          </Grid>

          <Grid item xs={12}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Recommendation</InputLabel>
              <Select
                value={shouldReject ? 'reject' : 'approve'}
                onChange={(e) => setShouldReject(e.target.value === 'reject')}
                label="Recommendation"
              >
                <MenuItem value="approve">Approve Loan</MenuItem>
                <MenuItem value="reject">Reject Loan</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <TextField
              label="Private Key (for blockchain transaction)"
              type="password"
              fullWidth
              value={privateKey}
              onChange={(e) => setPrivateKey(e.target.value)}
              margin="normal"
              required
              helperText="Your private key is only used for this transaction and not stored"
            />
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
              <Button
                variant="outlined"
                onClick={() => setSelectedLoan(null)}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                color={shouldReject ? 'error' : 'primary'}
                onClick={handleSubmitRiskScore}
                disabled={actionLoading || !riskScore || !privateKey}
              >
                {actionLoading ? <CircularProgress size={24} /> : (shouldReject ? 'Reject Loan' : 'Approve Loan')}
              </Button>
            </Box>
          </Grid>
        </Grid>
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

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Risk Assessment Dashboard
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      {!isConnected && (
        <Alert severity="info" sx={{ mb: 3 }} action={
          <Button color="inherit" size="small" onClick={handleConnectWallet}>
            Connect
          </Button>
        }>
          Please connect your wallet to perform risk assessment
        </Alert>
      )}

      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Loans Pending Risk Assessment
        </Typography>
        {renderLoanTable()}
      </Paper>

      {renderRiskAssessmentForm()}
    </Box>
  );
};

export default RiskAssessment;
