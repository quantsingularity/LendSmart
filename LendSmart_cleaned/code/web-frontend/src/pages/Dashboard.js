import React from 'react';
import { 
  Typography, 
  Box, 
  Grid, 
  Paper, 
  Container, 
  Card, 
  CardContent, 
  Divider,
  Button,
  Avatar,
  Chip,
  Stack,
  LinearProgress,
  useTheme,
  alpha,
  styled,
  Tab,
  Tabs
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import PaymentsIcon from '@mui/icons-material/Payments';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import StarIcon from '@mui/icons-material/Star';
import BarChartIcon from '@mui/icons-material/BarChart';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Styled components
const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[4],
  }
}));

const GradientBox = styled(Box)(({ theme }) => ({
  background: theme.palette.mode === 'light'
    ? 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)'
    : 'linear-gradient(135deg, #121212 0%, #1e1e1e 100%)',
  position: 'relative',
  borderRadius: theme.shape.borderRadius * 2,
  padding: theme.spacing(3),
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    background: theme.palette.mode === 'light'
      ? 'radial-gradient(circle at 20% 50%, rgba(58, 134, 255, 0.15) 0%, rgba(0, 198, 255, 0.05) 50%, transparent 70%)'
      : 'radial-gradient(circle at 20% 50%, rgba(58, 134, 255, 0.2) 0%, rgba(0, 198, 255, 0.1) 50%, transparent 70%)',
  }
}));

const StyledTabs = styled(Tabs)(({ theme }) => ({
  '& .MuiTabs-indicator': {
    backgroundColor: theme.palette.primary.main,
    height: 3,
    borderRadius: '3px 3px 0 0',
  },
}));

const StyledTab = styled(Tab)(({ theme }) => ({
  textTransform: 'none',
  fontWeight: 500,
  fontSize: '0.875rem',
  marginRight: theme.spacing(4),
  '&.Mui-selected': {
    color: theme.palette.primary.main,
    fontWeight: 600,
  },
  '&.Mui-focusVisible': {
    backgroundColor: alpha(theme.palette.primary.main, 0.1),
  },
}));

const IconBox = styled(Box)(({ theme, color = 'primary' }) => ({
  width: 48,
  height: 48,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: alpha(theme.palette[color].main, 0.1),
  color: theme.palette[color].main,
}));

const StatCard = styled(Card)(({ theme, color = 'primary' }) => ({
  height: '100%',
  position: 'relative',
  overflow: 'hidden',
  '&::after': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '4px',
    height: '100%',
    backgroundColor: theme.palette[color].main,
  }
}));

