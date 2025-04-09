import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Box, 
  Grid, 
  Paper, 
  Container, 
  Tabs, 
  Tab, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Button,
  Chip,
  CircularProgress
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { ethers } from 'ethers';

function Dashboard() {
  const { userProfile } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalLoans: 0,
    activeLoans: 0,
    totalBorrowed: 0,
    totalLent: 0
  });

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  useEffect(() => {
    const fetchLoans = async () => {
      try {
        if (userProfile && userProfile.address) {
          setLoading(true);
          // In a real app, you would fetch from your backend
          const response = await axios.get(`/api/borrower/${userProfile.address}/loans`);
          setLoans(response.data || []);
          
          // Calculate stats
          const activeLoans = response.data.filter(loan => loan.status === 'Approved');
          const totalBorrowed = activeLoans.reduce((sum, loan) => sum + parseFloat(loan.amount), 0);
          
          setStats({
            totalLoans: response.data.length,
            activeLoans: activeLoans.length,
            totalBorrowed,
            totalLent: 0 // This would be calculated from lender data
          });
        }
      } catch (error) {
        console.error('Error fetching loans:', error);
        // For demo purposes, create sample data
        const sampleLoans = [
          {
            id: 1,
            amount: 5000,
            interest_rate: 8.5,
            duration: 90,
            status: 'Approved',
            due_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 2,
            amount: 2500,
            interest_rate: 7.2,
            duration: 30,
            status: 'Pending',
            due_date: null
          },
          {
            id: 3,
            amount: 10000,
            interest_rate: 9.0,
            duration: 180,
            status: 'Repaid',
            due_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
          }
        ];
        setLoans(sampleLoans);
        
        setStats({
          totalLoans: sampleLoans.length,
          activeLoans: sampleLoans.filter(loan => loan.status === 'Approved').length,
          totalBorrowed: sampleLoans.filter(loan => loan.status === 'Approved')
            .reduce((sum, loan) => sum + loan.amount, 0),
          totalLent: 0
        });
      } finally {
        setLoading(false);
      }
    };

    fetchLoans();
  }, [userProfile]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Approved': return 'success';
      case 'Pending': return 'warning';
      case 'Repaid': return 'info';
      case 'Defaulted': return 'error';
      default: return 'default';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Container>
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard
      </Typography>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Paper elevation={3} sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary">Total Loans</Typography>
                <Typography variant="h4">{stats.totalLoans}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper elevation={3} sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary">Active Loans</Typography>
                <Typography variant="h4">{stats.activeLoans}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper elevation={3} sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary">Total Borrowed</Typography>
                <Typography variant="h4">{formatCurrency(stats.totalBorrowed)}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper elevation={3} sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary">Wallet Balance</Typography>
                <Typography variant="h4">
                  {userProfile?.balance ? 
                    `${parseFloat(ethers.utils.formatEther(userProfile.balance)).toFixed(4)} ETH` : 
                    '0 ETH'}
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          <Paper elevation={2} sx={{ mb: 4 }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={tabValue} onChange={handleTabChange} aria-label="dashboard tabs">
                <Tab label="My Loans" />
                <Tab label="My Investments" />
                <Tab label="Transaction History" />
              </Tabs>
            </Box>
            
            <Box sx={{ p: 3 }}>
              {tabValue === 0 && (
                <>
                  <Typography variant="h6" gutterBottom>My Loans</Typography>
                  {loans.length > 0 ? (
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>ID</TableCell>
                            <TableCell>Amount</TableCell>
                            <TableCell>Interest Rate</TableCell>
                            <TableCell>Duration (days)</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Due Date</TableCell>
                            <TableCell>Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {loans.map((loan) => (
                            <TableRow key={loan.id}>
                              <TableCell>{loan.id}</TableCell>
                              <TableCell>{formatCurrency(loan.amount)}</TableCell>
                              <TableCell>{loan.interest_rate}%</TableCell>
                              <TableCell>{loan.duration}</TableCell>
                              <TableCell>
                                <Chip 
                                  label={loan.status} 
                                  color={getStatusColor(loan.status)} 
                                  size="small" 
                                />
                              </TableCell>
                              <TableCell>{formatDate(loan.due_date)}</TableCell>
                              <TableCell>
                                {loan.status === 'Approved' && (
                                  <Button size="small" variant="outlined">
                                    Repay
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
                      You don't have any loans yet.
                    </Typography>
                  )}
                </>
              )}
              
              {tabValue === 1 && (
                <>
                  <Typography variant="h6" gutterBottom>My Investments</Typography>
                  <Typography variant="body1" sx={{ py: 2 }}>
                    You don't have any active investments.
                  </Typography>
                </>
              )}
              
              {tabValue === 2 && (
                <>
                  <Typography variant="h6" gutterBottom>Transaction History</Typography>
                  <Typography variant="body1" sx={{ py: 2 }}>
                    No transactions to display.
                  </Typography>
                </>
              )}
            </Box>
          </Paper>
        </>
      )}
    </Container>
  );
}

export default Dashboard;
