import React, { createContext, useState, useContext, useEffect } from 'react';

// Create context
const AuthContext = createContext({
  isAuthenticated: false,
  userProfile: null,
  connectWallet: () => {},
  disconnectWallet: () => {},
});

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  // Check if user was previously authenticated
  useEffect(() => {
    const storedAuth = localStorage.getItem('isAuthenticated');
    if (storedAuth === 'true') {
      setIsAuthenticated(true);
      const storedProfile = localStorage.getItem('userProfile');
      if (storedProfile) {
        setUserProfile(JSON.parse(storedProfile));
      } else {
        // Create a default profile if authenticated but no profile exists
        const defaultProfile = {
          address: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
          shortAddress: '0x71C7...976F',
          balance: '5.43 ETH',
          reputation: 4.8,
        };
        setUserProfile(defaultProfile);
        localStorage.setItem('userProfile', JSON.stringify(defaultProfile));
      }
    }
  }, []);

  // Connect wallet function
  const connectWallet = async () => {
    try {
      // In a real app, this would connect to MetaMask or other wallet
      // For demo purposes, we'll simulate a successful connection
      const mockProfile = {
        address: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
        shortAddress: '0x71C7...976F',
        balance: '5.43 ETH',
        reputation: 4.8,
      };
      
      setUserProfile(mockProfile);
      setIsAuthenticated(true);
      
      // Store in localStorage for persistence
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('userProfile', JSON.stringify(mockProfile));
      
      return true;
    } catch (error) {
      console.error('Error connecting wallet:', error);
      return false;
    }
  };

  // Disconnect wallet function
  const disconnectWallet = () => {
    setIsAuthenticated(false);
    setUserProfile(null);
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userProfile');
  };

  // Context value
  const contextValue = {
    isAuthenticated,
    userProfile,
    connectWallet,
    disconnectWallet,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
