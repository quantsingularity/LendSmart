# Frontend Documentation

This document provides comprehensive information about the frontend components of the LendSmart platform.

## Table of Contents

- [Overview](#overview)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Core Components](#core-components)
- [State Management](#state-management)
- [Routing](#routing)
- [UI/UX Design](#uiux-design)
- [Authentication Flow](#authentication-flow)
- [API Integration](#api-integration)
- [Blockchain Integration](#blockchain-integration)
- [Responsive Design](#responsive-design)
- [Accessibility](#accessibility)
- [Testing](#testing)
- [Build and Deployment](#build-and-deployment)

## Overview

The LendSmart frontend provides an intuitive and responsive user interface for both borrowers and lenders. It enables users to create loan applications, browse the loan marketplace, manage their portfolios, and track transactions in real-time.

## Technology Stack

- **Framework**: React.js
- **State Management**: React Context API
- **Routing**: React Router
- **UI Components**: Custom components with styled-components
- **API Communication**: Axios
- **Blockchain Integration**: Web3.js
- **Form Handling**: Formik with Yup validation
- **Data Visualization**: Chart.js / D3.js
- **Testing**: Jest and React Testing Library
- **Build Tool**: Webpack

## Project Structure

The frontend follows a feature-based structure:

```
frontend/
├── public/                # Static files
├── src/
│   ├── components/        # Reusable UI components
│   ├── context/           # React Context providers
│   ├── pages/             # Page components
│   ├── services/          # API and service integrations
│   ├── utils/             # Utility functions
│   ├── hooks/             # Custom React hooks
│   ├── assets/            # Images, fonts, etc.
│   ├── theme/             # Theming and styling
│   ├── App.js             # Main application component
│   └── index.js           # Application entry point
└── package.json           # Dependencies and scripts
```

## Core Components

### Layout Components

- `Layout.js`: Main layout wrapper with navigation and footer
- `Sidebar.js`: Navigation sidebar with user-specific menu items
- `Header.js`: Application header with user information and actions
- `Footer.js`: Application footer with links and information

### Feature Components

- `LoanApplication.js`: Multi-step loan application form
- `LoanCard.js`: Displays loan information in the marketplace
- `BorrowerDashboard.js`: Dashboard for borrowers
- `LenderDashboard.js`: Dashboard for lenders
- `TransactionHistory.js`: Displays user transaction history
- `ProfileSettings.js`: User profile management
- `NotificationCenter.js`: User notifications display

### Utility Components

- `Button.js`: Customizable button component
- `Input.js`: Form input component
- `Modal.js`: Modal dialog component
- `Dropdown.js`: Dropdown selection component
- `Card.js`: Content container component
- `Loader.js`: Loading indicator
- `Alert.js`: Notification and alert component

## State Management

LendSmart uses React Context API for state management:

### AuthContext

Manages user authentication state:

```javascript
// AuthContext.js
import React, { createContext, useState, useEffect } from 'react';
import authService from '../services/authService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const userData = await authService.getCurrentUser();
        setUser(userData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (credentials) => {
    setLoading(true);
    try {
      const userData = await authService.login(credentials);
      setUser(userData);
      return userData;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await authService.logout();
      setUser(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
```

### Other Context Providers

- `ThemeContext`: Manages application theming (light/dark mode)
- `NotificationContext`: Manages user notifications
- `WalletContext`: Manages blockchain wallet connection
- `LoanContext`: Manages loan data and operations

## Routing

LendSmart uses React Router for navigation:

```javascript
// App.js
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './theme/ThemeContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import LoanApplication from './pages/LoanApplication';
import LoanMarketplace from './pages/LoanMarketplace';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';
import Analytics from './pages/Analytics';

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/apply" element={
                <ProtectedRoute>
                  <LoanApplication />
                </ProtectedRoute>
              } />
              <Route path="/marketplace" element={
                <ProtectedRoute>
                  <LoanMarketplace />
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />
              <Route path="/notifications" element={
                <ProtectedRoute>
                  <Notifications />
                </ProtectedRoute>
              } />
              <Route path="/analytics" element={
                <ProtectedRoute>
                  <Analytics />
                </ProtectedRoute>
              } />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
```

## UI/UX Design

LendSmart follows a modern, clean design approach:

### Theme System

The application uses a theme system with support for light and dark modes:

```javascript
// theme.js
export const lightTheme = {
  colors: {
    primary: '#3a86ff',
    secondary: '#ff006e',
    success: '#38b000',
    warning: '#ffbe0b',
    error: '#ff5252',
    background: '#f8f9fa',
    surface: '#ffffff',
    textPrimary: '#212529',
    textSecondary: '#6c757d',
  },
  // Other theme properties
};

export const darkTheme = {
  colors: {
    primary: '#3a86ff',
    secondary: '#ff006e',
    success: '#38b000',
    warning: '#ffbe0b',
    error: '#ff5252',
    background: '#121212',
    surface: '#1e1e1e',
    textPrimary: '#e9ecef',
    textSecondary: '#adb5bd',
  },
  // Other theme properties
};
```

### Design Components

The UI is built using a component-based approach with styled-components:

```javascript
// Button.js
import styled from 'styled-components';

const Button = styled.button`
  background: ${props => props.primary ? props.theme.colors.primary : 'transparent'};
  color: ${props => props.primary ? '#ffffff' : props.theme.colors.primary};
  border: 2px solid ${props => props.theme.colors.primary};
  border-radius: 8px;
  padding: 10px 20px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease-in-out;

  &:hover {
    background: ${props => props.primary ? props.theme.colors.primary : 'rgba(58, 134, 255, 0.1)'};
    transform: translateY(-2px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

export default Button;
```

## Authentication Flow

The frontend implements a secure authentication flow:

1. **User Registration**:
   - Multi-step registration form
   - Email verification
   - Identity verification (KYC)

2. **User Login**:
   - Email/password authentication
   - JWT token storage
   - Automatic token refresh

3. **Protected Routes**:
   - Route protection based on authentication status
   - Role-based access control

4. **Wallet Connection**:
   - Integration with MetaMask and other wallets
   - Wallet address verification

## API Integration

The frontend communicates with the backend API using Axios:

```javascript
// apiService.js
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle token refresh for 401 errors
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const response = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
        const { token } = response.data;

        localStorage.setItem('token', token);
        originalRequest.headers.Authorization = `Bearer ${token}`;

        return apiClient(originalRequest);
      } catch (refreshError) {
        // Redirect to login if refresh fails
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
```

## Blockchain Integration

The frontend integrates with blockchain using Web3.js:

```javascript
// web3Service.js
import Web3 from 'web3';
import LoanManagerABI from '../contracts/LoanManager.json';
import BorrowerContractABI from '../contracts/BorrowerContract.json';

class Web3Service {
  constructor() {
    this.web3 = null;
    this.loanManagerContract = null;
    this.networkId = null;
    this.accounts = [];
  }

  async initialize() {
    if (window.ethereum) {
      try {
        // Request account access
        await window.ethereum.request({ method: 'eth_requestAccounts' });

        this.web3 = new Web3(window.ethereum);
        this.networkId = await this.web3.eth.net.getId();
        this.accounts = await this.web3.eth.getAccounts();

        // Initialize contracts
        const loanManagerAddress = LoanManagerABI.networks[this.networkId].address;
        this.loanManagerContract = new this.web3.eth.Contract(
          LoanManagerABI.abi,
          loanManagerAddress
        );

        return {
          web3: this.web3,
          accounts: this.accounts,
          networkId: this.networkId,
        };
      } catch (error) {
        throw new Error('User denied account access');
      }
    } else if (window.web3) {
      // Legacy dapp browsers
      this.web3 = new Web3(window.web3.currentProvider);
      // Similar initialization as above
    } else {
      throw new Error('No Ethereum browser extension detected');
    }
  }

  async createLoan(loanData) {
    if (!this.loanManagerContract) {
      throw new Error('Contract not initialized');
    }

    try {
      const result = await this.loanManagerContract.methods
        .createLoan(
          loanData.amount,
          loanData.term,
          loanData.interestRate
        )
        .send({ from: this.accounts[0] });

      return result;
    } catch (error) {
      throw new Error(`Failed to create loan: ${error.message}`);
    }
  }

  // Other contract interaction methods
}

export default new Web3Service();
```

## Responsive Design

LendSmart is fully responsive, supporting various device sizes:

1. **Breakpoints**:
   - Mobile: < 576px
   - Tablet: 576px - 992px
   - Desktop: > 992px

2. **Mobile-First Approach**:
   - Base styles for mobile devices
   - Media queries for larger screens

3. **Flexible Layouts**:
   - CSS Grid and Flexbox for responsive layouts
   - Percentage-based widths
   - Viewport units (vw, vh)

4. **Touch-Friendly UI**:
   - Larger touch targets for mobile
   - Swipe gestures for certain interactions
   - Mobile-optimized forms

## Accessibility

LendSmart follows WCAG 2.1 guidelines for accessibility:

1. **Semantic HTML**:
   - Proper heading hierarchy
   - ARIA attributes where needed
   - Meaningful alt text for images

2. **Keyboard Navigation**:
   - Focus management
   - Keyboard shortcuts
   - Visible focus indicators

3. **Color Contrast**:
   - WCAG AA compliant contrast ratios
   - Color not used as the only means of conveying information

4. **Screen Reader Support**:
   - Descriptive labels
   - Announcements for dynamic content
   - Skip navigation links

## Testing

The frontend includes comprehensive testing:

1. **Unit Tests**:
   - Testing individual components
   - Testing utility functions
   - Testing hooks and context providers

2. **Integration Tests**:
   - Testing component interactions
   - Testing form submissions
   - Testing authentication flows

3. **End-to-End Tests**:
   - Testing complete user journeys
   - Testing across different browsers

4. **Accessibility Tests**:
   - Automated accessibility checks
   - Manual keyboard navigation testing

## Build and Deployment

The frontend build process:

1. **Development**:
   - Local development server with hot reloading
   - Environment-specific configuration

2. **Build Process**:
   - Code optimization and minification
   - Asset bundling and compression
   - Environment variable substitution

3. **Deployment**:
   - CI/CD pipeline integration
   - Static hosting on CDN
   - Cache control strategies
