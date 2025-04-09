import React from 'react';
import { Typography, Box, Button, Grid, Paper, Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Home() {
  const navigate = useNavigate();
  const { isAuthenticated, connectWallet } = useAuth();

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      connectWallet();
    }
  };

  return (
    <Container>
      <Box sx={{ my: 4, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Welcome to LendSmart
        </Typography>
        <Typography variant="h5" color="text.secondary" paragraph>
          A decentralized peer-to-peer lending platform powered by blockchain and AI
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          size="large" 
          onClick={handleGetStarted}
          sx={{ mt: 2 }}
        >
          {isAuthenticated ? 'Go to Dashboard' : 'Connect Wallet to Get Started'}
        </Button>
      </Box>

      <Grid container spacing={4} sx={{ mt: 4 }}>
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
            <Typography variant="h5" component="h2" gutterBottom>
              Decentralized Lending
            </Typography>
            <Typography variant="body1">
              Connect directly with borrowers or lenders without intermediaries.
              Smart contracts ensure transparent and secure transactions.
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
            <Typography variant="h5" component="h2" gutterBottom>
              AI-Powered Risk Assessment
            </Typography>
            <Typography variant="body1">
              Our advanced machine learning models evaluate creditworthiness
              and suggest optimal interest rates based on risk profiles.
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
            <Typography variant="h5" component="h2" gutterBottom>
              Immutable Records
            </Typography>
            <Typography variant="body1">
              All loan transactions are recorded on the blockchain,
              ensuring transparency and preventing fraud or manipulation.
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Box sx={{ my: 6 }}>
        <Typography variant="h4" component="h2" gutterBottom textAlign="center">
          How It Works
        </Typography>
        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 3, mb: 2 }}>
              <Typography variant="h6" gutterBottom>For Borrowers</Typography>
              <Typography variant="body1" paragraph>
                1. Connect your wallet and complete your profile
              </Typography>
              <Typography variant="body1" paragraph>
                2. Submit a loan application with your financial details
              </Typography>
              <Typography variant="body1" paragraph>
                3. Receive AI-based risk assessment and loan terms
              </Typography>
              <Typography variant="body1">
                4. Once funded, receive funds directly to your wallet
              </Typography>
              <Button 
                variant="outlined" 
                color="primary" 
                sx={{ mt: 2 }}
                onClick={() => navigate('/apply')}
              >
                Apply for a Loan
              </Button>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 3, mb: 2 }}>
              <Typography variant="h6" gutterBottom>For Lenders</Typography>
              <Typography variant="body1" paragraph>
                1. Connect your wallet and browse available loan requests
              </Typography>
              <Typography variant="body1" paragraph>
                2. Review borrower profiles and risk assessments
              </Typography>
              <Typography variant="body1" paragraph>
                3. Fund loans that match your risk tolerance and return expectations
              </Typography>
              <Typography variant="body1">
                4. Track repayments and earnings through your dashboard
              </Typography>
              <Button 
                variant="outlined" 
                color="primary" 
                sx={{ mt: 2 }}
                onClick={() => navigate('/marketplace')}
              >
                Browse Loan Marketplace
              </Button>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
}

export default Home;
