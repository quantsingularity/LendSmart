import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Register from '../../pages/Register';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate,
}));

jest.mock('../../contexts/ApiContext', () => ({
    useApi: jest.fn(),
}));

import { useApi } from '../../contexts/ApiContext';

describe('Register Page', () => {
    const mockRegister = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        useApi.mockReturnValue({
            register: mockRegister,
            loading: false,
            error: null,
        });
    });

    test('renders registration form', () => {
        render(
            <BrowserRouter>
                <Register />
            </BrowserRouter>,
        );

        expect(screen.getByText(/Sign up/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/^Password$/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Confirm Password/i)).toBeInTheDocument();
    });

    test('handles successful registration', async () => {
        mockRegister.mockResolvedValueOnce({ user: {}, token: 'token' });

        render(
            <BrowserRouter>
                <Register />
            </BrowserRouter>,
        );

        fireEvent.change(screen.getByLabelText(/Full Name/i), {
            target: { value: 'Test User' },
        });
        fireEvent.change(screen.getByLabelText(/Email Address/i), {
            target: { value: 'test@test.com' },
        });
        fireEvent.change(screen.getByLabelText(/^Password$/i), {
            target: { value: 'password123' },
        });
        fireEvent.change(screen.getByLabelText(/Confirm Password/i), {
            target: { value: 'password123' },
        });

        fireEvent.click(screen.getByRole('button', { name: /Sign Up/i }));

        await waitFor(() => {
            expect(mockRegister).toHaveBeenCalledWith({
                name: 'Test User',
                email: 'test@test.com',
                password: 'password123',
            });
            expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
        });
    });

    test('displays error when passwords do not match', async () => {
        render(
            <BrowserRouter>
                <Register />
            </BrowserRouter>,
        );

        fireEvent.change(screen.getByLabelText(/Full Name/i), {
            target: { value: 'Test User' },
        });
        fireEvent.change(screen.getByLabelText(/Email Address/i), {
            target: { value: 'test@test.com' },
        });
        fireEvent.change(screen.getByLabelText(/^Password$/i), {
            target: { value: 'password123' },
        });
        fireEvent.change(screen.getByLabelText(/Confirm Password/i), {
            target: { value: 'different' },
        });

        fireEvent.click(screen.getByRole('button', { name: /Sign Up/i }));

        await waitFor(() => {
            expect(screen.getByText(/Passwords do not match/i)).toBeInTheDocument();
            expect(mockRegister).not.toHaveBeenCalled();
        });
    });

    test('displays error message on registration failure', async () => {
        const errorMessage = 'Email already exists';
        mockRegister.mockRejectedValueOnce({
            response: { data: { message: errorMessage } },
        });

        render(
            <BrowserRouter>
                <Register />
            </BrowserRouter>,
        );

        fireEvent.change(screen.getByLabelText(/Full Name/i), {
            target: { value: 'Test User' },
        });
        fireEvent.change(screen.getByLabelText(/Email Address/i), {
            target: { value: 'test@test.com' },
        });
        fireEvent.change(screen.getByLabelText(/^Password$/i), {
            target: { value: 'password123' },
        });
        fireEvent.change(screen.getByLabelText(/Confirm Password/i), {
            target: { value: 'password123' },
        });

        fireEvent.click(screen.getByRole('button', { name: /Sign Up/i }));

        await waitFor(() => {
            expect(screen.getByText(errorMessage)).toBeInTheDocument();
        });
    });

    test('renders link to login page', () => {
        render(
            <BrowserRouter>
                <Register />
            </BrowserRouter>,
        );

        const loginLink = screen.getByText(/Already have an account/i);
        expect(loginLink).toBeInTheDocument();
    });
});
