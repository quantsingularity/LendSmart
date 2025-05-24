import React from 'react';
import { 
  Typography, 
  Box, 
  Button, 
  Grid, 
  Paper, 
  Container, 
  Card, 
  CardContent, 
  CardMedia, 
  Stack,
  Divider,
  useTheme,
  alpha,
  styled
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import SecurityIcon from '@mui/icons-material/Security';
import SpeedIcon from '@mui/icons-material/Speed';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AutoGraphIcon from '@mui/icons-material/AutoGraph';
import PeopleIcon from '@mui/icons-material/People';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';

// Styled components
const HeroSection = styled(Box)(({ theme }) => ({
  position: 'relative',
  padding: theme.spacing(10, 0),
  overflow: 'hidden',
  borderRadius: theme.shape.borderRadius * 2,
  marginBottom: theme.spacing(6),
  background: theme.palette.mode === 'light'
    ? 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)'
    : 'linear-gradient(135deg, #121212 0%, #1e1e1e 100%)',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    background: theme.palette.mode === 'light'
      ? 'radial-gradient(circle at 20% 150%, rgba(58, 134, 255, 0.15) 0%, rgba(0, 198, 255, 0.05) 50%, transparent 70%)'
      : 'radial-gradient(circle at 20% 150%, rgba(58, 134, 255, 0.2) 0%, rgba(0, 198, 255, 0.1) 50%, transparent 70%)',
  }
}));

const GradientText = styled(Typography)(({ theme }) => ({
  background: theme.palette.mode === 'light'
    ? 'linear-gradient(45deg, #3a86ff 0%, #00c6ff 100%)'
    : 'linear-gradient(45deg, #3a86ff 30%, #00c6ff 90%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
  textFillColor: 'transparent',
  fontWeight: 700,
}));

const FeatureCard = styled(Card)(({ theme }) => ({
  height: '100%',
  transition: 'all 0.3s ease-in-out',
  overflow: 'visible',
  position: 'relative',
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: theme.shadows[8],
    '& .MuiCardMedia-root': {
      transform: 'scale(1.05) translateY(-5px)',
    }
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '4px',
    background: 'linear-gradient(90deg, #3a86ff, #00c6ff)',
    borderTopLeftRadius: theme.shape.borderRadius,
    borderTopRightRadius: theme.shape.borderRadius,
  }
}));

const IconBox = styled(Box)(({ theme }) => ({
  width: 60,
  height: 60,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: theme.spacing(2),
  background: theme.palette.mode === 'light'
    ? alpha(theme.palette.primary.main, 0.1)
    : alpha(theme.palette.primary.main, 0.2),
  color: theme.palette.primary.main,
}));

const StepCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  height: '100%',
  position: 'relative',
  overflow: 'hidden',
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '100%',
    height: '3px',
    background: 'linear-gradient(90deg, #3a86ff, #00c6ff)',
  }
}));

const StepNumber = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: theme.spacing(2),
  right: theme.spacing(2),
  width: 30,
  height: 30,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: theme.palette.mode === 'light'
    ? alpha(theme.palette.primary.main, 0.1)
    : alpha(theme.palette.primary.main, 0.2),
  color: theme.palette.primary.main,
  fontWeight: 600,
  fontSize: '0.875rem',
}));