function Dashboard() {
  const { userProfile } = useAuth();
  const theme = useTheme();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Mock data
  const activeLoans = [
    {
      id: 'L-2023-001',
      amount: '2.5 ETH',
      status: 'Active',
      progress: 65,
      nextPayment: '2023-05-15',
      type: 'Borrowing'
    },
    {
      id: 'L-2023-003',
      amount: '1.2 ETH',
      status: 'Active',
      progress: 30,
      nextPayment: '2023-05-20',
      type: 'Lending'
    }
  ];

  const recentTransactions = [
    {
      id: 'TX-001',
      type: 'Payment Received',
      amount: '0.25 ETH',
      date: '2023-04-05',
      status: 'Completed'
    },
    {
      id: 'TX-002',
      type: 'Loan Disbursement',
      amount: '1.2 ETH',
      date: '2023-03-28',
      status: 'Completed'
    },
    {
      id: 'TX-003',
      type: 'Payment Sent',
      amount: '0.15 ETH',
      date: '2023-03-15',
      status: 'Completed'
    }
  ];

  const stats = [
    {
      title: 'Total Balance',
      value: userProfile?.balance || '0 ETH',
      icon: <AccountBalanceWalletIcon />,
      color: 'primary'
    },
    {
      title: 'Active Loans',
      value: '2',
      icon: <ReceiptLongIcon />,
      color: 'secondary'
    },
    {
      title: 'Total Borrowed',
      value: '2.5 ETH',
      icon: <PaymentsIcon />,
      color: 'success'
    },
    {
      title: 'Total Lent',
      value: '1.2 ETH',
      icon: <TrendingUpIcon />,
      color: 'warning'
    }
  ];

  return (
    <Container>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Welcome back, {userProfile?.shortAddress}. Here's your financial overview.
        </Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <StatCard elevation={2} color={stat.color}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    {stat.title}
                  </Typography>
                  <IconBox color={stat.color}>
                    {stat.icon}
                  </IconBox>
                </Box>
                <Typography variant="h5" component="div" fontWeight={600}>
                  {stat.value}
                </Typography>
              </CardContent>
            </StatCard>
          </Grid>
        ))}
      </Grid>

      <GradientBox sx={{ mb: 4, p: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={7}>
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Typography variant="h5" gutterBottom>
                Your Reputation Score
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Typography variant="h3" component="div" fontWeight={600} color="primary">
                  {userProfile?.reputation || '0'}/5.0
                </Typography>
                <Chip 
                  label="Excellent" 
                  color="success" 
                  size="small" 
                  sx={{ ml: 2, fontWeight: 500 }} 
                />
              </Box>
              <Typography variant="body2" color="text.secondary" paragraph>
                Your excellent reputation score qualifies you for the best loan rates and higher borrowing limits.
              </Typography>
              <Button 
                variant="outlined" 
                color="primary" 
                onClick={() => navigate('/reputation')}
              >
                View Details
              </Button>
            </Box>
          </Grid>
          <Grid item xs={12} md={5}>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center',
              position: 'relative',
              zIndex: 1
            }}>
              <Box sx={{ 
                width: 180, 
                height: 180, 
                borderRadius: '50%', 
                background: `conic-gradient(${theme.palette.success.main} ${userProfile?.reputation / 5 * 100}%, ${alpha(theme.palette.divider, 0.2)} 0)`,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                boxShadow: theme.shadows[4]
              }}>
                <Box sx={{ 
                  width: 150, 
                  height: 150, 
                  borderRadius: '50%', 
                  bgcolor: theme.palette.background.paper,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  flexDirection: 'column'
                }}>
                  <Typography variant="h4" fontWeight={700} color="primary">
                    {userProfile?.reputation || '0'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    out of 5.0
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </GradientBox>

      <Box sx={{ mb: 4 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <StyledTabs value={tabValue} onChange={handleTabChange} aria-label="dashboard tabs">
            <StyledTab label="Active Loans" />
            <StyledTab label="Recent Transactions" />
            <StyledTab label="Opportunities" />
          </StyledTabs>
        </Box>

        {/* Active Loans Tab */}
        {tabValue === 0 && (
          <Grid container spacing={3}>
            {activeLoans.map((loan, index) => (
              <Grid item xs={12} md={6} key={index}>
                <StyledCard elevation={2}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="subtitle1" fontWeight={500}>
                        Loan #{loan.id}
                      </Typography>
                      <Chip 
                        label={loan.type} 
                        color={loan.type === 'Borrowing' ? 'primary' : 'secondary'} 
                        size="small" 
                        sx={{ fontWeight: 500 }} 
                      />
                    </Box>
                    <Divider sx={{ my: 2 }} />
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Amount
                        </Typography>
                        <Typography variant="body1" fontWeight={500}>
                          {loan.amount}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Status
                        </Typography>
                        <Typography variant="body1" fontWeight={500}>
                          {loan.status}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Next Payment
                        </Typography>
                        <Typography variant="body1" fontWeight={500}>
                          {loan.nextPayment}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Progress
                        </Typography>
                        <Typography variant="body1" fontWeight={500}>
                          {loan.progress}%
                        </Typography>
                      </Grid>
                    </Grid>
                    <Box sx={{ mt: 2 }}>
                      <LinearProgress 
                        variant="determinate" 
                        value={loan.progress} 
                        sx={{ 
                          height: 8, 
                          borderRadius: 4,
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 4,
                            background: loan.type === 'Borrowing' 
                              ? 'linear-gradient(90deg, #3a86ff, #00c6ff)' 
                              : 'linear-gradient(90deg, #ff006e, #ff5e78)',
                          }
                        }} 
                      />
                    </Box>
                    <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                      <Button variant="outlined" color="primary" size="small">
                        View Details
                      </Button>
                    </Box>
                  </CardContent>
                </StyledCard>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Recent Transactions Tab */}
        {tabValue === 1 && (
          <StyledCard elevation={2}>
            <CardContent sx={{ p: 0 }}>
              {recentTransactions.map((transaction, index) => (
                <React.Fragment key={transaction.id}>
                  <Box sx={{ p: 3 }}>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} sm={5}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar 
                            sx={{ 
                              bgcolor: transaction.type.includes('Received') 
                                ? alpha(theme.palette.success.main, 0.1) 
                                : alpha(theme.palette.primary.main, 0.1),
                              color: transaction.type.includes('Received') 
                                ? theme.palette.success.main 
                                : theme.palette.primary.main,
                              mr: 2
                            }}
                          >
                            {transaction.type.includes('Received') ? 'R' : 'S'}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2">
                              {transaction.type}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {transaction.date}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="body2" color="text.secondary">
                          Amount
                        </Typography>
                        <Typography variant="body1" fontWeight={500}>
                          {transaction.amount}
                        </Typography>
                      </Grid>
                      <Grid item xs={6} sm={2}>
                        <Typography variant="body2" color="text.secondary">
                          Status
                        </Typography>
                        <Chip 
                          label={transaction.status} 
                          color="success" 
                          size="small" 
                          sx={{ fontWeight: 500 }} 
                        />
                      </Grid>
                      <Grid item xs={12} sm={2} sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                        <Button variant="text" color="primary" size="small">
                          Details
                        </Button>
                      </Grid>
                    </Grid>
                  </Box>
                  {index < recentTransactions.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </CardContent>
          </StyledCard>
        )}

        {/* Opportunities Tab */}
        {tabValue === 2 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" gutterBottom>
              Personalized Opportunities
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Based on your profile and reputation score, we've found some great opportunities for you.
            </Typography>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={() => navigate('/marketplace')}
              sx={{ mt: 2 }}
            >
              Explore Marketplace
            </Button>
          </Box>
        )}
      </Box>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Quick Actions
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={6} sm={3}>
            <Button 
              variant="outlined" 
              color="primary" 
              fullWidth 
              onClick={() => navigate('/apply')}
              sx={{ 
                p: 2, 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                borderWidth: 2,
                '&:hover': {
                  borderWidth: 2,
                }
              }}
            >
              <Box sx={{ mb: 1 }}>
                <PaymentsIcon />
              </Box>
              Apply for Loan
            </Button>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Button 
              variant="outlined" 
              color="primary" 
              fullWidth 
              onClick={() => navigate('/marketplace')}
              sx={{ 
                p: 2, 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                borderWidth: 2,
                '&:hover': {
                  borderWidth: 2,
                }
              }}
            >
              <Box sx={{ mb: 1 }}>
                <TrendingUpIcon />
              </Box>
              Invest in Loans
            </Button>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Button 
              variant="outlined" 
              color="primary" 
              fullWidth 
              onClick={() => navigate('/reputation')}
              sx={{ 
                p: 2, 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                borderWidth: 2,
                '&:hover': {
                  borderWidth: 2,
                }
              }}
            >
              <Box sx={{ mb: 1 }}>
                <StarIcon />
              </Box>
              Improve Score
            </Button>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Button 
              variant="outlined" 
              color="primary" 
              fullWidth 
              onClick={() => navigate('/analytics')}
              sx={{ 
                p: 2, 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                borderWidth: 2,
                '&:hover': {
                  borderWidth: 2,
                }
              }}
            >
              <Box sx={{ mb: 1 }}>
                <BarChartIcon />
              </Box>
              View Analytics
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
}

export default Dashboard;
