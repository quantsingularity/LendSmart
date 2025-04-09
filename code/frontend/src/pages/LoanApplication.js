import React, { useState } from 'react';
import { 
  Typography, 
  Box, 
  Container, 
  TextField, 
  Button, 
  Stepper, 
  Step, 
  StepLabel,
  Paper,
  Grid,
  Slider,
  InputAdornment,
  Alert,
  CircularProgress
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

function LoanApplication() {
  const { isAuthenticated, userProfile, connectWallet } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    income: 50000,
    credit_score: 700,
    loan_amount: 5000,
    employment_years: 5,
    existing_debt: 10000,
    purpose: '',
    duration: 90
  });

  const steps = ['Personal Information', 'Loan Details', 'Review & Submit'];

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'purpose' ? value : Number(value)
    });
  };

  const handleSliderChange = (name) => (e, newValue) => {
    setFormData({
      ...formData,
      [name]: newValue
    });
  };

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      connectWallet();
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Add borrower address to form data
      const submitData = {
        ...formData,
        address: userProfile?.address
      };
      
      // In a real app, this would call your backend API
      const response = await axios.post('/api/apply-loan', submitData);
      setResult(response.data);
      handleNext();
    } catch (error) {
      console.error('Error submitting loan application:', error);
      setError('Failed to submit loan application. Please try again.');
      
      // For demo purposes, create a sample result
      setResult({
        risk_score: 0.25,
        approved: true,
        max_amount: formData.loan_amount,
        interest_rate: 8.5
      });
      handleNext();
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ mt: 4 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography gutterBottom>Annual Income</Typography>
                <TextField
                  fullWidth
                  name="income"
                  type="number"
                  value={formData.income}
                  onChange={handleInputChange}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography gutterBottom>Credit Score</Typography>
                <TextField
                  fullWidth
                  name="credit_score"
                  type="number"
                  value={formData.credit_score}
                  onChange={handleInputChange}
                  inputProps={{ min: 300, max: 850 }}
                />
                <Slider
                  value={formData.credit_score}
                  onChange={handleSliderChange('credit_score')}
                  min={300}
                  max={850}
                  valueLabelDisplay="auto"
                  sx={{ mt: 2 }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography gutterBottom>Years of Employment</Typography>
                <TextField
                  fullWidth
                  name="employment_years"
                  type="number"
                  value={formData.employment_years}
                  onChange={handleInputChange}
                  inputProps={{ min: 0, step: 0.5 }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography gutterBottom>Existing Debt</Typography>
                <TextField
                  fullWidth
                  name="existing_debt"
                  type="number"
                  value={formData.existing_debt}
                  onChange={handleInputChange}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                />
              </Grid>
            </Grid>
          </Box>
        );
      case 1:
        return (
          <Box sx={{ mt: 4 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography gutterBottom>Loan Amount</Typography>
                <TextField
                  fullWidth
                  name="loan_amount"
                  type="number"
                  value={formData.loan_amount}
                  onChange={handleInputChange}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                />
                <Slider
                  value={formData.loan_amount}
                  onChange={handleSliderChange('loan_amount')}
                  min={1000}
                  max={50000}
                  step={500}
                  valueLabelDisplay="auto"
                  sx={{ mt: 2 }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography gutterBottom>Loan Duration (Days)</Typography>
                <TextField
                  fullWidth
                  name="duration"
                  type="number"
                  value={formData.duration}
                  onChange={handleInputChange}
                  inputProps={{ min: 30, max: 365 }}
                />
                <Slider
                  value={formData.duration}
                  onChange={handleSliderChange('duration')}
                  min={30}
                  max={365}
                  step={30}
                  marks={[
                    { value: 30, label: '30d' },
                    { value: 90, label: '90d' },
                    { value: 180, label: '180d' },
                    { value: 365, label: '365d' },
                  ]}
                  valueLabelDisplay="auto"
                  sx={{ mt: 2 }}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography gutterBottom>Loan Purpose</Typography>
                <TextField
                  fullWidth
                  name="purpose"
                  value={formData.purpose}
                  onChange={handleInputChange}
                  placeholder="Briefly describe why you need this loan"
                  multiline
                  rows={3}
                />
              </Grid>
            </Grid>
          </Box>
        );
      case 2:
        return (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>Review Your Application</Typography>
            <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Annual Income:</Typography>
                  <Typography variant="body1">${formData.income.toLocaleString()}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Credit Score:</Typography>
                  <Typography variant="body1">{formData.credit_score}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Years of Employment:</Typography>
                  <Typography variant="body1">{formData.employment_years}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Existing Debt:</Typography>
                  <Typography variant="body1">${formData.existing_debt.toLocaleString()}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Loan Amount:</Typography>
                  <Typography variant="body1">${formData.loan_amount.toLocaleString()}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Loan Duration:</Typography>
                  <Typography variant="body1">{formData.duration} days</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2">Loan Purpose:</Typography>
                  <Typography variant="body1">
                    {formData.purpose || 'Not specified'}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
            
            {!isAuthenticated && (
              <Alert severity="warning" sx={{ mb: 3 }}>
                You need to connect your wallet before submitting your application.
              </Alert>
            )}
            
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}
          </Box>
        );
      default:
        return (
          <Box sx={{ mt: 4 }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                <CircularProgress />
              </Box>
            ) : result ? (
              <Box>
                <Alert 
                  severity={result.approved ? "success" : "error"}
                  sx={{ mb: 3 }}
                >
                  {result.approved 
                    ? "Congratulations! Your loan application has been approved." 
                    : "We're sorry, your loan application was not approved at this time."}
                </Alert>
                
                {result.approved && (
                  <Paper elevation={3} sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>Loan Terms</Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="subtitle2">Approved Amount:</Typography>
                        <Typography variant="body1">${result.max_amount.toLocaleString()}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="subtitle2">Interest Rate:</Typography>
                        <Typography variant="body1">{result.interest_rate}%</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="subtitle2">Duration:</Typography>
                        <Typography variant="body1">{formData.duration} days</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="subtitle2">Risk Score:</Typography>
                        <Typography variant="body1">{(result.risk_score * 100).toFixed(1)}%</Typography>
                      </Grid>
                    </Grid>
                    <Box sx={{ mt: 3, textAlign: 'center' }}>
                      <Button variant="contained" color="primary">
                        Accept Loan Terms
                      </Button>
                    </Box>
                  </Paper>
                )}
              </Box>
            ) : null}
          </Box>
        );
    }
  };

  return (
    <Container>
      <Typography variant="h4" component="h1" gutterBottom>
        Loan Application
      </Typography>
      
      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      
      {renderStepContent(activeStep)}
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
        <Button
          disabled={activeStep === 0 || activeStep === steps.length}
          onClick={handleBack}
        >
          Back
        </Button>
        <Box>
          {activeStep === steps.length - 1 ? (
            <Button
              variant="contained"
              color="primary"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Submit Application'}
            </Button>
          ) : (
            <Button
              variant="contained"
              color="primary"
              onClick={handleNext}
            >
              Next
            </Button>
          )}
        </Box>
      </Box>
    </Container>
  );
}

export default LoanApplication;
