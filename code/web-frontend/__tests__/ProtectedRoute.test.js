import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../../code/web-frontend/src/components/ProtectedRoute'; // Adjusted import path
import { AuthProvider, useAuth } from '../../code/web-frontend/src/context/AuthContext'; // Import actual AuthProvider for context

// Mock the useAuth hook from AuthContext
let mockIsAuthenticated = false;

jest.mock('../../code/web-frontend/src/context/AuthContext', () => ({
  ...jest.requireActual('../../code/web-frontend/src/context/AuthContext'), // Keep actual AuthProvider
  useAuth: () => ({
    isAuthenticated: mockIsAuthenticated,
    // Add other properties if ProtectedRoute or its children use them, though current ProtectedRoute only uses isAuthenticated
  }),
}));

// Mock a simple child component to render when protected route allows access
const MockProtectedComponent = () => <div data-testid="protected-content">Protected Content</div>;
// Mock a simple public component (e.g., home page) for redirection
const MockHomePage = () => <div data-testid="home-page">Home Page</div>;

// Wrapper to provide AuthContext and Router
const AllTheProviders = ({ children, initialEntries = ['/protected'] }) => {
  return (
    <AuthProvider> {/* AuthProvider is needed so useAuth can consume the context */}
      <MemoryRouter initialEntries={initialEntries}>
        {children}
      </MemoryRouter>
    </AuthProvider>
  );
};

describe('ProtectedRoute', () => {
  beforeEach(() => {
    // Reset mock for each test
    mockIsAuthenticated = false;
  });

  test('renders child component when user is authenticated', () => {
    mockIsAuthenticated = true; // Simulate authenticated user

    render(
      <Routes>
        <Route path="/" element={<MockHomePage />} />
        <Route 
          path="/protected" 
          element={
            <ProtectedRoute>
              <MockProtectedComponent />
            </ProtectedRoute>
          }
        />
      </Routes>,
      { wrapper: ({ children }) => <AllTheProviders initialEntries={['/protected']}>{children}</AllTheProviders> }
    );

    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    expect(screen.queryByTestId('home-page')).not.toBeInTheDocument();
  });

  test('redirects to home page (/) when user is not authenticated', () => {
    mockIsAuthenticated = false; // Simulate unauthenticated user

    render(
      <Routes>
        <Route path="/" element={<MockHomePage />} />
        <Route 
          path="/protected" 
          element={
            <ProtectedRoute>
              <MockProtectedComponent />
            </ProtectedRoute>
          }
        />
      </Routes>,
      { wrapper: ({ children }) => <AllTheProviders initialEntries={['/protected']}>{children}</AllTheProviders> }
    );

    // Check if the home page content is rendered (due to Navigate component in ProtectedRoute)
    expect(screen.getByTestId('home-page')).toBeInTheDocument();
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  // The ProtectedRoute component itself doesn't have a loading state based on useAuth().loading.
  // It only checks isAuthenticated. So, a test for loading state within ProtectedRoute is not applicable here.
  // If AuthProvider itself had a global loading state that prevented rendering children, that would be different.
});

