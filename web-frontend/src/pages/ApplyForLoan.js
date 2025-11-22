import React, { useState } from 'react';
import {
    Typography,
    Box,
    Paper,
    TextField,
    Button,
    Grid,
    Alert,
    CircularProgress,
    FormControlLabel,
    Checkbox,
    InputAdornment,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../contexts/ApiContext';
import { useBlockchain } from '../contexts/BlockchainContext';

const ApplyForLoan = () => {
    const navigate = useNavigate();
    const { applyForLoan } = useApi();
    const {
        requestLoan,
        isConnected,
        connectWallet,
        isLoading: blockchainLoading,
        error: blockchainError,
    } = useBlockchain();

    const [formData, setFormData] = useState({
        token: '0x0000000000000000000000000000000000000000', // Default to ETH
        principal: '',
        interestRate: '',
        duration: '',
        purpose: '',
        isCollateralized: false,
        collateralToken: '0x0000000000000000000000000000000000000000',
        collateralAmount: '',
        decimals: 18,
        collateralDecimals: 18,
        privateKey: '',
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!isConnected) {
            try {
                await connectWallet();
            } catch (err) {
                setError('Please connect your wallet to apply for a loan');
                return;
            }
        }

        try {
            setLoading(true);
            setError(null);

            // First submit to blockchain
            const blockchainResult = await requestLoan(formData);

            if (!blockchainResult) {
                throw new Error('Failed to submit loan request to blockchain');
            }

            // Then submit to backend with blockchain data
            const backendData = {
                ...formData,
                blockchainId: blockchainResult.loanId,
                transactionHash: blockchainResult.transactionHash,
            };

            await applyForLoan(backendData);

            setSuccess(true);
            setLoading(false);

            // Redirect to loan details page after short delay
            setTimeout(() => {
                navigate(`/loans/${blockchainResult.loanId}`);
            }, 2000);
        } catch (err) {
            console.error('Error applying for loan:', err);
            setError(err.message || 'Failed to apply for loan');
            setLoading(false);
        }
    };

    return (
        <Box>
            <Typography variant="h4" component="h1" gutterBottom>
                Apply for Loan
            </Typography>

            <Paper elevation={3} sx={{ p: 4, mt: 3 }}>
                {success ? (
                    <Alert severity="success" sx={{ mb: 3 }}>
                        Loan application submitted successfully! Redirecting to loan details...
                    </Alert>
                ) : null}

                {error ? (
                    <Alert severity="error" sx={{ mb: 3 }}>
                        {error}
                    </Alert>
                ) : null}

                {blockchainError ? (
                    <Alert severity="error" sx={{ mb: 3 }}>
                        {blockchainError}
                    </Alert>
                ) : null}

                <form onSubmit={handleSubmit}>
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <TextField
                                label="Token Address"
                                name="token"
                                value={formData.token}
                                onChange={handleChange}
                                fullWidth
                                required
                                helperText="Address of the token you want to borrow (use 0x0 for ETH)"
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Principal Amount"
                                name="principal"
                                type="number"
                                value={formData.principal}
                                onChange={handleChange}
                                fullWidth
                                required
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">Tokens</InputAdornment>
                                    ),
                                }}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Token Decimals"
                                name="decimals"
                                type="number"
                                value={formData.decimals}
                                onChange={handleChange}
                                fullWidth
                                required
                                helperText="Usually 18 for ETH and most ERC20 tokens"
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Interest Rate"
                                name="interestRate"
                                type="number"
                                value={formData.interestRate}
                                onChange={handleChange}
                                fullWidth
                                required
                                InputProps={{
                                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                                }}
                                helperText="Annual interest rate (e.g., 5 for 5%)"
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Duration"
                                name="duration"
                                type="number"
                                value={formData.duration}
                                onChange={handleChange}
                                fullWidth
                                required
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">Days</InputAdornment>
                                    ),
                                }}
                                helperText="Loan duration in days"
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                label="Purpose"
                                name="purpose"
                                value={formData.purpose}
                                onChange={handleChange}
                                fullWidth
                                required
                                multiline
                                rows={3}
                                helperText="Describe the purpose of this loan"
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        name="isCollateralized"
                                        checked={formData.isCollateralized}
                                        onChange={handleChange}
                                    />
                                }
                                label="Collateralized Loan"
                            />
                        </Grid>

                        {formData.isCollateralized && (
                            <>
                                <Grid item xs={12}>
                                    <TextField
                                        label="Collateral Token Address"
                                        name="collateralToken"
                                        value={formData.collateralToken}
                                        onChange={handleChange}
                                        fullWidth
                                        required
                                        helperText="Address of the token you want to use as collateral"
                                    />
                                </Grid>

                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        label="Collateral Amount"
                                        name="collateralAmount"
                                        type="number"
                                        value={formData.collateralAmount}
                                        onChange={handleChange}
                                        fullWidth
                                        required
                                        InputProps={{
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    Tokens
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                </Grid>

                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        label="Collateral Token Decimals"
                                        name="collateralDecimals"
                                        type="number"
                                        value={formData.collateralDecimals}
                                        onChange={handleChange}
                                        fullWidth
                                        required
                                        helperText="Usually 18 for ETH and most ERC20 tokens"
                                    />
                                </Grid>
                            </>
                        )}

                        <Grid item xs={12}>
                            <TextField
                                label="Private Key (for blockchain transaction)"
                                name="privateKey"
                                type="password"
                                value={formData.privateKey}
                                onChange={handleChange}
                                fullWidth
                                required
                                helperText="Your private key is only used for this transaction and not stored"
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <Button
                                type="submit"
                                variant="contained"
                                color="primary"
                                fullWidth
                                size="large"
                                disabled={loading || blockchainLoading}
                            >
                                {loading || blockchainLoading ? (
                                    <CircularProgress size={24} color="inherit" />
                                ) : (
                                    'Apply for Loan'
                                )}
                            </Button>
                        </Grid>
                    </Grid>
                </form>
            </Paper>
        </Box>
    );
};

export default ApplyForLoan;
