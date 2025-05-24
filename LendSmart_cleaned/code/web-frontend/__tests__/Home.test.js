import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { BrowserRouter as Router, useNavigate } from 'react-router-dom';
import Home from '../../code/web-frontend/src/pages/Home'; // Adjusted import path
import { AuthProvider, useAuth } from '../../code/web-frontend/src/context/AuthContext'; // Import AuthProvider and useAuth
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles'; // For MUI components

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock useAuth
const mockConnectWallet = jest.fn();
let mockIsAuthenticated = false;

jest.mock('../../code/web-frontend/src/context/AuthContext', () => ({
  ...jest.requireActual('../../code/web-frontend/src/context/AuthContext'), // Keep actual AuthProvider
  useAuth: () => ({
    isAuthenticated: mockIsAuthenticated,
    connectWallet: mockConnectWallet,
    userProfile: mockIsAuthenticated ? { address: '0xTestUser' } : null,
  }),
}));

// MUI Theme provider wrapper
const theme = createTheme();
const AllTheProviders = ({ children }) => {
  return (
    <MuiThemeProvider theme={theme}>
      <AuthProvider> {/* AuthProvider is needed if Home or its children consume it directly or via useAuth */}
        <Router>{children}</Router>
      </AuthProvider>
    </MuiThemeProvider>
  );
};

describe('Home Page', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockConnectWallet.mockClear();
    mockIsAuthenticated = false; // Reset auth state for each test
  });

  test('renders Home page with key sections and texts', () => {
    render(<Home />, { wrapper: AllTheProviders });

    // Hero Section
    expect(screen.getByText(/Smart Lending for a Decentralized World/i)).toBeInTheDocument();
    expect(screen.getByText(/A decentralized peer-to-peer lending platform/i)).toBeInTheDocument();
    
    // Features Section
    expect(screen.getByText(/Why Choose LendSmart/i)).toBeInTheDocument();
    expect(screen.getByText(/Decentralized Lending/i)).toBeInTheDocument();
    expect(screen.getByText(/AI-Powered Risk Assessment/i)).toBeInTheDocument();
    expect(screen.getByText(/Immutable Records/i)).toBeInTheDocument();

    // Benefits Section
    expect(screen.getByText(/Financial Freedom, Reimagined/i)).toBeInTheDocument();
    expect(screen.getByText(/Lower Fees/i)).toBeInTheDocument();
    expect(screen.getByText(/Faster Processing/i)).toBeInTheDocument();

    // How It Works Section
    expect(screen.getByText(/How It Works/i)).toBeInTheDocument();
    expect(screen.getByText(/For Borrowers/i)).toBeInTheDocument();
    expect(screen.getByText(/For Lenders/i)).toBeInTheDocument();
  });

  test('"Connect Wallet" button calls connectWallet when user is not authenticated', () => {
    mockIsAuthenticated = false;
    render(<Home />, { wrapper: AllTheProviders });

    const connectWalletButton = screen.getByRole('button', { name: /Connect Wallet/i });
    expect(connectWalletButton).toBeInTheDocument();
    fireEvent.click(connectWalletButton);
    expect(mockConnectWallet).toHaveBeenCalledTimes(1);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test('"Go to Dashboard" button navigates to /dashboard when user is authenticated', () => {
    mockIsAuthenticated = true;
    render(<Home />, { wrapper: AllTheProviders });

    const goToDashboardButton = screen.getByRole('button', { name: /Go to Dashboard/i });
    expect(goToDashboardButton).toBeInTheDocument();
    fireEvent.click(goToDashboardButton);
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    expect(mockConnectWallet).not.toHaveBeenCalled();
  });

  test('"Browse Marketplace" button navigates to /marketplace', () => {
    render(<Home />, { wrapper: AllTheProviders });
    const browseMarketplaceButton = screen.getByRole('button', { name: /Browse Marketplace/i });
    fireEvent.click(browseMarketplaceButton);
    expect(mockNavigate).toHaveBeenCalledWith('/marketplace');
  });

  test('"Apply for a Loan" button navigates to /apply', () => {
    render(<Home />, { wrapper: AllTheProviders });
    // The button text might be different or there might be multiple, ensure to target the correct one.
    // Assuming it's the one under 
