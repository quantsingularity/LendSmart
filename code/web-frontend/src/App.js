import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline';
import { Web3ReactProvider } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';

// Pages
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import LoanApplication from './pages/LoanApplication';
import LoanMarketplace from './pages/LoanMarketplace';
import Profile from './pages/Profile';
import Analytics from './pages/Analytics';
import Notifications from './pages/Notifications';
import MultiCurrency from './pages/MultiCurrency';
import Reputation from './pages/Reputation';

// Components
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Context
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './theme/ThemeContext';

// Get Web3 library
function getLibrary(provider) {
  return new Web3Provider(provider);
}

function App() {
  return (
    <ThemeProvider>
      <CssBaseline />
      <Web3ReactProvider getLibrary={getLibrary}>
        <AuthProvider>
          <Router>
            <Layout>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/apply" element={<LoanApplication />} />
                <Route path="/marketplace" element={<LoanMarketplace />} />
                <Route 
                  path="/dashboard" 
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/profile" 
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/analytics" 
                  element={
                    <ProtectedRoute>
                      <Analytics />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/notifications" 
                  element={
                    <ProtectedRoute>
                      <Notifications />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/multi-currency" 
                  element={
                    <ProtectedRoute>
                      <MultiCurrency />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/reputation" 
                  element={
                    <ProtectedRoute>
                      <Reputation />
                    </ProtectedRoute>
                  } 
                />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          </Router>
        </AuthProvider>
      </Web3ReactProvider>
    </ThemeProvider>
  );
}

export default App;
