import React, { useState } from 'react';
import {
    Typography,
    Box,
    Paper,
    TextField,
    Button,
    Grid,
    Alert,
    Stepper,
    Step,
    StepLabel,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from '@mui/material';

const KycVerificationPage = () => {
    const [activeStep, setActiveStep] = useState(0);
    const [formData, setFormData] = useState({
        fullName: '',
        dateOfBirth: '',
        nationality: '',
        idType: '',
        idNumber: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        country: '',
    });
    const [error, setError] = useState(null);
    const steps = ['Personal Information', 'Identity Verification', 'Address Verification'];

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError(null);
    };

    const handleNext = () => {
        if (
            activeStep === 0 &&
            (!formData.fullName || !formData.dateOfBirth || !formData.nationality)
        ) {
            setError('Please fill all required fields');
            return;
        }
        if (activeStep === 1 && (!formData.idType || !formData.idNumber)) {
            setError('Please provide ID information');
            return;
        }
        setActiveStep((prev) => prev + 1);
        setError(null);
    };

    const handleBack = () => setActiveStep((prev) => prev - 1);

    const handleSubmit = async (e) => {
        e.preventDefault();
        // Submit KYC data to backend
        alert('KYC verification submitted (demo)');
    };

    const renderStepContent = (step) => {
        switch (step) {
            case 0:
                return (
                    <Grid container spacing={2}>
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
                        <Grid item xs={12} sm={6}>
                            <TextField
                                required
                                fullWidth
                                type="date"
                                label="Date of Birth"
                                name="dateOfBirth"
                                value={formData.dateOfBirth}
                                onChange={handleChange}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                required
                                fullWidth
                                label="Nationality"
                                name="nationality"
                                value={formData.nationality}
                                onChange={handleChange}
                            />
                        </Grid>
                    </Grid>
                );
            case 1:
                return (
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth required>
                                <InputLabel>ID Type</InputLabel>
                                <Select
                                    name="idType"
                                    value={formData.idType}
                                    onChange={handleChange}
                                    label="ID Type"
                                >
                                    <MenuItem value="passport">Passport</MenuItem>
                                    <MenuItem value="drivers_license">Driver's License</MenuItem>
                                    <MenuItem value="national_id">National ID</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                required
                                fullWidth
                                label="ID Number"
                                name="idNumber"
                                value={formData.idNumber}
                                onChange={handleChange}
                            />
                        </Grid>
                    </Grid>
                );
            case 2:
                return (
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <TextField
                                required
                                fullWidth
                                label="Address"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                required
                                fullWidth
                                label="City"
                                name="city"
                                value={formData.city}
                                onChange={handleChange}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                required
                                fullWidth
                                label="State/Province"
                                name="state"
                                value={formData.state}
                                onChange={handleChange}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                required
                                fullWidth
                                label="ZIP/Postal Code"
                                name="zipCode"
                                value={formData.zipCode}
                                onChange={handleChange}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
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
            default:
                return null;
        }
    };

    return (
        <Box sx={{ maxWidth: 800, mx: 'auto', mt: 4, mb: 4 }}>
            <Paper sx={{ p: 4 }}>
                <Typography variant="h4" gutterBottom>
                    KYC Verification
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                    Complete verification to access all features
                </Typography>

                <Stepper activeStep={activeStep} sx={{ my: 4 }}>
                    {steps.map((label) => (
                        <Step key={label}>
                            <StepLabel>{label}</StepLabel>
                        </Step>
                    ))}
                </Stepper>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                <form onSubmit={handleSubmit}>
                    {renderStepContent(activeStep)}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                        <Button disabled={activeStep === 0} onClick={handleBack}>
                            Back
                        </Button>
                        {activeStep === steps.length - 1 ? (
                            <Button variant="contained" onClick={handleSubmit}>
                                Submit
                            </Button>
                        ) : (
                            <Button variant="contained" onClick={handleNext}>
                                Next
                            </Button>
                        )}
                    </Box>
                </form>
            </Paper>
        </Box>
    );
};

export default KycVerificationPage;
