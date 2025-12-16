import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from '../App';

// Mock the contexts
jest.mock('../contexts/BlockchainContext', () => ({
    BlockchainProvider: ({ children }) => <div>{children}</div>,
    useBlockchain: () => ({
        isConnected: false,
        connectWallet: jest.fn(),
        disconnectWallet: jest.fn(),
    }),
}));

jest.mock('../contexts/ApiContext', () => ({
    ApiProvider: ({ children }) => <div>{children}</div>,
    useApi: () => ({
        isAuthenticated: false,
        user: null,
        loading: false,
        login: jest.fn(),
        logout: jest.fn(),
    }),
}));

describe('App Component', () => {
    test('renders without crashing', () => {
        render(<App />);
    });

    test('renders header and footer', () => {
        render(<App />);
        expect(screen.getByText(/LENDSMART/i)).toBeInTheDocument();
    });
});
