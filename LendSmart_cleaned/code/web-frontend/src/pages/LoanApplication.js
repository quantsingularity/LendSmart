import React, { useState } from 'react';
import { 
  Typography, 
  Box, 
  Grid, 
  Paper, 
  Container, 
  TextField, 
  Button, 
  Slider, 
  MenuItem, 
  FormControl, 
  InputLabel, 
  Select, 
  Stepper, 
  Step, 
  StepLabel,
  Card,
  CardContent,
  Divider,
  useTheme,
  alpha,
  styled,
  InputAdornment,
  Stack
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PercentIcon from '@mui/icons-material/Percent';
import DescriptionIcon from '@mui/icons-material/Description';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

// Styled components
const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  borderRadius: theme.shape.borderRadius * 2,
  boxShadow: theme.shadows[2],
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
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

const StyledSlider = styled(Slider)(({ theme }) => ({
  height: 8,
  '& .MuiSlider-track': {
    border: 'none',
    background: 'linear-gradient(90deg, #3a86ff, #00c6ff)',
  },
  '& .MuiSlider-thumb': {
    height: 24,
    width: 24,
    backgroundColor: '#fff',
    border: '2px solid #3a86ff',
    '&:focus, &:hover, &.Mui-active, &.Mui-focusVisible': {
      boxShadow: '0 0 0 8px rgba(58, 134, 255, 0.16)',
    },
    '&:before': {
      display: 'none',
    },
  },
  '& .MuiSlider-valueLabel': {
    lineHeight: 1.2,
    fontSize: 12,
    background: 'unset',
    padding: 0,
    width: 32,
    height: 32,
    borderRadius: '50% 50% 50% 0',
    backgroundColor: '#3a86ff',
    transformOrigin: 'bottom left',
    transform: 'translate(50%, -100%) rotate(-45deg) scale(0)',
    '&:before': { display: 'none' },
    '&.MuiSlider-valueLabelOpen': {
      transform: 'translate(50%, -100%) rotate(-45deg) scale(1)',
    },
    '& > *': {
      transform: 'rotate(45deg)',
    },
  },
}));

const StyledStepper = styled(Stepper)(({ theme }) => ({
  '& .MuiStepConnector-line': {
    borderTopWidth: 3,
    borderRadius: 1,
  },
  '& .MuiStepConnector-root.Mui-active .MuiStepConnector-line': {
    borderColor: theme.palette.primary.main,
  },
  '& .MuiStepConnector-root.Mui-completed .MuiStepConnector-line': {
    borderColor: theme.palette.primary.main,
  },
  '& .MuiStepLabel-iconContainer': {
    '& .MuiStepIcon-root': {
      color: alpha(theme.palette.primary.main, 0.4),
      '&.Mui-active': {
        color: theme.palette.primary.main,
      },
      '&.Mui-completed': {
        color: theme.palette.primary.main,
      },
    },
  },
}));

const SummaryItem = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  padding: theme.spacing(1.5, 0),
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  '&:last-child': {
    borderBottom: 'none',
  }
}));

