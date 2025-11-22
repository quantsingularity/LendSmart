import React, { useState, useEffect } from 'react';
import {
    Typography,
    Box,
    Paper,
    Grid,
    Card,
    CardContent,
    Button,
    CircularProgress,
    Alert,
    Divider,
    List,
    ListItem,
    ListItemText,
    Tabs,
    Tab,
} from '@mui/material';
import { useApi } from '../contexts/ApiContext';
import { useBlockchain } from '../contexts/BlockchainContext';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';

const MyLoans = () => {
    const navigate = useNavigate();
    const { getMyLoans } = useApi();
    const { getUserLoans, getLoanDetails, isConnected, connectWallet, account } = useBlockchain();

    const [loans, setLoans] = useState([]);
    const [blockchainLoans, setBlockchainLoans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [tabValue, setTabValue] = useState(0);

    useEffect(() => {
        fetchLoans();
    }, [isConnected, account]);

    const fetchLoans = async () => {
        try {
            setLoading(true);
            setError(null);

            // Get user loans from backend
            const backendResult = await getMyLoans();
            setLoans(backendResult.data || []);

            // Get user loans from blockchain if connected
            if (isConnected && account) {
                const blockchainLoanIds = await getUserLoans(account);

                // Fetch details for each loan
                const loanDetailsPromises = blockchainLoanIds.map((id) => getLoanDetails(id));
                const loanDetails = await Promise.all(loanDetailsPromises);

                setBlockchainLoans(loanDetails.filter((loan) => loan !== null));
            }

            setLoading(false);
        } catch (err) {
            console.error('Error fetching loans:', err);
            setError('Failed to fetch your loans');
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

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    const handleViewLoan = (id) => {
        navigate(`/loans/${id}`);
    };

    const getLoanStatusColor = (status) => {
        switch (status) {
            case 'Active':
                return 'success.main';
            case 'Requested':
                return 'primary.main';
            case 'Funded':
                return 'info.main';
            case 'Repaid':
                return 'success.main';
            case 'Defaulted':
                return 'error.main';
            case 'Cancelled':
                return 'text.secondary';
            default:
                return 'text.primary';
        }
    };

    const renderLoanCard = (loan, isBlockchain = false) => {
        const loanData = isBlockchain ? loan.loan : loan;
        const loanId = isBlockchain ? loanData.id : loan._id || loan.blockchainId;
        const status = isBlockchain ? loanData.status : loan.status;

        return (
            <Grid item xs={12} md={6} key={loanId}>
                <Card elevation={2}>
                    <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                            <Typography variant="h6" component="div" noWrap>
                                {loanData.purpose || 'Loan'}
                            </Typography>
                            <Typography
                                variant="body2"
                                sx={{
                                    color: getLoanStatusColor(status),
                                    fontWeight: 'bold',
                                    border: 1,
                                    borderColor: getLoanStatusColor(status),
                                    borderRadius: 1,
                                    px: 1,
                                    py: 0.5,
                                }}
                            >
                                {status}
                            </Typography>
                        </Box>

                        <Typography color="text.secondary" gutterBottom>
                            ID: {loanId}
                        </Typography>

                        <Divider sx={{ my: 1.5 }} />

                        <Grid container spacing={1}>
                            <Grid item xs={6}>
                                <Typography variant="body2" color="text.secondary">
                                    Principal:
                                </Typography>
                                <Typography variant="body1" fontWeight="medium">
                                    {isBlockchain
                                        ? ethers.formatUnits(loanData.principal.toString(), 18)
                                        : loanData.principal}{' '}
                                    Tokens
                                </Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="body2" color="text.secondary">
                                    Interest Rate:
                                </Typography>
                                <Typography variant="body1" fontWeight="medium">
                                    {loanData.interestRate}%
                                </Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="body2" color="text.secondary">
                                    Duration:
                                </Typography>
                                <Typography variant="body1" fontWeight="medium">
                                    {loanData.duration} days
                                </Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="body2" color="text.secondary">
                                    Created:
                                </Typography>
                                <Typography variant="body1" fontWeight="medium">
                                    {isBlockchain
                                        ? new Date(
                                              parseInt(loanData.requestedTime) * 1000,
                                          ).toLocaleDateString()
                                        : new Date(loan.createdAt).toLocaleDateString()}
                                </Typography>
                            </Grid>
                        </Grid>

                        <Button
                            variant="outlined"
                            fullWidth
                            sx={{ mt: 2 }}
                            onClick={() => handleViewLoan(loanId)}
                        >
                            View Details
                        </Button>
                    </CardContent>
                </Card>
            </Grid>
        );
    };

    const renderBackendLoans = () => {
        if (loans.length === 0) {
            return (
                <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="h6" color="text.secondary">
                        You don't have any loans yet
                    </Typography>
                    <Button variant="contained" sx={{ mt: 2 }} onClick={() => navigate('/apply')}>
                        Apply for a Loan
                    </Button>
                </Paper>
            );
        }

        return (
            <Grid container spacing={3}>
                {loans.map((loan) => renderLoanCard(loan))}
            </Grid>
        );
    };

    const renderBlockchainLoans = () => {
        if (!isConnected) {
            return (
                <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="h6" color="text.secondary">
                        Connect your wallet to view blockchain loans
                    </Typography>
                    <Button variant="contained" sx={{ mt: 2 }} onClick={handleConnectWallet}>
                        Connect Wallet
                    </Button>
                </Paper>
            );
        }

        if (blockchainLoans.length === 0) {
            return (
                <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="h6" color="text.secondary">
                        No blockchain loans found for your address
                    </Typography>
                    <Button variant="contained" sx={{ mt: 2 }} onClick={() => navigate('/apply')}>
                        Apply for a Loan
                    </Button>
                </Paper>
            );
        }

        return (
            <Grid container spacing={3}>
                {blockchainLoans.map((loan) => renderLoanCard(loan, true))}
            </Grid>
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
                My Loans
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs value={tabValue} onChange={handleTabChange} aria-label="loan tabs">
                    <Tab label="Backend Loans" />
                    <Tab label="Blockchain Loans" />
                </Tabs>
            </Box>

            {tabValue === 0 ? renderBackendLoans() : renderBlockchainLoans()}

            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => navigate('/apply')}
                    sx={{ mr: 2 }}
                >
                    Apply for New Loan
                </Button>
                <Button variant="outlined" onClick={() => navigate('/marketplace')}>
                    Browse Marketplace
                </Button>
            </Box>
        </Box>
    );
};

export default MyLoans;
