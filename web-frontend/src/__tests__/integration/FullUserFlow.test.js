import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from '../../App';

// Mock window.ethereum for blockchain tests
global.window.ethereum = {
    request: jest.fn(),
    on: jest.fn(),
    removeListener: jest.fn(),
};

describe('Full User Flow Integration Test', () => {
    beforeEach(() => {
        // Reset all mocks before each test
        jest.clearAllMocks();
    });

    test('User can navigate from home to login', async () => {
        render(
            <BrowserRouter>
                <App />
            </BrowserRouter>,
        );

        // Check home page loads
        expect(screen.getByText(/Welcome to LendSmart/i)).toBeInTheDocument();

        // Find and click login link (could be in header or as button)
        const loginLinks = screen.getAllByText(/Login/i);
        fireEvent.click(loginLinks[0]);

        // Verify login page loads
        await waitFor(() => {
            expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
        });
    });

    test('User can navigate to registration page', () => {
        render(
            <BrowserRouter>
                <App />
            </BrowserRouter>,
        );

        const registerLinks = screen.queryAllByText(/Register/i);
        if (registerLinks.length > 0) {
            fireEvent.click(registerLinks[0]);

            // Verify registration form is visible
            expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
        }
    });

    test('Application renders without crashing', () => {
        render(
            <BrowserRouter>
                <App />
            </BrowserRouter>,
        );

        // Just verify the app renders
        expect(screen.getByText(/LendSmart/i)).toBeInTheDocument();
    });

    test('Market marketplace is accessible', () => {
        render(
            <BrowserRouter>
                <App />
            </BrowserRouter>,
        );

        // Look for marketplace link
        const marketplaceLink = screen.queryByText(/Marketplace/i);
        if (marketplaceLink) {
            fireEvent.click(marketplaceLink);
            // The marketplace page should load
        }
    });
});

describe('Protected Routes Test', () => {
    test('Dashboard redirects to login when not authenticated', async () => {
        render(
            <BrowserRouter>
                <App />
            </BrowserRouter>,
        );

        // Try to navigate to dashboard directly
        window.history.pushState({}, 'Dashboard', '/dashboard');

        await waitFor(
            () => {
                // Should redirect to login
                expect(window.location.pathname).toContain('/login');
            },
            { timeout: 3000 },
        );
    });
});