function Home() {
  const navigate = useNavigate();
  const { isAuthenticated, connectWallet } = useAuth();
  const theme = useTheme();

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      connectWallet();
    }
  };

  const features = [
    {
      title: "Decentralized Lending",
      description: "Connect directly with borrowers or lenders without intermediaries. Smart contracts ensure transparent and secure transactions.",
      icon: <PeopleIcon fontSize="large" />
    },
    {
      title: "AI-Powered Risk Assessment",
      description: "Our advanced machine learning models evaluate creditworthiness and suggest optimal interest rates based on risk profiles.",
      icon: <AutoGraphIcon fontSize="large" />
    },
    {
      title: "Immutable Records",
      description: "All loan transactions are recorded on the blockchain, ensuring transparency and preventing fraud or manipulation.",
      icon: <SecurityIcon fontSize="large" />
    }
  ];

  const borrowerSteps = [
    "Connect your wallet and complete your profile",
    "Submit a loan application with your financial details",
    "Receive AI-based risk assessment and loan terms",
    "Once funded, receive funds directly to your wallet"
  ];

  const lenderSteps = [
    "Connect your wallet and browse available loan requests",
    "Review borrower profiles and risk assessments",
    "Fund loans that match your risk tolerance and return expectations",
    "Track repayments and earnings through your dashboard"
  ];

  return (
    <Box>
      <HeroSection>
        <Container>
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={7}>
              <Box sx={{ position: 'relative', zIndex: 1 }}>
                <GradientText variant="h2" component="h1" gutterBottom>
                  Smart Lending for a Decentralized World
                </GradientText>
                <Typography variant="h5" color="text.secondary" paragraph sx={{ mb: 4, maxWidth: '90%' }}>
                  A decentralized peer-to-peer lending platform powered by blockchain and AI, making finance accessible to everyone.
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    size="large" 
                    onClick={handleGetStarted}
                    endIcon={<ArrowForwardIcon />}
                    sx={{ px: 4, py: 1.5 }}
                  >
                    {isAuthenticated ? 'Go to Dashboard' : 'Connect Wallet'}
                  </Button>
                  <Button 
                    variant="outlined" 
                    color="primary" 
                    size="large" 
                    onClick={() => navigate('/marketplace')}
                    sx={{ px: 4, py: 1.5 }}
                  >
                    Browse Marketplace
                  </Button>
                </Stack>
              </Box>
            </Grid>
            <Grid item xs={12} md={5} sx={{ display: { xs: 'none', md: 'block' } }}>
              <Box sx={{ 
                position: 'relative', 
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: '-20px',
                  left: '-20px',
                  width: '100%',
                  height: '100%',
                  borderRadius: '20px',
                  background: alpha(theme.palette.primary.main, 0.1),
                  zIndex: 0
                }
              }}>
                <Card sx={{ 
                  borderRadius: '20px', 
                  overflow: 'hidden',
                  position: 'relative',
                  zIndex: 1,
                  boxShadow: theme.shadows[4]
                }}>
                  <CardMedia
                    component="img"
                    height="300"
                    image="https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
                    alt="Blockchain lending"
                  />
                </Card>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </HeroSection>

      <Container>
        <Box sx={{ mb: 8, textAlign: 'center' }}>
          <Typography variant="overline" color="primary" fontWeight={500}>
            FEATURES
          </Typography>
          <Typography variant="h3" component="h2" gutterBottom sx={{ mb: 1 }}>
            Why Choose <GradientText component="span">LendSmart</GradientText>
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 6, maxWidth: 700, mx: 'auto' }}>
            Our platform combines the security of blockchain with the intelligence of AI to create a lending experience that's transparent, efficient, and accessible to everyone.
          </Typography>

          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid item xs={12} md={4} key={index}>
                <FeatureCard elevation={3}>
                  <CardContent sx={{ p: 4, textAlign: 'center' }}>
                    <IconBox>
                      {feature.icon}
                    </IconBox>
                    <Typography variant="h5" component="h3" gutterBottom>
                      {feature.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {feature.description}
                    </Typography>
                  </CardContent>
                </FeatureCard>
              </Grid>
            ))}
          </Grid>
        </Box>

        <Box sx={{ mb: 8 }}>
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
              <Box sx={{ position: 'relative' }}>
                <Card sx={{ 
                  borderRadius: '20px', 
                  overflow: 'hidden',
                  boxShadow: theme.shadows[4]
                }}>
                  <CardMedia
                    component="img"
                    height="400"
                    image="https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
                    alt="Financial growth"
                  />
                </Card>
                <Box sx={{ 
                  position: 'absolute', 
                  bottom: -30, 
                  right: -30, 
                  width: 120, 
                  height: 120, 
                  borderRadius: '50%',
                  background: 'linear-gradient(45deg, #3a86ff 0%, #00c6ff 100%)',
                  display: { xs: 'none', md: 'flex' },
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: theme.shadows[4]
                }}>
                  <Typography variant="h4" color="white" fontWeight={700}>
                    24/7
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="overline" color="primary" fontWeight={500}>
                BENEFITS
              </Typography>
              <Typography variant="h3" component="h2" gutterBottom>
                Financial Freedom, Reimagined
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                LendSmart is revolutionizing the lending industry by removing barriers and creating opportunities for everyone, regardless of their traditional credit history.
              </Typography>
              
              <Grid container spacing={3} sx={{ mt: 2 }}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                    <AccountBalanceWalletIcon color="primary" sx={{ mr: 2 }} />
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        Lower Fees
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Cut out intermediaries and save on transaction costs
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                    <SpeedIcon color="primary" sx={{ mr: 2 }} />
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        Faster Processing
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Get funds quickly with automated approval processes
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                    <SecurityIcon color="primary" sx={{ mr: 2 }} />
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        Enhanced Security
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Blockchain technology ensures your transactions are secure
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                    <VerifiedUserIcon color="primary" sx={{ mr: 2 }} />
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        Fair Assessment
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        AI-powered risk assessment for fair lending opportunities
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Box>

        <Box sx={{ mb: 8 }}>
          <Typography variant="h4" component="h2" gutterBottom textAlign="center" sx={{ mb: 4 }}>
            How It Works
          </Typography>
          
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Typography variant="h5" gutterBottom sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
                <Box component="span" sx={{ 
                  width: 36, 
                  height: 36, 
                  borderRadius: '50%', 
                  background: alpha(theme.palette.primary.main, 0.1),
                  color: theme.palette.primary.main,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 600,
                  mr: 2
                }}>B</Box>
                For Borrowers
              </Typography>
              
              <Grid container spacing={2}>
                {borrowerSteps.map((step, index) => (
                  <Grid item xs={12} key={index}>
                    <StepCard elevation={2}>
                      <StepNumber>{index + 1}</StepNumber>
                      <Typography variant="body1" paragraph>
                        {step}
                      </Typography>
                    </StepCard>
                  </Grid>
                ))}
              </Grid>
              
              <Button 
                variant="contained" 
                color="primary" 
                sx={{ mt: 3 }}
                endIcon={<ArrowForwardIcon />}
                onClick={() => navigate('/apply')}
                fullWidth
              >
                Apply for a Loan
              </Button>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="h5" gutterBottom sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
                <Box component="span" sx={{ 
                  width: 36, 
                  height: 36, 
                  borderRadius: '50%', 
                  background: alpha(theme.palette.secondary.main, 0.1),
                  color: theme.palette.secondary.main,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 600,
                  mr: 2
                }}>L</Box>
                For Lenders
              </Typography>
              
              <Grid container spacing={2}>
                {lenderSteps.map((step, index) => (
                  <Grid item xs={12} key={index}>
                    <StepCard elevation={2}>
                      <StepNumber>{index + 1}</StepNumber>
                      <Typography variant="body1" paragraph>
                        {step}
                      </Typography>
                    </StepCard>
                  </Grid>
                ))}
              </Grid>
              
              <Button 
                variant="outlined" 
                color="primary" 
                sx={{ mt: 3 }}
                endIcon={<ArrowForwardIcon />}
                onClick={() => navigate('/marketplace')}
                fullWidth
              >
                Browse Loan Marketplace
              </Button>
            </Grid>
          </Grid>
        </Box>

        <Box sx={{ mb: 4, textAlign: 'center', py: 6 }}>
          <Card sx={{ 
            p: 6, 
            borderRadius: 4,
            background: theme.palette.mode === 'light'
              ? 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)'
              : 'linear-gradient(135deg, #121212 0%, #1e1e1e 100%)',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
              background: theme.palette.mode === 'light'
                ? 'radial-gradient(circle at 80% 50%, rgba(58, 134, 255, 0.15) 0%, rgba(0, 198, 255, 0.05) 50%, transparent 70%)'
                : 'radial-gradient(circle at 80% 50%, rgba(58, 134, 255, 0.2) 0%, rgba(0, 198, 255, 0.1) 50%, transparent 70%)',
            }
          }}>
            <Typography variant="h3" component="h2" gutterBottom>
              Ready to Get Started?
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph sx={{ maxWidth: 700, mx: 'auto', mb: 4 }}>
              Join thousands of users already benefiting from our decentralized lending platform. Connect your wallet today and experience the future of finance.
            </Typography>
            <Button 
              variant="contained" 
              color="primary" 
              size="large" 
              onClick={handleGetStarted}
              endIcon={<ArrowForwardIcon />}
              sx={{ px: 4, py: 1.5 }}
            >
              {isAuthenticated ? 'Go to Dashboard' : 'Connect Wallet to Get Started'}
            </Button>
          </Card>
        </Box>
      </Container>
    </Box>
  );
}

export default Home;
