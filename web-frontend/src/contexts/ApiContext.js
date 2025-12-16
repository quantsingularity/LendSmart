import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

// Create API context
const ApiContext = createContext();

export const useApi = () => useContext(ApiContext);

export const ApiProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // API base URL - should be environment variable in production
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

    // Load user data
    const loadUser = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const res = await axios.get(`${API_URL}/auth/me`);

            setUser(res.data.data);
            setIsAuthenticated(true);
            setLoading(false);
        } catch (err) {
            console.error('Error loading user:', err);
            setError('Failed to load user data');
            setToken(null);
            setIsAuthenticated(false);
            setUser(null);
            localStorage.removeItem('token');
            setLoading(false);
        }
    }, [API_URL]);

    // Configure axios with token
    useEffect(() => {
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            setIsAuthenticated(true);
            loadUser();
        } else {
            delete axios.defaults.headers.common['Authorization'];
            setIsAuthenticated(false);
            setUser(null);
        }
    }, [token, loadUser]);

    // Register user
    const register = async (userData) => {
        try {
            setLoading(true);
            setError(null);

            const res = await axios.post(`${API_URL}/auth/register`, userData);

            setToken(res.data.token);
            localStorage.setItem('token', res.data.token);
            setUser(res.data.user);
            setIsAuthenticated(true);
            setLoading(false);

            return res.data;
        } catch (err) {
            console.error('Error registering user:', err);
            setError(err.response?.data?.message || 'Registration failed');
            setLoading(false);
            throw err;
        }
    };

    // Login user
    const login = async (email, password) => {
        try {
            setLoading(true);
            setError(null);

            const res = await axios.post(`${API_URL}/auth/login`, {
                email,
                password,
            });

            setToken(res.data.token);
            localStorage.setItem('token', res.data.token);
            setUser(res.data.user);
            setIsAuthenticated(true);
            setLoading(false);

            return res.data;
        } catch (err) {
            console.error('Error logging in:', err);
            setError(err.response?.data?.message || 'Login failed');
            setLoading(false);
            throw err;
        }
    };

    // Logout user
    const logout = async () => {
        try {
            await axios.get(`${API_URL}/auth/logout`);
        } catch (err) {
            console.error('Error logging out:', err);
        } finally {
            setToken(null);
            localStorage.removeItem('token');
            setIsAuthenticated(false);
            setUser(null);
            delete axios.defaults.headers.common['Authorization'];
        }
    };

    // Update user profile
    const updateProfile = async (userData) => {
        try {
            setLoading(true);
            setError(null);

            const res = await axios.put(`${API_URL}/auth/updatedetails`, userData);

            setUser(res.data.data);
            setLoading(false);

            return res.data;
        } catch (err) {
            console.error('Error updating profile:', err);
            setError(err.response?.data?.message || 'Profile update failed');
            setLoading(false);
            throw err;
        }
    };

    // Update password
    const updatePassword = async (passwordData) => {
        try {
            setLoading(true);
            setError(null);

            const res = await axios.put(`${API_URL}/auth/updatepassword`, passwordData);

            setToken(res.data.token);
            localStorage.setItem('token', res.data.token);
            setLoading(false);

            return res.data;
        } catch (err) {
            console.error('Error updating password:', err);
            setError(err.response?.data?.message || 'Password update failed');
            setLoading(false);
            throw err;
        }
    };

    // Get all loans
    const getLoans = async (filters = {}) => {
        try {
            setLoading(true);
            setError(null);

            const queryParams = new URLSearchParams(filters).toString();
            const res = await axios.get(`${API_URL}/loans${queryParams ? `?${queryParams}` : ''}`);

            setLoading(false);
            return res.data;
        } catch (err) {
            console.error('Error getting loans:', err);
            setError(err.response?.data?.message || 'Failed to fetch loans');
            setLoading(false);
            throw err;
        }
    };

    // Get user loans
    const getMyLoans = async () => {
        try {
            setLoading(true);
            setError(null);

            const res = await axios.get(`${API_URL}/loans/user/my-loans`);

            setLoading(false);
            return res.data;
        } catch (err) {
            console.error('Error getting user loans:', err);
            setError(err.response?.data?.message || 'Failed to fetch your loans');
            setLoading(false);
            throw err;
        }
    };

    // Get loan details
    const getLoan = async (id) => {
        try {
            setLoading(true);
            setError(null);

            const res = await axios.get(`${API_URL}/loans/${id}`);

            setLoading(false);
            return res.data;
        } catch (err) {
            console.error('Error getting loan details:', err);
            setError(err.response?.data?.message || 'Failed to fetch loan details');
            setLoading(false);
            throw err;
        }
    };

    // Apply for loan
    const applyForLoan = async (loanData) => {
        try {
            setLoading(true);
            setError(null);

            const res = await axios.post(`${API_URL}/loans/apply`, loanData);

            setLoading(false);
            return res.data;
        } catch (err) {
            console.error('Error applying for loan:', err);
            setError(err.response?.data?.message || 'Loan application failed');
            setLoading(false);
            throw err;
        }
    };

    // Fund loan
    const fundLoan = async (id, data) => {
        try {
            setLoading(true);
            setError(null);

            const res = await axios.post(`${API_URL}/loans/${id}/fund`, data);

            setLoading(false);
            return res.data;
        } catch (err) {
            console.error('Error funding loan:', err);
            setError(err.response?.data?.message || 'Failed to fund loan');
            setLoading(false);
            throw err;
        }
    };

    // Disburse loan
    const disburseLoan = async (id, data) => {
        try {
            setLoading(true);
            setError(null);

            const res = await axios.post(`${API_URL}/loans/${id}/disburse`, data);

            setLoading(false);
            return res.data;
        } catch (err) {
            console.error('Error disbursing loan:', err);
            setError(err.response?.data?.message || 'Failed to disburse loan');
            setLoading(false);
            throw err;
        }
    };

    // Repay loan
    const repayLoan = async (id, data) => {
        try {
            setLoading(true);
            setError(null);

            const res = await axios.post(`${API_URL}/loans/${id}/repay`, data);

            setLoading(false);
            return res.data;
        } catch (err) {
            console.error('Error repaying loan:', err);
            setError(err.response?.data?.message || 'Failed to repay loan');
            setLoading(false);
            throw err;
        }
    };

    // Cancel loan
    const cancelLoan = async (id, data) => {
        try {
            setLoading(true);
            setError(null);

            const res = await axios.post(`${API_URL}/loans/${id}/cancel`, data);

            setLoading(false);
            return res.data;
        } catch (err) {
            console.error('Error cancelling loan:', err);
            setError(err.response?.data?.message || 'Failed to cancel loan');
            setLoading(false);
            throw err;
        }
    };

    // Create repayment schedule
    const createRepaymentSchedule = async (id, data) => {
        try {
            setLoading(true);
            setError(null);

            const res = await axios.post(`${API_URL}/loans/${id}/schedule`, data);

            setLoading(false);
            return res.data;
        } catch (err) {
            console.error('Error creating repayment schedule:', err);
            setError(err.response?.data?.message || 'Failed to create repayment schedule');
            setLoading(false);
            throw err;
        }
    };

    // Deposit collateral
    const depositCollateral = async (id, data) => {
        try {
            setLoading(true);
            setError(null);

            const res = await axios.post(`${API_URL}/loans/${id}/collateral`, data);

            setLoading(false);
            return res.data;
        } catch (err) {
            console.error('Error depositing collateral:', err);
            setError(err.response?.data?.message || 'Failed to deposit collateral');
            setLoading(false);
            throw err;
        }
    };

    // Set risk score
    const setRiskScore = async (id, data) => {
        try {
            setLoading(true);
            setError(null);

            const res = await axios.post(`${API_URL}/loans/${id}/risk`, data);

            setLoading(false);
            return res.data;
        } catch (err) {
            console.error('Error setting risk score:', err);
            setError(err.response?.data?.message || 'Failed to set risk score');
            setLoading(false);
            throw err;
        }
    };

    // Mark loan as defaulted
    const markAsDefaulted = async (id, data) => {
        try {
            setLoading(true);
            setError(null);

            const res = await axios.post(`${API_URL}/loans/${id}/default`, data);

            setLoading(false);
            return res.data;
        } catch (err) {
            console.error('Error marking loan as defaulted:', err);
            setError(err.response?.data?.message || 'Failed to mark loan as defaulted');
            setLoading(false);
            throw err;
        }
    };

    // Get reputation score
    const getReputationScore = async (address) => {
        try {
            setLoading(true);
            setError(null);

            const res = await axios.get(`${API_URL}/loans/reputation/${address}`);

            setLoading(false);
            return res.data;
        } catch (err) {
            console.error('Error getting reputation score:', err);
            setError(err.response?.data?.message || 'Failed to get reputation score');
            setLoading(false);
            throw err;
        }
    };

    // Context value
    const value = {
        isAuthenticated,
        user,
        loading,
        error,
        register,
        login,
        logout,
        updateProfile,
        updatePassword,
        getLoans,
        getMyLoans,
        getLoan,
        applyForLoan,
        fundLoan,
        disburseLoan,
        repayLoan,
        cancelLoan,
        createRepaymentSchedule,
        depositCollateral,
        setRiskScore,
        markAsDefaulted,
        getReputationScore,
    };

    return <ApiContext.Provider value={value}>{children}</ApiContext.Provider>;
};

export default ApiContext;
