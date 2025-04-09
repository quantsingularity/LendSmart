import React, { createContext, useContext, useState, useEffect } from 'react';
import { useWeb3React } from '@web3-react/core';
import { InjectedConnector } from '@web3-react/injected-connector';
import { ethers } from 'ethers';

// Create context
const AuthContext = createContext();

// Injected connector (MetaMask)
export const injectedConnector = new InjectedConnector({
  supportedChainIds: [1, 3, 4, 5, 42, 80001],
});

// Provider component
export const AuthProvider = ({ children }) => {
  const { activate, deactivate, account, library, active, chainId } = useWeb3React();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Connect wallet
  const connectWallet = async () => {
    try {
      await activate(injectedConnector);
    } catch (error) {
      console.error('Error connecting wallet:', error);
    }
  };

  // Disconnect wallet
  const disconnectWallet = () => {
    try {
      deactivate();
      setIsAuthenticated(false);
      setUserProfile(null);
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
    }
  };

  // Update user profile when account changes
  useEffect(() => {
    const updateUserProfile = async () => {
      if (account && library) {
        try {
          const balance = await library.getBalance(account);
          const shortAddress = `${account.substring(0, 6)}...${account.substring(account.length - 4)}`;
          
          setUserProfile({
            address: account,
            shortAddress,
            balance,
            chainId,
          });
          
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      } else {
        setUserProfile(null);
        setIsAuthenticated(false);
      }
      
      setLoading(false);
    };

    updateUserProfile();
  }, [account, library, chainId, active]);

  // Auto-connect on startup if previously connected
  useEffect(() => {
    const autoConnect = async () => {
      if (window.ethereum && window.ethereum.isMetaMask) {
        try {
          await activate(injectedConnector);
        } catch (error) {
          console.error('Auto-connect error:', error);
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    autoConnect();
  }, [activate]);

  // Context value
  const value = {
    isAuthenticated,
    userProfile,
    loading,
    connectWallet,
    disconnectWallet,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
