import React, { createContext, useState, useEffect, useMemo, useCallback } from 'react';
import * as Keychain from 'react-native-keychain';
import apiService from '../services/apiService'; // Assuming apiService is set up

export const AuthContext = createContext({
  user: null,
  token: null,
  loading: true,
  error: null,
  login: async (credentials) => {},
  logout: async () => {},
  register: async (userData) => {},
});

const AUTH_KEY = 'userAuthData'; // Key for Keychain storage

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load token from storage on initial app load
  useEffect(() => {
    const loadAuthData = async () => {
      try {
        setLoading(true);
        const credentials = await Keychain.getGenericPassword({ service: AUTH_KEY });
        if (credentials) {
          const storedData = JSON.parse(credentials.password);
          if (storedData.token && storedData.user) {
            // TODO: Optionally verify token validity with backend here
            setToken(storedData.token);
            setUser(storedData.user);
            // Set token for apiService
            apiService.defaults.headers.common['Authorization'] = `Bearer ${storedData.token}`;
          } else {
            await Keychain.resetGenericPassword({ service: AUTH_KEY }); // Clear invalid data
          }
        }
      } catch (err) {
        console.error('Failed to load auth data:', err);
        setError('Failed to load session.');
        await Keychain.resetGenericPassword({ service: AUTH_KEY }); // Clear on error
      } finally {
        setLoading(false);
      }
    };

    loadAuthData();
  }, []);

  const storeAuthData = async (newToken, userData) => {
    try {
      const dataToStore = JSON.stringify({ token: newToken, user: userData });
      await Keychain.setGenericPassword('user', dataToStore, { service: AUTH_KEY });
      // Set token for future apiService requests
      apiService.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    } catch (err) {
      console.error('Failed to store auth data:', err);
      setError('Failed to save session.');
      // Decide if we should logout user here
    }
  };

  const clearAuthData = async () => {
    try {
      await Keychain.resetGenericPassword({ service: AUTH_KEY });
      // Clear token from apiService
      delete apiService.defaults.headers.common['Authorization'];
    } catch (err) {
      console.error('Failed to clear auth data:', err);
      setError('Failed to clear session.');
    }
  };

  const login = useCallback(async (credentials) => {
    setLoading(true);
    setError(null);
    try {
      // Replace with actual API call
      const response = await apiService.post('/auth/login', credentials);
      const { token: newToken, user: userData } = response.data; // Adjust based on actual API response

      if (newToken && userData) {
        setToken(newToken);
        setUser(userData);
        await storeAuthData(newToken, userData);
        return userData;
      } else {
        throw new Error('Invalid login response from server');
      }
    } catch (err) {
      console.error('Login failed:', err);
      const message = err.response?.data?.message || err.message || 'Login failed. Please check your credentials.';
      setError(message);
      await clearAuthData(); // Clear any potentially stale data
      setUser(null);
      setToken(null);
      throw new Error(message); // Re-throw for the UI to handle
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Optional: Call backend logout endpoint
      // await apiService.post('/auth/logout');
    } catch (err) {
      console.warn('Backend logout failed (continuing local logout):', err);
      // Don't block logout if backend call fails
    } finally {
      setUser(null);
      setToken(null);
      await clearAuthData();
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (userData) => {
    setLoading(true);
    setError(null);
    try {
      // Replace with actual API call
      const response = await apiService.post('/auth/register', userData);
      // Assuming registration doesn't auto-login, or handle if it does
      // Maybe return success message or handle verification step
      return response.data; // Adjust based on actual API response
    } catch (err) {
      console.error('Registration failed:', err);
      const message = err.response?.data?.message || err.message || 'Registration failed. Please try again.';
      setError(message);
      throw new Error(message); // Re-throw for the UI to handle
    } finally {
      setLoading(false);
    }
  }, []);

  const authContextValue = useMemo(() => ({
    user,
    token,
    loading,
    error,
    login,
    logout,
    register,
  }), [user, token, loading, error, login, logout, register]);

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};