function LoanApplication() {
  const { isAuthenticated, userProfile } = useAuth();
  const theme = useTheme();
  
  // Stepper state
  const [activeStep, setActiveStep] = useState(0);
  const steps = ['Loan Details', 'Personal Information', 'Review & Submit'];
  
  // Form state
  const [loanAmount, setLoanAmount] = useState(1);
  const [loanTerm, setLoanTerm] = useState(6);
  const [loanPurpose, setLoanPurpose] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [income, setIncome] = useState('');
  const [employment, setEmployment] = useState('');
  
  // Calculated values
  const interestRate = 5 + (loanAmount > 3 ? 2 : 0) + (loanTerm > 12 ? 1 : 0);
  const monthlyPayment = (loanAmount * (1 + interestRate / 100 * loanTerm / 12)) / loanTerm;
  
  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };
  
  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };
  
  const handleSubmit = () => {
    // In a real app, this would submit the loan application
    setActiveStep(3); // Move to success state
  };
  
  return (
    <Container>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Loan Application
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Complete the form below to apply for a loan. All information is securely stored on the blockchain.
        </Typography>
      </Box>
      
      <StyledStepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </StyledStepper>
      
      {activeStep === 0 && (
        <StyledPaper elevation={0}>
          <Typography variant="h5" gutterBottom>
            Loan Details
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Specify the amount you wish to borrow and the repayment period.
          </Typography>
          
          <Grid container spacing={4}>
            <Grid item xs={12}>
              <Typography gutterBottom>
                Loan Amount (ETH)
              </Typography>
              <StyledSlider
                value={loanAmount}
                onChange={(e, newValue) => setLoanAmount(newValue)}
                min={0.1}
                max={5}
                step={0.1}
                valueLabelDisplay="auto"
                aria-labelledby="loan-amount-slider"
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                <Typography variant="body2" color="text.secondary">0.1 ETH</Typography>
                <Typography variant="body2" color="text.secondary">5 ETH</Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12}>
              <Typography gutterBottom>
                Loan Term (months)
              </Typography>
              <StyledSlider
                value={loanTerm}
                onChange={(e, newValue) => setLoanTerm(newValue)}
                min={1}
                max={24}
                step={1}
                valueLabelDisplay="auto"
                aria-labelledby="loan-term-slider"
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                <Typography variant="body2" color="text.secondary">1 month</Typography>
                <Typography variant="body2" color="text.secondary">24 months</Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth variant="outlined">
                <InputLabel id="loan-purpose-label">Loan Purpose</InputLabel>
                <Select
                  labelId="loan-purpose-label"
                  id="loan-purpose"
                  value={loanPurpose}
                  onChange={(e) => setLoanPurpose(e.target.value)}
                  label="Loan Purpose"
                >
                  <MenuItem value="business">Business Expansion</MenuItem>
                  <MenuItem value="education">Education</MenuItem>
                  <MenuItem value="personal">Personal Expenses</MenuItem>
                  <MenuItem value="debt">Debt Consolidation</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          
          <Divider sx={{ my: 4 }} />
          
          <Typography variant="h6" gutterBottom>
            Loan Summary
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <SummaryItem>
                    <Typography variant="body2" color="text.secondary">
                      Loan Amount
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {loanAmount} ETH
                    </Typography>
                  </SummaryItem>
                  <SummaryItem>
                    <Typography variant="body2" color="text.secondary">
                      Loan Term
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {loanTerm} months
                    </Typography>
                  </SummaryItem>
                  <SummaryItem>
                    <Typography variant="body2" color="text.secondary">
                      Interest Rate
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {interestRate}%
                    </Typography>
                  </SummaryItem>
                  <SummaryItem>
                    <Typography variant="body2" color="text.secondary">
                      Monthly Payment
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {monthlyPayment.toFixed(4)} ETH
                    </Typography>
                  </SummaryItem>
                  <SummaryItem>
                    <Typography variant="body2" color="text.secondary">
                      Total Repayment
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {(monthlyPayment * loanTerm).toFixed(4)} ETH
                    </Typography>
                  </SummaryItem>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <GradientBox sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Box sx={{ position: 'relative', zIndex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <PercentIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">
                      Personalized Rate
                    </Typography>
                  </Box>
                  <Typography variant="body2" paragraph>
                    Based on your reputation score of {userProfile?.reputation || '0'}/5.0, you qualify for our competitive interest rate.
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <CheckCircleOutlineIcon color="success" sx={{ mr: 1 }} />
                    <Typography variant="body2">
                      No hidden fees or prepayment penalties
                    </Typography>
                  </Box>
                </Box>
              </GradientBox>
            </Grid>
          </Grid>
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleNext}
              disabled={!loanPurpose}
            >
              Continue
            </Button>
          </Box>
        </StyledPaper>
      )}
      
      {activeStep === 1 && (
        <StyledPaper elevation={0}>
          <Typography variant="h5" gutterBottom>
            Personal Information
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Please provide your personal details for the loan application.
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                id="firstName"
                label="First Name"
                fullWidth
                variant="outlined"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Box sx={{ color: 'text.secondary', opacity: 0.7 }}>
                        <DescriptionIcon fontSize="small" />
                      </Box>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                id="lastName"
                label="Last Name"
                fullWidth
                variant="outlined"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Box sx={{ color: 'text.secondary', opacity: 0.7 }}>
                        <DescriptionIcon fontSize="small" />
                      </Box>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                id="email"
                label="Email Address"
                fullWidth
                variant="outlined"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Box sx={{ color: 'text.secondary', opacity: 0.7 }}>
                        @
                      </Box>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                id="phone"
                label="Phone Number"
                fullWidth
                variant="outlined"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Box sx={{ color: 'text.secondary', opacity: 0.7 }}>
                        +
                      </Box>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                id="income"
                label="Monthly Income (ETH)"
                fullWidth
                variant="outlined"
                type="number"
                value={income}
                onChange={(e) => setIncome(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Box sx={{ color: 'text.secondary', opacity: 0.7 }}>
                        <AttachMoneyIcon fontSize="small" />
                      </Box>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth variant="outlined">
                <InputLabel id="employment-status-label">Employment Status</InputLabel>
                <Select
                  labelId="employment-status-label"
                  id="employment-status"
                  value={employment}
                  onChange={(e) => setEmployment(e.target.value)}
                  label="Employment Status"
                  startAdornment={
                    <InputAdornment position="start">
                      <Box sx={{ color: 'text.secondary', opacity: 0.7 }}>
                        <CalendarMonthIcon fontSize="small" />
                      </Box>
                    </InputAdornment>
                  }
                >
                  <MenuItem value="employed">Employed</MenuItem>
                  <MenuItem value="self-employed">Self-Employed</MenuItem>
                  <MenuItem value="unemployed">Unemployed</MenuItem>
                  <MenuItem value="student">Student</MenuItem>
                  <MenuItem value="retired">Retired</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button
              variant="outlined"
              color="primary"
              onClick={handleBack}
            >
              Back
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleNext}
              disabled={!firstName || !lastName || !email || !phone || !income || !employment}
            >
              Continue
            </Button>
          </Box>
        </StyledPaper>
      )}
      
      {activeStep === 2 && (
        <StyledPaper elevation={0}>
          <Typography variant="h5" gutterBottom>
            Review & Submit
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Please review your loan application details before submitting.
          </Typography>
          
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Loan Details
                  </Typography>
                  <SummaryItem>
                    <Typography variant="body2" color="text.secondary">
                      Loan Amount
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {loanAmount} ETH
                    </Typography>
                  </SummaryItem>
                  <SummaryItem>
                    <Typography variant="body2" color="text.secondary">
                      Loan Term
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {loanTerm} months
                    </Typography>
                  </SummaryItem>
                  <SummaryItem>
                    <Typography variant="body2" color="text.secondary">
                      Interest Rate
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {interestRate}%
                    </Typography>
                  </SummaryItem>
                  <SummaryItem>
                    <Typography variant="body2" color="text.secondary">
                      Monthly Payment
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {monthlyPayment.toFixed(4)} ETH
                    </Typography>
                  </SummaryItem>
                  <SummaryItem>
                    <Typography variant="body2" color="text.secondary">
                      Loan Purpose
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {loanPurpose === 'business' && 'Business Expansion'}
                      {loanPurpose === 'education' && 'Education'}
                      {loanPurpose === 'personal' && 'Personal Expenses'}
                      {loanPurpose === 'debt' && 'Debt Consolidation'}
                      {loanPurpose === 'other' && 'Other'}
                    </Typography>
                  </SummaryItem>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Personal Information
                  </Typography>
                  <SummaryItem>
                    <Typography variant="body2" color="text.secondary">
                      Full Name
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {firstName} {lastName}
                    </Typography>
                  </SummaryItem>
                  <SummaryItem>
                    <Typography variant="body2" color="text.secondary">
                      Email Address
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {email}
                    </Typography>
                  </SummaryItem>
                  <SummaryItem>
                    <Typography variant="body2" color="text.secondary">
                      Phone Number
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {phone}
                    </Typography>
                  </SummaryItem>
                  <SummaryItem>
                    <Typography variant="body2" color="text.secondary">
                      Monthly Income
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {income} ETH
                    </Typography>
                  </SummaryItem>
                  <SummaryItem>
                    <Typography variant="body2" color="text.secondary">
                      Employment Status
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {employment === 'employed' && 'Employed'}
                      {employment === 'self-employed' && 'Self-Employed'}
                      {employment === 'unemployed' && 'Unemployed'}
                      {employment === 'student' && 'Student'}
                      {employment === 'retired' && 'Retired'}
                    </Typography>
                  </SummaryItem>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          
          <GradientBox sx={{ mt: 4, p: 3 }}>
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Typography variant="h6" gutterBottom>
                Terms & Conditions
              </Typography>
              <Typography variant="body2" paragraph>
                By submitting this application, you agree to the terms and conditions of the loan agreement. Your data will be securely stored on the blockchain, and the loan will be managed through smart contracts.
              </Typography>
              <Typography variant="body2">
                The interest rate is calculated based on your reputation score, loan amount, and term. You can repay the loan early without any penalties.
              </Typography>
            </Box>
          </GradientBox>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button
              variant="outlined"
              color="primary"
              onClick={handleBack}
            >
              Back
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSubmit}
            >
              Submit Application
            </Button>
          </Box>
        </StyledPaper>
      )}
      
      {activeStep === 3 && (
        <StyledPaper elevation={0} sx={{ textAlign: 'center', py: 6 }}>
          <Box sx={{ 
            width: 80, 
            height: 80, 
            borderRadius: '50%', 
            bgcolor: alpha(theme.palette.success.main, 0.1),
            color: theme.palette.success.main,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px'
          }}>
            <CheckCircleOutlineIcon sx={{ fontSize: 40 }} />
          </Box>
          <Typography variant="h4" gutterBottom>
            Application Submitted!
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Your loan application has been successfully submitted. You will receive updates on your application status through your dashboard and email.
          </Typography>
          <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 4 }}>
            <Button variant="outlined" color="primary" href="/dashboard">
              Go to Dashboard
            </Button>
            <Button variant="contained" color="primary" href="/marketplace">
              Browse Marketplace
            </Button>
          </Stack>
        </StyledPaper>
      )}
    </Container>
  );
}

export default LoanApplication;
