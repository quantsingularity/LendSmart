import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';
import MultiCurrency from '../../../../code/web-frontend/src/pages/MultiCurrency';
import { AuthProvider } from '../../../../code/web-frontend/src/context/AuthContext';

// Mock useAuth
let mockIsAuthenticated = false;
jest.mock('../../../../code/web-frontend/src/context/AuthContext', () => ({
  ...jest.requireActual('../../../../code/web-frontend/src/context/AuthContext'),
  useAuth: () => ({
    isAuthenticated: mockIsAuthenticated,
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

describe('MultiCurrency Page', () => {
  beforeEach(() => {
    mockIsAuthenticated = false; // Reset auth state
    // Mock useEffect's async data fetching if any external API was called
    // For this component, it uses sample data directly in useEffect, so no fetch mock needed for that part.
  });

  test('renders MultiCurrency page title', async () => {
    render(<MultiCurrency />, { wrapper: AllTheProviders });
    await waitFor(() => {
        expect(screen.getByText('Multi-Currency Support')).toBeInTheDocument();
    });
  });

  test('shows "Please connect your wallet" alert when not authenticated', async () => {
    mockIsAuthenticated = false;
    render(<MultiCurrency />, { wrapper: AllTheProviders });
    await waitFor(() => {
        expect(screen.getByText(/Please connect your wallet to access all multi-currency features./i)).toBeInTheDocument();
    });
  });

  test('does not show wallet connection alert when authenticated', async () => {
    mockIsAuthenticated = true;
    render(<MultiCurrency />, { wrapper: AllTheProviders });
    await waitFor(() => {
        expect(screen.queryByText(/Please connect your wallet to access all multi-currency features./i)).not.toBeInTheDocument();
    });
  });

  test('renders loading spinner initially then content', async () => {
    render(<MultiCurrency />, { wrapper: AllTheProviders });
    expect(screen.getByRole('progressbar')).toBeInTheDocument(); // MUI CircularProgress
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      expect(screen.getByText('Currency Converter')).toBeInTheDocument(); // First tab label
    });
  });

  test('renders tabs and switches between them', async () => {
    mockIsAuthenticated = true; // Ensure content loads
    render(<MultiCurrency />, { wrapper: AllTheProviders });

    await waitFor(() => {
      expect(screen.getByText('Currency Converter')).toBeInTheDocument();
    });

    // Check initial tab content (Currency Converter)
    expect(screen.getByText(/Convert between different currencies/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Amount')).toBeInTheDocument();

    // Click on Multi-Currency Loans tab
    fireEvent.click(screen.getByRole('tab', { name: /Multi-Currency Loans/i }));
    await waitFor(() => {
      expect(screen.getByText(/Apply for loans in different currencies/i)).toBeInTheDocument();
      expect(screen.getByText('Your Multi-Currency Loans')).toBeInTheDocument();
    });
  });

  test('Currency Converter: allows input and conversion', async () => {
    mockIsAuthenticated = true;
    render(<MultiCurrency />, { wrapper: AllTheProviders });
    await waitFor(() => expect(screen.getByText('Currency Converter')).toBeInTheDocument());

    const amountInput = screen.getByLabelText('Amount');
    const fromSelect = screen.getByLabelText('From');
    const toSelect = screen.getByLabelText('To');
    const convertButton = screen.getByRole('button', { name: 'Convert' });

    fireEvent.change(amountInput, { target: { value: '100' } });
    // MUI Select needs more specific interaction
    // For simplicity, we'll assume default USD to EUR conversion based on initial state
    // To properly test select: fireEvent.mouseDown(fromSelect); const option = await screen.findByRole('option', {name: /USD/i}); fireEvent.click(option);

    fireEvent.click(convertButton);

    await waitFor(() => {
      // Based on sample rates: 100 USD to EUR (0.92)
      expect(screen.getByText(/\$100.00 = €92.00/i)).toBeInTheDocument();
      expect(screen.getByText(/Exchange rate: 1 USD = 0.92 EUR/i)).toBeInTheDocument();
    });
  });

  test('Multi-Currency Loans: displays loan application form and existing loans', async () => {
    mockIsAuthenticated = true;
    render(<MultiCurrency />, { wrapper: AllTheProviders });
    fireEvent.click(screen.getByRole('tab', { name: /Multi-Currency Loans/i }));

    await waitFor(() => {
      expect(screen.getByText('Apply for a Multi-Currency Loan')).toBeInTheDocument();
      expect(screen.getByLabelText('Loan Amount')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Apply' })).toBeInTheDocument();
    });

    // Check for table headers of existing loans
    expect(screen.getByText('Your Multi-Currency Loans')).toBeInTheDocument();
    expect(screen.getByText('ID')).toBeInTheDocument();
    expect(screen.getByText('USD Equivalent')).toBeInTheDocument();
    // Check for a sample loan from the mock data
    expect(screen.getByText('$5,000.00')).toBeInTheDocument(); // Loan 1 amount
    expect(screen.getByText('Approved')).toBeInTheDocument(); // Loan 1 status
  });

  test('renders benefits section', async () => {
    mockIsAuthenticated = true;
    render(<MultiCurrency />, { wrapper: AllTheProviders });
    await waitFor(() => {
      expect(screen.getByText('Benefits of Multi-Currency Support')).toBeInTheDocument();
      expect(screen.getByText('Global Accessibility')).toBeInTheDocument();
      expect(screen.getByText('Diversification')).toBeInTheDocument();
      expect(screen.getByText('Cryptocurrency Integration')).toBeInTheDocument();
    });
  });

});

