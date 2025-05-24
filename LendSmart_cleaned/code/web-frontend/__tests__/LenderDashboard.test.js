import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom'; // If any Links are used
import LenderDashboard from '../../code/web-frontend/src/components/LenderDashboard'; // Adjusted import path
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles'; // For MUI components

// Mock fetch API
global.fetch = jest.fn();

// MUI Theme provider wrapper
const theme = createTheme();
const AllTheProviders = ({ children }) => {
  return (
    <MuiThemeProvider theme={theme}>
      <Router>{children}</Router>
    </MuiThemeProvider>
  );
};

describe('LenderDashboard', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  test('renders table headers correctly', () => {
    fetch.mockResolvedValueOnce({ ok: true, json: async () => [] }); // Mock empty response initially
    render(<LenderDashboard />, { wrapper: AllTheProviders });

    expect(screen.getByText('Amount')).toBeInTheDocument();
    expect(screen.getByText('Interest Rate')).toBeInTheDocument();
    expect(screen.getByText('Duration')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  test('fetches and displays loans data in the table', async () => {
    const mockLoans = [
      { amount: '10', interest_rate: '5', duration: '30', status: 'Funded' },
      { amount: '20', interest_rate: '6', duration: '60', status: 'Pending' },
    ];
    fetch.mockResolvedValueOnce({ 
      ok: true, 
      json: async () => mockLoans 
    });

    render(<LenderDashboard />, { wrapper: AllTheProviders });

    // Wait for the data to be fetched and rendered
    await waitFor(() => {
      expect(screen.getByText('10 ETH')).toBeInTheDocument();
    });

    expect(screen.getByText('10 ETH')).toBeInTheDocument();
    expect(screen.getByText('5%')).toBeInTheDocument();
    expect(screen.getByText('30 days')).toBeInTheDocument();
    expect(screen.getByText('Funded')).toBeInTheDocument();

    expect(screen.getByText('20 ETH')).toBeInTheDocument();
    expect(screen.getByText('6%')).toBeInTheDocument();
    expect(screen.getByText('60 days')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith('/api/loans');
  });

  test('displays a message or empty table when no loans are fetched', async () => {
    fetch.mockResolvedValueOnce({ ok: true, json: async () => [] });

    render(<LenderDashboard />, { wrapper: AllTheProviders });

    // Wait for any potential asynchronous updates
    await waitFor(() => {
      // Check that no loan rows are rendered. 
      // The table headers will still be there.
      const rows = screen.queryAllByRole('row');
      // Expect 1 row for the header + 0 rows for data
      expect(rows.length).toBe(1); 
    });
    // Optionally, if the component renders a specific message for no data:
    // expect(screen.getByText(/No loans available/i)).toBeInTheDocument();
  });

  test('handles API error gracefully', async () => {
    fetch.mockRejectedValueOnce(new Error('API Error'));
    // Suppress console.error for this test if the component logs the error
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(<LenderDashboard />, { wrapper: AllTheProviders });

    // Wait for any potential asynchronous updates
    await waitFor(() => {
      // Check that no loan rows are rendered.
      const rows = screen.queryAllByRole('row');
      expect(rows.length).toBe(1); // Only header row
    });
    // Optionally, if the component renders an error message:
    // expect(screen.getByText(/Failed to load loans/i)).toBeInTheDocument();
    
    consoleErrorSpy.mockRestore();
  });
});

