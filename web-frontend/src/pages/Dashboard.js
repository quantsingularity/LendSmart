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
    ListItemIcon,
} from '@mui/material';
import { useApi } from '../contexts/ApiContext';
import { useBlockchain } from '../contexts/BlockchainContext';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import AssignmentIcon from '@mui/icons-material/Assignment';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import WarningIcon from '@mui/icons-material/Warning';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
    const navigate = useNavigate();
    const { user, getMyLoans } = useApi();
    const { getUserLoans, getUserReputationScore, isConnected, connectWallet, account } =
        useBlockchain();

    const [loans, setLoans] = useState([]);
    const [blockchainLoans, setBlockchainLoans] = useState([]);
    const [reputationScore, setReputationScore] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchDashboardData();
    }, [isConnected, account]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Get user loans from backend
            const backendResult = await getMyLoans();
            setLoans(backendResult.data || []);

            // Get user loans from blockchain if connected
            if (isConnected && account) {
                const blockchainLoanIds = await getUserLoans(account);
                setBlockchainLoans(blockchainLoanIds || []);

                // Get user reputation score
                const score = await getUserReputationScore(account);
                setReputationScore(score);
            }

            setLoading(false);
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
            setError('Failed to fetch dashboard data');
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

    const renderWalletSection = () => (
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
                Blockchain Wallet
            </Typography>

            {isConnected ? (
                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary">
                            Connected Address
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                            {account}
                        </Typography>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">
                            Reputation Score
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                            {reputationScore !== null ? reputationScore : 'Loading...'}
                        </Typography>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">
                            Blockchain Loans
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                            {blockchainLoans.length}
                        </Typography>
                    </Grid>
                </Grid>
            ) : (
                <Box sx={{ textAlign: 'center', py: 2 }}>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                        Connect your wallet to view blockchain data
                    </Typography>
                    <Button variant="contained" onClick={handleConnectWallet}>
                        Connect Wallet
                    </Button>
                </Box>
            )}
        </Paper>
    );

    const renderUserSection = () => (
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
                User Information
            </Typography>

            <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                        Name
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                        {user?.name || 'N/A'}
                    </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                        Email
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                        {user?.email || 'N/A'}
                    </Typography>
                </Grid>

                <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                        Member Since
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                        {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                    </Typography>
                </Grid>
            </Grid>

            <Button variant="outlined" sx={{ mt: 2 }} onClick={() => navigate('/profile')}>
                Edit Profile
            </Button>
        </Paper>
    );

    const renderLoanSummary = () => (
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
                Loan Summary
            </Typography>

            <Grid container spacing={3}>
                <Grid item xs={12} sm={4}>
                    <Card sx={{ bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                        <CardContent>
                            <Typography variant="h5" component="div">
                                {loans.filter((loan) => loan.status === 'Active').length}
                            </Typography>
                            <Typography variant="body2">Active Loans</Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={4}>
                    <Card sx={{ bgcolor: 'info.light', color: 'info.contrastText' }}>
                        <CardContent>
                            <Typography variant="h5" component="div">
                                {loans.filter((loan) => loan.status === 'Requested').length}
                            </Typography>
                            <Typography variant="body2">Pending Requests</Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={4}>
                    <Card sx={{ bgcolor: 'success.light', color: 'success.contrastText' }}>
                        <CardContent>
                            <Typography variant="h5" component="div">
                                {loans.filter((loan) => loan.status === 'Repaid').length}
                            </Typography>
                            <Typography variant="body2">Repaid Loans</Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <Button variant="contained" sx={{ mt: 3 }} onClick={() => navigate('/my-loans')}>
                View All Loans
            </Button>
        </Paper>
    );

    const renderQuickActions = () => (
        <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
                Quick Actions
            </Typography>

            <List>
                <ListItem button onClick={() => navigate('/apply')}>
                    <ListItemIcon>
                        <AssignmentIcon />
                    </ListItemIcon>
                    <ListItemText primary="Apply for a New Loan" />
                </ListItem>

                <Divider />

                <ListItem button onClick={() => navigate('/marketplace')}>
                    <ListItemIcon>
                        <AccountBalanceIcon />
                    </ListItemIcon>
                    <ListItemText primary="Browse Loan Marketplace" />
                </ListItem>

                <Divider />

                <ListItem button onClick={() => navigate('/my-loans')}>
                    <ListItemIcon>
                        <TrendingUpIcon />
                    </ListItemIcon>
                    <ListItemText primary="Manage Your Loans" />
                </ListItem>

                {user?.role === 'risk-assessor' && (
                    <>
                        <Divider />
                        <ListItem button onClick={() => navigate('/risk-assessment')}>
                            <ListItemIcon>
                                <WarningIcon />
                            </ListItemIcon>
                            <ListItemText primary="Risk Assessment Dashboard" />
                        </ListItem>
                    </>
                )}
            </List>
        </Paper>
    );

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
                Dashboard
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                    {renderWalletSection()}
                    {renderLoanSummary()}
                    {renderUserSection()}
                </Grid>

                <Grid item xs={12} md={4}>
                    {renderQuickActions()}
                </Grid>
            </Grid>
        </Box>
    );
};

export default Dashboard;
