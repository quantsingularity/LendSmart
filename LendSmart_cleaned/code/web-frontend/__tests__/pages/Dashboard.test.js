import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';
import Dashboard from '../../../code/web-frontend/src/pages/Dashboard';
import { AuthProvider } from '../../../code/web-frontend/src/context/AuthContext';

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock useAuth
let mockIsAuthenticated = true; // Assume authenticated for dashboard
let mockUserProfile = {
  shortAddress: '0xTest...User',
  balance: '10.5 ETH',
  reputation: 4.5,
};
jest.mock('../../../code/web-frontend/src/context/AuthContext', () => ({
  ...jest.requireActual('../../../code/web-frontend/src/context/AuthContext'),
  useAuth: () => ({
    isAuthenticated: mockIsAuthenticated,
    userProfile: mockUserProfile,
  }),
}));

const muiTheme = createTheme();
const AllTheProviders = ({ children }) => {
  return (
    <MuiThemeProvider theme={muiTheme}>
      <AuthProvider>
        <MemoryRouter>{children}</MemoryRouter>
      </AuthProvider>
    </MuiThemeProvider>
  );
};

describe('Dashboard Page', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockIsAuthenticated = true;
    mockUserProfile = {
      shortAddress: '0xTest...User',
      balance: '10.5 ETH',
      reputation: 4.5,
    };
  });

  test('renders Dashboard page title and welcome message', async () => {
    render(<Dashboard />, { wrapper: AllTheProviders });
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText(/Welcome back, 0xTest...User/i)).toBeInTheDocument();
  });

  test('renders stats cards with correct information', async () => {
    render(<Dashboard />, { wrapper: AllTheProviders });
    expect(screen.getByText('Total Balance')).toBeInTheDocument();
    expect(screen.getByText('10.5 ETH')).toBeInTheDocument(); // From mockUserProfile
    expect(screen.getByText('Active Loans')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // Mock data in component
    expect(screen.getByText('Total Borrowed')).toBeInTheDocument();
    expect(screen.getByText('2.5 ETH')).toBeInTheDocument(); // Mock data
    expect(screen.getByText('Total Lent')).toBeInTheDocument();
    expect(screen.getByText('1.2 ETH')).toBeInTheDocument(); // Mock data
  });

  test('renders reputation score section correctly', async () => {
    render(<Dashboard />, { wrapper: AllTheProviders });
    expect(screen.getByText('Your Reputation Score')).toBeInTheDocument();
    expect(screen.getByText('4.5/5.0')).toBeInTheDocument(); // From mockUserProfile
    expect(screen.getByText(/Your excellent reputation score/i)).toBeInTheDocument();
    const viewDetailsButton = screen.getByRole('button', { name: /View Details/i });
    fireEvent.click(viewDetailsButton);
    expect(mockNavigate).toHaveBeenCalledWith('/reputation');
  });

  test('renders tabs and switches between them, displaying correct content', async () => {
    render(<Dashboard />, { wrapper: AllTheProviders });

    // Initial tab (Active Loans)
    expect(screen.getByText('Active Loans')).toBeInTheDocument();
    expect(screen.getByText(/Loan #L-2023-001/i)).toBeInTheDocument();
    expect(screen.getByText(/Loan #L-2023-003/i)).toBeInTheDocument();

    // Switch to Recent Transactions tab
    const recentTransactionsTab = screen.getByRole('tab', { name: /Recent Transactions/i });
    fireEvent.click(recentTransactionsTab);
    await waitFor(() => {
      expect(screen.getByText(/Payment Received/i)).toBeInTheDocument();
      expect(screen.getByText(/Loan Disbursement/i)).toBeInTheDocument();
    });

    // Switch to Opportunities tab
    const opportunitiesTab = screen.getByRole('tab', { name: /Opportunities/i });
    fireEvent.click(opportunitiesTab);
    await waitFor(() => {
      expect(screen.getByText(/Personalized Opportunities/i)).toBeInTheDocument();
      const exploreButton = screen.getByRole('button', { name: /Explore Marketplace/i });
      fireEvent.click(exploreButton);
      expect(mockNavigate).toHaveBeenCalledWith('/marketplace');
    });
  });

  test('active loans section displays loan details and progress', async () => {
    render(<Dashboard />, { wrapper: AllTheProviders });
    // Ensure Active Loans tab is selected (default)
    expect(screen.getByText('Loan #L-2023-001')).toBeInTheDocument();
    expect(screen.getByText('2.5 ETH')).toBeInTheDocument();
    expect(screen.getByText('65%')).toBeInTheDocument(); // Progress for L-2023-001
    // Check for a view details button (assuming one exists per loan card)
    const loanDetailsButtons = screen.getAllByRole('button', { name: /View Details/i });
    expect(loanDetailsButtons.length).toBeGreaterThanOrEqual(2); // One for reputation, at least two for loans
  });

  test('recent transactions section displays transaction details', async () => {
    render(<Dashboard />, { wrapper: AllTheProviders });
    fireEvent.click(screen.getByRole('tab', { name: /Recent Transactions/i }));
    await waitFor(() => {
      expect(screen.getByText('Payment Received')).toBeInTheDocument();
      expect(screen.getByText('0.25 ETH')).toBeInTheDocument();
      expect(screen.getByText('Completed')).toBeInTheDocument();
    });
  });

});

