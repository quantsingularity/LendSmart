import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from '../../pages/Login';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate,
}));

jest.mock('../../contexts/ApiContext', () => ({
    useApi: jest.fn(),
}));

import { useApi } from '../../contexts/ApiContext';

describe('Login Page', () => {
    const mockLogin = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        useApi.mockReturnValue({
            login: mockLogin,
            loading: false,
            error: null,
        });
    });

    test('renders login form', () => {
        render(
            <BrowserRouter>
                <Login />
            </BrowserRouter>,
        );

        expect(screen.getByText(/Sign in/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/^Password/i)).toBeInTheDocument();
    });

    test('handles form submission', async () => {
        mockLogin.mockResolvedValueOnce({ user: {}, token: 'token' });

        render(
            <BrowserRouter>
                <Login />
            </BrowserRouter>,
        );

        const emailInput = screen.getByLabelText(/Email Address/i);
        const passwordInput = screen.getByLabelText(/^Password/i);
        const submitButton = screen.getByRole('button', { name: /Sign In/i });

        fireEvent.change(emailInput, { target: { value: 'test@test.com' } });
        fireEvent.change(passwordInput, { target: { value: 'password123' } });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(mockLogin).toHaveBeenCalledWith('test@test.com', 'password123');
            expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
        });
    });

    test('displays error message on failed login', async () => {
        const errorMessage = 'Invalid credentials';
        mockLogin.mockRejectedValueOnce({
            response: { data: { message: errorMessage } },
        });

        render(
            <BrowserRouter>
                <Login />
            </BrowserRouter>,
        );

        const emailInput = screen.getByLabelText(/Email Address/i);
        const passwordInput = screen.getByLabelText(/^Password/i);
        const submitButton = screen.getByRole('button', { name: /Sign In/i });

        fireEvent.change(emailInput, { target: { value: 'test@test.com' } });
        fireEvent.change(passwordInput, { target: { value: 'wrong' } });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText(errorMessage)).toBeInTheDocument();
        });
    });

    test('renders link to register page', () => {
        render(
            <BrowserRouter>
                <Login />
            </BrowserRouter>,
        );

        const registerLink = screen.getByText(/Don't have an account/i);
        expect(registerLink).toBeInTheDocument();
    });
});
