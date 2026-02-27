import React, { useState } from "react";
import {
  Typography,
  Box,
  Paper,
  TextField,
  Button,
  Grid,
  Alert,
  CircularProgress,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  InputAdornment,
  Stepper,
  Step,
  StepLabel,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormLabel,
} from "@mui/material";
import { useApi } from "../contexts/ApiContext";
import { useBlockchain } from "../contexts/BlockchainContext";
import { useNavigate } from "react-router-dom";

const LoanApplicationPage = () => {
  const navigate = useNavigate();
  const { applyForLoan, loading: apiLoading, error: apiError } = useApi();
  const { requestLoan, isConnected, connectWallet } = useBlockchain();

  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    // Loan Details
    amount: "",
    purpose: "",
    duration: "12",
    interestRate: "",
    isCollateralized: "false",
    collateralAmount: "",
    collateralToken: "",
    token: "0x0000000000000000000000000000000000000000", // ETH address

    // Personal Information
    fullName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",

    // Financial Information
    monthlyIncome: "",
    employmentStatus: "",
    employerName: "",
    creditScore: "",
  });

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const steps = [
    "Loan Details",
    "Personal Information",
    "Financial Information",
    "Review & Submit",
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    setError(null);
  };

  const validateStep = (step) => {
    switch (step) {
      case 0: // Loan Details
        if (!formData.amount || parseFloat(formData.amount) <= 0) {
          setError("Please enter a valid loan amount");
          return false;
        }
        if (!formData.purpose || formData.purpose.trim().length < 10) {
          setError(
            "Please provide a detailed purpose (at least 10 characters)",
          );
          return false;
        }
        if (!formData.duration || parseInt(formData.duration) <= 0) {
          setError("Please select a valid loan duration");
          return false;
        }
        if (formData.isCollateralized === "true") {
          if (
            !formData.collateralAmount ||
            parseFloat(formData.collateralAmount) <= 0
          ) {
            setError("Please enter a valid collateral amount");
            return false;
          }
          if (!formData.collateralToken) {
            setError("Please specify the collateral token address");
            return false;
          }
        }
        break;
      case 1: // Personal Information
        if (!formData.fullName || formData.fullName.trim().length < 3) {
          setError("Please enter your full name");
          return false;
        }
        if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) {
          setError("Please enter a valid email address");
          return false;
        }
        if (!formData.phone || formData.phone.length < 10) {
          setError("Please enter a valid phone number");
          return false;
        }
        if (
          !formData.address ||
          !formData.city ||
          !formData.state ||
          !formData.zipCode ||
          !formData.country
        ) {
          setError("Please complete all address fields");
          return false;
        }
        break;
      case 2: // Financial Information
        if (
          !formData.monthlyIncome ||
          parseFloat(formData.monthlyIncome) <= 0
        ) {
          setError("Please enter your monthly income");
          return false;
        }
        if (!formData.employmentStatus) {
          setError("Please select your employment status");
          return false;
        }
        if (
          formData.employmentStatus === "employed" &&
          !formData.employerName
        ) {
          setError("Please enter your employer name");
          return false;
        }
        break;
      default:
        break;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
      setError(null);
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      // First, apply through API
      const loanData = {
        amount: parseFloat(formData.amount),
        purpose: formData.purpose,
        duration: parseInt(formData.duration),
        interestRate: formData.interestRate
          ? parseFloat(formData.interestRate)
          : undefined,
        isCollateralized: formData.isCollateralized === "true",
        collateralAmount:
          formData.isCollateralized === "true"
            ? parseFloat(formData.collateralAmount)
            : undefined,
        collateralToken:
          formData.isCollateralized === "true"
            ? formData.collateralToken
            : undefined,
        token: formData.token,

        // Personal information
        personalInfo: {
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          country: formData.country,
        },

        // Financial information
        financialInfo: {
          monthlyIncome: parseFloat(formData.monthlyIncome),
          employmentStatus: formData.employmentStatus,
          employerName: formData.employerName,
          creditScore: formData.creditScore
            ? parseInt(formData.creditScore)
            : undefined,
        },
      };

      const apiResult = await applyForLoan(loanData);

      // If blockchain is connected, also create on-chain request
      if (isConnected) {
        const blockchainData = {
          token: formData.token,
          principal: parseFloat(formData.amount),
          interestRate: apiResult.data?.suggestedInterestRate || 500, // 5% default
          duration: parseInt(formData.duration) * 30 * 24 * 60 * 60, // Convert months to seconds
          purpose: formData.purpose,
          isCollateralized: formData.isCollateralized === "true",
          collateralToken:
            formData.collateralToken ||
            "0x0000000000000000000000000000000000000000",
          collateralAmount:
            formData.isCollateralized === "true"
              ? parseFloat(formData.collateralAmount)
              : 0,
        };

        await requestLoan(blockchainData);
      }

      setSuccess(true);
      setTimeout(() => {
        navigate("/my-loans");
      }, 2000);
    } catch (err) {
      console.error("Error applying for loan:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to submit loan application",
      );
    }
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="Loan Amount"
                name="amount"
                type="number"
                value={formData.amount}
                onChange={handleChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">$</InputAdornment>
                  ),
                }}
                helperText="Enter the amount you wish to borrow"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="Loan Purpose"
                name="purpose"
                multiline
                rows={3}
                value={formData.purpose}
                onChange={handleChange}
                helperText="Describe how you will use the loan (minimum 10 characters)"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Loan Duration</InputLabel>
                <Select
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  label="Loan Duration"
                >
                  <MenuItem value="6">6 months</MenuItem>
                  <MenuItem value="12">12 months</MenuItem>
                  <MenuItem value="24">24 months</MenuItem>
                  <MenuItem value="36">36 months</MenuItem>
                  <MenuItem value="48">48 months</MenuItem>
                  <MenuItem value="60">60 months</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Desired Interest Rate (%)"
                name="interestRate"
                type="number"
                value={formData.interestRate}
                onChange={handleChange}
                helperText="Optional: Suggest an interest rate"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">%</InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl component="fieldset">
                <FormLabel component="legend">Collateralized Loan</FormLabel>
                <RadioGroup
                  name="isCollateralized"
                  value={formData.isCollateralized}
                  onChange={handleChange}
                  row
                >
                  <FormControlLabel
                    value="false"
                    control={<Radio />}
                    label="No Collateral"
                  />
                  <FormControlLabel
                    value="true"
                    control={<Radio />}
                    label="With Collateral"
                  />
                </RadioGroup>
              </FormControl>
            </Grid>
            {formData.isCollateralized === "true" && (
              <>
                <Grid item xs={12} md={6}>
                  <TextField
                    required
                    fullWidth
                    label="Collateral Amount"
                    name="collateralAmount"
                    type="number"
                    value={formData.collateralAmount}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    required
                    fullWidth
                    label="Collateral Token Address"
                    name="collateralToken"
                    value={formData.collateralToken}
                    onChange={handleChange}
                    helperText="ERC20 token address for collateral"
                  />
                </Grid>
              </>
            )}
          </Grid>
        );
      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="Full Name"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                required
                fullWidth
                label="Email Address"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                required
                fullWidth
                label="Phone Number"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="Street Address"
                name="address"
                value={formData.address}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                required
                fullWidth
                label="City"
                name="city"
                value={formData.city}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                required
                fullWidth
                label="State/Province"
                name="state"
                value={formData.state}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                required
                fullWidth
                label="ZIP/Postal Code"
                name="zipCode"
                value={formData.zipCode}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                required
                fullWidth
                label="Country"
                name="country"
                value={formData.country}
                onChange={handleChange}
              />
            </Grid>
          </Grid>
        );
      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                required
                fullWidth
                label="Monthly Income"
                name="monthlyIncome"
                type="number"
                value={formData.monthlyIncome}
                onChange={handleChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">$</InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Employment Status</InputLabel>
                <Select
                  name="employmentStatus"
                  value={formData.employmentStatus}
                  onChange={handleChange}
                  label="Employment Status"
                >
                  <MenuItem value="employed">Employed</MenuItem>
                  <MenuItem value="self-employed">Self-Employed</MenuItem>
                  <MenuItem value="unemployed">Unemployed</MenuItem>
                  <MenuItem value="student">Student</MenuItem>
                  <MenuItem value="retired">Retired</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {(formData.employmentStatus === "employed" ||
              formData.employmentStatus === "self-employed") && (
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  label="Employer/Business Name"
                  name="employerName"
                  value={formData.employerName}
                  onChange={handleChange}
                />
              </Grid>
            )}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Credit Score (if known)"
                name="creditScore"
                type="number"
                value={formData.creditScore}
                onChange={handleChange}
                helperText="Optional: Enter your credit score if you know it"
              />
            </Grid>
          </Grid>
        );
      case 3:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Review Your Application
            </Typography>
            <Grid container spacing={2} sx={{ mt: 2 }}>
              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Loan Details
                </Typography>
                <Typography>
                  Amount: ${parseFloat(formData.amount).toLocaleString()}
                </Typography>
                <Typography>Duration: {formData.duration} months</Typography>
                <Typography>Purpose: {formData.purpose}</Typography>
                {formData.isCollateralized === "true" && (
                  <Typography>
                    Collateral: $
                    {parseFloat(formData.collateralAmount).toLocaleString()}
                  </Typography>
                )}
              </Grid>
              <Grid item xs={12}>
                <Typography
                  variant="subtitle1"
                  fontWeight="bold"
                  sx={{ mt: 2 }}
                >
                  Personal Information
                </Typography>
                <Typography>{formData.fullName}</Typography>
                <Typography>
                  {formData.email} | {formData.phone}
                </Typography>
                <Typography>
                  {formData.address}, {formData.city}, {formData.state}{" "}
                  {formData.zipCode}, {formData.country}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography
                  variant="subtitle1"
                  fontWeight="bold"
                  sx={{ mt: 2 }}
                >
                  Financial Information
                </Typography>
                <Typography>
                  Monthly Income: $
                  {parseFloat(formData.monthlyIncome).toLocaleString()}
                </Typography>
                <Typography>
                  Employment Status: {formData.employmentStatus}
                </Typography>
                {formData.employerName && (
                  <Typography>Employer: {formData.employerName}</Typography>
                )}
              </Grid>
            </Grid>
            {!isConnected && (
              <Alert severity="warning" sx={{ mt: 3 }}>
                For blockchain verification, please connect your wallet.
                <Button
                  onClick={connectWallet}
                  variant="outlined"
                  size="small"
                  sx={{ ml: 2 }}
                >
                  Connect Wallet
                </Button>
              </Alert>
            )}
          </Box>
        );
      default:
        return "Unknown step";
    }
  };

  if (success) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60vh",
        }}
      >
        <Alert severity="success" sx={{ mb: 3 }}>
          Your loan application has been submitted successfully!
        </Alert>
        <Typography>Redirecting to your loans...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 900, mx: "auto", mt: 4, mb: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography component="h1" variant="h4" align="center" gutterBottom>
          Loan Application
        </Typography>
        <Typography
          variant="body2"
          align="center"
          color="text.secondary"
          paragraph
        >
          Complete the form below to apply for a loan
        </Typography>

        <Stepper activeStep={activeStep} sx={{ mt: 4, mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {(error || apiError) && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error || apiError}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          {renderStepContent(activeStep)}

          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 4 }}>
            <Button disabled={activeStep === 0} onClick={handleBack}>
              Back
            </Button>
            <Box>
              {activeStep === steps.length - 1 ? (
                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={apiLoading}
                >
                  {apiLoading ? (
                    <CircularProgress size={24} />
                  ) : (
                    "Submit Application"
                  )}
                </Button>
              ) : (
                <Button variant="contained" onClick={handleNext}>
                  Next
                </Button>
              )}
            </Box>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default LoanApplicationPage;
