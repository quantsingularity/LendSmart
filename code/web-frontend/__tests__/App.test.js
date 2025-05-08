import { render, screen, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../../code/web-frontend/src/App'; // Adjusted import path

// Mock child components to simplify App.js testing and focus on routing
// Ensure the mock paths correctly reflect their location relative to App.js if they were real
// For testing App.js, we are mocking the components App.js itself imports.
jest.mock('../../code/web-frontend/src/pages/Home', () => () => <div data-testid="home-page-mock">Home Page Mock</div>);
jest.mock('../../code/web-frontend/src/pages/Dashboard', () => () => <div data-testid="dashboard-page-mock">Dashboard Page Mock</div>);
jest.mock('../../code/web-frontend/src/pages/LoanApplication', () => () => <div data-testid="loan-application-page-mock">Loan Application Page Mock</div>);
jest.mock('../../code/web-frontend/src/pages/LoanMarketplace', () => () => <div data-testid="loan-marketplace-page-mock">Loan Marketplace Page Mock</div>);
jest.mock('../../code/web-frontend/src/pages/Profile', () => () => <div data-testid="profile-page-mock">Profile Page Mock</div>);
jest.mock('../../code/web-frontend/src/pages/Analytics', () => () => <div data-testid="analytics-page-mock">Analytics Page Mock</div>);
jest.mock('../../code/web-frontend/src/pages/Notifications', () => () => <div data-testid="notifications-page-mock">Notifications Page Mock</div>);
jest.mock('../../code/web-frontend/src/pages/MultiCurrency', () => () => <div data-testid="multi-currency-page-mock">Multi-Currency Page Mock</div>);
jest.mock('../../code/web-frontend/src/pages/Reputation', () => () => <div data-testid="reputation-page-mock">Reputation Page Mock</div>);

// Mock ProtectedRoute to simplify testing routes that use it
// It will just render its children for these tests
jest.mock('../../code/web-frontend/src/components/ProtectedRoute', () => ({ children }) => <>{children}</>);

// Mock AuthProvider to avoid issues with context not being available
// We can enhance this mock later if specific auth states need to be tested for App routing
jest.mock('../../code/web-frontend/src/context/AuthContext', () => ({
  AuthProvider: ({ children }) => <>{children}</>,
  useAuth: () => ({ user: null, login: jest.fn(), logout: jest.fn(), loading: false }), // Default mock for useAuth
}));

describe('App Routing', () => {
  const renderAppWithRouter = (initialEntries) => {
    render(
      <MemoryRouter initialEntries={initialEntries}>
        <App />
      </MemoryRouter>
    );
  };

  test('renders Home page by default (/)', () => {
    renderAppWithRouter(['/']);
    expect(screen.getByTestId('home-page-mock')).toBeInTheDocument();
  });

  test('navigates to Loan Application page (/apply)', () => {
    renderAppWithRouter(['/apply']);
    expect(screen.getByTestId('loan-application-page-mock')).toBeInTheDocument();
  });

  test('navigates to Loan Marketplace page (/marketplace)', () => {
    renderAppWithRouter(['/marketplace']);
    expect(screen.getByTestId('loan-marketplace-page-mock')).toBeInTheDocument();
  });

  // Protected Routes (mocking ProtectedRoute to pass through)
  test('navigates to Dashboard page (/dashboard)', () => {
    renderAppWithRouter(['/dashboard']);
    expect(screen.getByTestId('dashboard-page-mock')).toBeInTheDocument();
  });

  test('navigates to Profile page (/profile)', () => {
    renderAppWithRouter(['/profile']);
    expect(screen.getByTestId('profile-page-mock')).toBeInTheDocument();
  });

  test('navigates to Analytics page (/analytics)', () => {
    renderAppWithRouter(['/analytics']);
    expect(screen.getByTestId('analytics-page-mock')).toBeInTheDocument();
  });

  test('navigates to Notifications page (/notifications)', () => {
    renderAppWithRouter(['/notifications']);
    expect(screen.getByTestId('notifications-page-mock')).toBeInTheDocument();
  });

  test('navigates to Multi-Currency page (/multi-currency)', () => {
    renderAppWithRouter(['/multi-currency']);
    expect(screen.getByTestId('multi-currency-page-mock')).toBeInTheDocument();
  });

  test('navigates to Reputation page (/reputation)', () => {
    renderAppWithRouter(['/reputation']);
    expect(screen.getByTestId('reputation-page-mock')).toBeInTheDocument();
  });

  test('redirects to Home page for unknown routes', () => {
    renderAppWithRouter(['/some/unknown/route']);
    expect(screen.getByTestId('home-page-mock')).toBeInTheDocument();
  });
});

