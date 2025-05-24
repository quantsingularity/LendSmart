import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';
import Analytics from '../../../code/web-frontend/src/pages/Analytics';
import { AuthProvider } from '../../../code/web-frontend/src/context/AuthContext';

// Mock useAuth
let mockIsAuthenticated = false;
const mockUserProfile = null;
jest.mock('../../../code/web-frontend/src/context/AuthContext', () => ({
  ...jest.requireActual('../../../code/web-frontend/src/context/AuthContext'),
  useAuth: () => ({
    isAuthenticated: mockIsAuthenticated,
    userProfile: mockUserProfile,
  }),
}));

// Mock recharts components to avoid rendering complex charts in tests
jest.mock('recharts', () => ({
  ...jest.requireActual('recharts'),
  ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
  BarChart: ({ children }) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar-element">Bar Element</div>,
  PieChart: ({ children }) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => <div data-testid="pie-element">Pie Element</div>,
  XAxis: () => <div data-testid="x-axis">XAxis</div>,
  YAxis: () => <div data-testid="y-axis">YAxis</div>,
  CartesianGrid: () => <div data-testid="cartesian-grid">CartesianGrid</div>,
  Tooltip: () => <div data-testid="tooltip">Tooltip</div>,
  Legend: () => <div data-testid="legend">Legend</div>,
  Cell: () => <div data-testid="cell-element">Cell</div>,
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

describe('Analytics Page', () => {
  beforeEach(() => {
    mockIsAuthenticated = false; // Reset auth state
    // Mock useEffect's async data fetching
    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      json: jest.fn().mockResolvedValueOnce({ 
        // Mocked data structure based on Analytics.js useEffect
        loanData: [{ month: 'Jan', borrowing: 4000, lending: 2400 }],
        riskData: [{ name: 'Low Risk', value: 60 }],
        marketTrends: [{ month: 'Jan', averageInterestRate: 5.2, loanVolume: 120000 }],
        portfolioPerformance: {
          totalInvested: 25000,
          totalReturns: 28750,
          activeInvestments: 12,
          averageInterestRate: 7.5,
          riskDistribution: [{ name: 'Low Risk', value: 15000 }]
        }
      }),
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('renders Analytics page title', async () => {
    render(<Analytics />, { wrapper: AllTheProviders });
    await waitFor(() => {
        expect(screen.getByText(/Analytics & Insights/i)).toBeInTheDocument();
    });
  });

  test('shows "Please connect your wallet" alert when not authenticated', async () => {
    mockIsAuthenticated = false;
    render(<Analytics />, { wrapper: AllTheProviders });
    await waitFor(() => {
        expect(screen.getByText(/Please connect your wallet to view personalized analytics./i)).toBeInTheDocument();
    });
  });

  test('does not show wallet connection alert when authenticated', async () => {
    mockIsAuthenticated = true;
    render(<Analytics />, { wrapper: AllTheProviders });
    await waitFor(() => {
        expect(screen.queryByText(/Please connect your wallet to view personalized analytics./i)).not.toBeInTheDocument();
    });
  });

  test('renders loading spinner initially then content', async () => {
    render(<Analytics />, { wrapper: AllTheProviders });
    expect(screen.getByRole('progressbar')).toBeInTheDocument(); // MUI CircularProgress
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      expect(screen.getByText('Loan Activity')).toBeInTheDocument(); // First tab label
    });
  });

  test('renders tabs and switches between them', async () => {
    mockIsAuthenticated = true; // Ensure content loads
    render(<Analytics />, { wrapper: AllTheProviders });

    await waitFor(() => {
      expect(screen.getByText('Loan Activity')).toBeInTheDocument();
    });

    // Check initial tab content (Loan Activity)
    expect(screen.getByText(/Monthly borrowing and lending activity/i)).toBeInTheDocument();
    expect(screen.getAllByTestId('bar-chart').length).toBeGreaterThan(0);

    // Click on Risk Assessment tab
    fireEvent.click(screen.getByRole('tab', { name: /Risk Assessment/i }));
    await waitFor(() => {
      expect(screen.getByText(/Distribution of loans by risk category/i)).toBeInTheDocument();
      expect(screen.getAllByTestId('pie-chart').length).toBeGreaterThan(0);
    });

    // Click on Market Trends tab
    fireEvent.click(screen.getByRole('tab', { name: /Market Trends/i }));
    await waitFor(() => {
      expect(screen.getByText(/Average interest rates and loan volumes over time/i)).toBeInTheDocument();
      expect(screen.getAllByTestId('bar-chart').length).toBeGreaterThan(0);
    });

    // Click on Portfolio Performance tab
    fireEvent.click(screen.getByRole('tab', { name: /Portfolio Performance/i }));
    await waitFor(() => {
      expect(screen.getByText(/Total Invested/i)).toBeInTheDocument();
      expect(screen.getByText(/Investment by Risk Category/i)).toBeInTheDocument();
      expect(screen.getAllByTestId('pie-chart').length).toBeGreaterThan(0);
    });
  });

  test('renders recommendation cards', async () => {
    mockIsAuthenticated = true;
    render(<Analytics />, { wrapper: AllTheProviders });
    await waitFor(() => {
      expect(screen.getByText(/Diversify Your Portfolio/i)).toBeInTheDocument();
      expect(screen.getByText(/Increase Low-Risk Investments/i)).toBeInTheDocument();
      expect(screen.getByText(/Optimize Interest Returns/i)).toBeInTheDocument();
    });
  });

});

