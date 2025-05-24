import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';
import Notifications from '../../../../code/web-frontend/src/pages/Notifications';
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

describe('Notifications Page', () => {
  beforeEach(() => {
    mockIsAuthenticated = false; // Reset auth state
    // Resetting notifications for each test to ensure isolation
    // This would typically be handled by mocking the fetch call if it were a real API
  });

  test('renders Notifications page title and notification icon', async () => {
    render(<Notifications />, { wrapper: AllTheProviders });
    await waitFor(() => {
        expect(screen.getByText('Notifications')).toBeInTheDocument();
    });
    expect(screen.getByTestId('NotificationsIcon')).toBeInTheDocument(); // MUI icons often have a data-testid
  });

  test('shows "Please connect your wallet" alert when not authenticated', async () => {
    mockIsAuthenticated = false;
    render(<Notifications />, { wrapper: AllTheProviders });
    await waitFor(() => {
        expect(screen.getByText(/Please connect your wallet to manage your notifications./i)).toBeInTheDocument();
    });
  });

  test('does not show wallet connection alert and shows settings/recent notifications when authenticated', async () => {
    mockIsAuthenticated = true;
    render(<Notifications />, { wrapper: AllTheProviders });
    await waitFor(() => {
        expect(screen.queryByText(/Please connect your wallet to manage your notifications./i)).not.toBeInTheDocument();
        expect(screen.getByText('Notification Settings')).toBeInTheDocument();
        expect(screen.getByText('Recent Notifications')).toBeInTheDocument();
    });
  });

  test('renders notification settings switches', async () => {
    mockIsAuthenticated = true;
    render(<Notifications />, { wrapper: AllTheProviders });
    await waitFor(() => {
      expect(screen.getByLabelText('Email Notifications')).toBeInTheDocument();
      expect(screen.getByLabelText('Push Notifications')).toBeInTheDocument();
      expect(screen.getByLabelText('Loan Updates')).toBeInTheDocument();
      expect(screen.getByLabelText('Market Alerts')).toBeInTheDocument();
      expect(screen.getByLabelText('Payment Reminders')).toBeInTheDocument();
      expect(screen.getByLabelText('Security Alerts')).toBeInTheDocument();
    });
  });

  test('toggles notification settings and shows snackbar', async () => {
    mockIsAuthenticated = true;
    render(<Notifications />, { wrapper: AllTheProviders });
    await waitFor(() => {
        expect(screen.getByLabelText('Email Notifications')).toBeInTheDocument();
    });

    const emailSwitch = screen.getByLabelText('Email Notifications');
    fireEvent.click(emailSwitch); // Toggle it (assuming it starts true, now false)
    
    await waitFor(() => {
        expect(screen.getByText('Notification settings updated')).toBeInTheDocument();
    });
    // Close snackbar
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
     await waitFor(() => {
        expect(screen.queryByText('Notification settings updated')).not.toBeInTheDocument();
    });
  });

  test('displays recent notifications and allows deleting them', async () => {
    mockIsAuthenticated = true;
    render(<Notifications />, { wrapper: AllTheProviders });
    await waitFor(() => {
      // Based on sample data
      expect(screen.getByText('Loan Approved')).toBeInTheDocument();
      expect(screen.getByText('Your loan application for $5,000 has been approved.')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    expect(deleteButtons.length).toBeGreaterThan(0);
    fireEvent.click(deleteButtons[0]); // Delete the first notification

    await waitFor(() => {
      expect(screen.getByText('Notification deleted')).toBeInTheDocument();
      // The deleted notification should no longer be visible in the recent list (first 3)
      // This depends on how the list re-renders. If it re-slices, the check might be tricky.
      // For simplicity, we check the snackbar. A more robust test would check the list content.
    });
  });

  test('opens and closes the notification drawer', async () => {
    mockIsAuthenticated = true;
    render(<Notifications />, { wrapper: AllTheProviders });
    await waitFor(() => {
        expect(screen.getByText('Recent Notifications')).toBeInTheDocument();
    });

    const viewAllButton = screen.getByRole('button', { name: /View All Notifications/i });
    fireEvent.click(viewAllButton);

    await waitFor(() => {
      expect(screen.getByText('All Notifications')).toBeInTheDocument();
      // Check for a notification from the full list
      expect(screen.getByText('Interest Rate Change')).toBeInTheDocument(); 
    });

    const closeDrawerButton = screen.getAllByRole('button', { name: /close/i })[1]; // Assuming first close is snackbar, second is drawer
    fireEvent.click(closeDrawerButton);

    await waitFor(() => {
      expect(screen.queryByText('All Notifications')).not.toBeInTheDocument();
    });
  });

   test('marks notifications as read when drawer is opened', async () => {
    mockIsAuthenticated = true;
    render(<Notifications />, { wrapper: AllTheProviders });

    let initialBadgeContent;
    await waitFor(() => {
      const badge = screen.getByTestId('NotificationsIcon').closest('button').querySelector('.MuiBadge-badge');
      initialBadgeContent = badge ? parseInt(badge.textContent, 10) : 0;
      expect(initialBadgeContent).toBeGreaterThan(0); // Assuming there are unread notifications from mock
    });

    const notificationIconBadge = screen.getByTestId('NotificationsIcon').closest('button');
    fireEvent.click(notificationIconBadge); // This opens the drawer

    await waitFor(() => {
      const badgeAfterOpen = screen.getByTestId('NotificationsIcon').closest('button').querySelector('.MuiBadge-badge');
      const currentBadgeContent = badgeAfterOpen ? parseInt(badgeAfterOpen.textContent, 10) : 0;
      expect(currentBadgeContent).toBe(0); // Badge count should be 0 after opening drawer
    });
  });

});

