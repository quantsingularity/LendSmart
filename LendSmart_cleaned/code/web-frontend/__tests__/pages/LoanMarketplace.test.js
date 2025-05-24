import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';
import LoanMarketplace from '../../../../code/web-frontend/src/pages/LoanMarketplace';
import { AuthProvider } from '../../../../code/web-frontend/src/context/AuthContext'; // Assuming it might be needed for future context-aware actions

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock useAuth (if marketplace uses it for any conditional rendering based on auth state)
// For now, assuming it's not strictly necessary for basic rendering and filtering tests.
jest.mock('../../../../code/web-frontend/src/context/AuthContext', () => ({
  ...jest.requireActual('../../../../code/web-frontend/src/context/AuthContext'),
  useAuth: () => ({
    isAuthenticated: true, // Default to authenticated for marketplace access
    userProfile: { shortAddress: '0xMockUser' },
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

describe('LoanMarketplace Page', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  test('renders LoanMarketplace page title and search bar', async () => {
    render(<LoanMarketplace />, { wrapper: AllTheProviders });
    expect(screen.getByText('Loan Marketplace')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Search loans by keyword/i)).toBeInTheDocument();
  });

  test('renders filter buttons and view mode toggles', async () => {
    render(<LoanMarketplace />, { wrapper: AllTheProviders });
    expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Business' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Education' })).toBeInTheDocument();
    // Check for view mode toggle buttons (GridViewIcon and ViewListIcon are usually inside IconButton)
    expect(screen.getByTestId('GridViewIcon')).toBeInTheDocument(); // MUI icons often have a data-testid
    expect(screen.getByTestId('ViewListIcon')).toBeInTheDocument();
  });

  test('renders tabs for different loan categories', async () => {
    render(<LoanMarketplace />, { wrapper: AllTheProviders });
    expect(screen.getByRole('tab', { name: 'Open Loans' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Funded Loans' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'My Investments' })).toBeInTheDocument();
  });

  test('displays loan listings in grid view by default', async () => {
    render(<LoanMarketplace />, { wrapper: AllTheProviders });
    // Check for elements specific to grid view items, e.g., multiple loan cards
    // The mock data has 6 loans, all should be visible initially with 'all' filter
    await waitFor(() => {
        const loanCards = screen.getAllByText(/ETH/i); // A bit generic, but ETH is in amount
        expect(loanCards.length).toBeGreaterThanOrEqual(6); // Each loan has an amount
    });
    // Check for a specific loan purpose from mock data
    expect(screen.getByText('Business Expansion')).toBeInTheDocument();
  });

  test('filters loans when filter buttons are clicked', async () => {
    render(<LoanMarketplace />, { wrapper: AllTheProviders });

    // Click 'Business' filter
    fireEvent.click(screen.getByRole('button', { name: 'Business' }));
    await waitFor(() => {
      expect(screen.getByText('Business Expansion')).toBeInTheDocument();
      expect(screen.getByText('Startup Funding')).toBeInTheDocument();
      expect(screen.queryByText('Education Expenses')).not.toBeInTheDocument();
      expect(screen.queryByText('Medical Expenses')).not.toBeInTheDocument();
    });

    // Click 'Education' filter (should deselect Business if not multi-select, or add if multi-select)
    // Based on toggleFilter logic, it's multi-select unless 'all' is chosen
    fireEvent.click(screen.getByRole('button', { name: 'Education' }));
     await waitFor(() => {
      expect(screen.getByText('Business Expansion')).toBeInTheDocument();
      expect(screen.getByText('Startup Funding')).toBeInTheDocument();
      expect(screen.getByText('Education Expenses')).toBeInTheDocument();
    });

    // Click 'All' filter
    fireEvent.click(screen.getByRole('button', { name: 'All' }));
    await waitFor(() => {
      expect(screen.getByText('Business Expansion')).toBeInTheDocument();
      expect(screen.getByText('Education Expenses')).toBeInTheDocument();
      expect(screen.getByText('Medical Expenses')).toBeInTheDocument(); // All loans should be back
    });
  });

  test('switches between grid and list view modes', async () => {
    render(<LoanMarketplace />, { wrapper: AllTheProviders });
    const gridViewButton = screen.getByTestId('GridViewIcon').closest('button');
    const listViewButton = screen.getByTestId('ViewListIcon').closest('button');

    // Default is grid, check for a grid-specific layout characteristic if possible
    // For now, just test the toggle
    expect(gridViewButton).toHaveStyle('color: rgb(25, 118, 210)'); // Primary color, indicating active

    fireEvent.click(listViewButton);
    await waitFor(() => {
        expect(listViewButton).toHaveStyle('color: rgb(25, 118, 210)');
        expect(gridViewButton).not.toHaveStyle('color: rgb(25, 118, 210)');
    });
    // Add checks for list view specific elements if they differ significantly
    // For example, if list view uses different text or layout for items.
    // At least one loan should still be visible
    expect(screen.getByText('Business Expansion')).toBeInTheDocument(); 

    fireEvent.click(gridViewButton);
    await waitFor(() => {
        expect(gridViewButton).toHaveStyle('color: rgb(25, 118, 210)');
    });
  });

  test('"Fund Loan" button is present on loan cards', async () => {
    render(<LoanMarketplace />, { wrapper: AllTheProviders });
    // Wait for cards to render
    await screen.findByText('Business Expansion');
    const fundButtons = screen.getAllByRole('button', { name: 'Fund Loan' });
    expect(fundButtons.length).toBeGreaterThan(0);
    // Potentially click one and check navigation or modal, if applicable
    // fireEvent.click(fundButtons[0]);
    // expect(mockNavigate).toHaveBeenCalledWith(expect.stringContaining('/loan/')); // Or similar
  });

});

