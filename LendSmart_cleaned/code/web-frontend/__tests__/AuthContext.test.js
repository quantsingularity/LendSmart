import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../../code/web-frontend/src/context/AuthContext'; // Adjusted import path

// A simple test component to consume the context
const TestConsumerComponent = () => {
  const { isAuthenticated, userProfile, connectWallet, disconnectWallet } = useAuth();

  return (
    <div>
      {isAuthenticated && userProfile ? (
        <div data-testid="user-info">
          User Address: {userProfile.address}
        </div>
      ) : (
        <div data-testid="no-user">No User Authenticated</div>
      )}
      <button onClick={async () => await connectWallet()}>Connect Wallet</button>
      <button onClick={disconnectWallet}>Disconnect Wallet</button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    // Clear localStorage before each test to ensure a clean state
    localStorage.clear();
    // jest.spyOn(console, 'error').mockImplementation(() => {}); // Suppress console.error if needed for specific tests
  });

  afterEach(() => {
    // jest.restoreAllMocks(); // Restore any mocks after each test
  });

  test('provides initial state with no user authenticated (localStorage empty)', () => {
    render(
      <AuthProvider>
        <TestConsumerComponent />
      </AuthProvider>
    );
    expect(screen.getByTestId('no-user')).toBeInTheDocument();
    expect(localStorage.getItem('isAuthenticated')).toBeNull();
    expect(localStorage.getItem('userProfile')).toBeNull();
  });

  test('connectWallet function authenticates user and stores data in localStorage', async () => {
    render(
      <AuthProvider>
        <TestConsumerComponent />
      </AuthProvider>
    );

    await act(async () => {
      fireEvent.click(screen.getByText('Connect Wallet'));
    });

    await waitFor(() => {
        expect(screen.getByTestId('user-info')).toHaveTextContent('User Address: 0x71C7656EC7ab88b098defB751B7401B5f6d8976F');
    });
    expect(localStorage.getItem('isAuthenticated')).toBe('true');
    const storedProfile = JSON.parse(localStorage.getItem('userProfile'));
    expect(storedProfile).toEqual({
      address: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
      shortAddress: '0x71C7...976F',
      balance: '5.43 ETH',
      reputation: 4.8,
    });
  });

  test('disconnectWallet function clears user authentication and localStorage', async () => {
    render(
      <AuthProvider>
        <TestConsumerComponent />
      </AuthProvider>
    );

    // First, connect wallet
    await act(async () => {
      fireEvent.click(screen.getByText('Connect Wallet'));
    });
    await waitFor(() => {
        expect(screen.getByTestId('user-info')).toBeInTheDocument();
    });
    expect(localStorage.getItem('isAuthenticated')).toBe('true');

    // Then, disconnect wallet
    await act(async () => {
      fireEvent.click(screen.getByText('Disconnect Wallet'));
    });
    
    await waitFor(() => {
        expect(screen.getByTestId('no-user')).toBeInTheDocument();
    });
    expect(localStorage.getItem('isAuthenticated')).toBeNull();
    expect(localStorage.getItem('userProfile')).toBeNull();
  });

  test('initializes from localStorage if user was previously authenticated', () => {
    const mockProfile = {
      address: '0xPreviousUser', 
      shortAddress: '0xPrev...User',
      balance: '10 ETH',
      reputation: 5.0
    };
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('userProfile', JSON.stringify(mockProfile));

    render(
      <AuthProvider>
        <TestConsumerComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('user-info')).toHaveTextContent('User Address: 0xPreviousUser');
  });

  test('initializes with default profile if authenticated but no profile in localStorage', () => {
    localStorage.setItem('isAuthenticated', 'true');
    // No userProfile in localStorage

    render(
      <AuthProvider>
        <TestConsumerComponent />
      </AuthProvider>
    );
    // The default profile from AuthContext.js
    expect(screen.getByTestId('user-info')).toHaveTextContent('User Address: 0x71C7656EC7ab88b098defB751B7401B5f6d8976F');
    const storedProfile = JSON.parse(localStorage.getItem('userProfile'));
    expect(storedProfile.address).toBe('0x71C7656EC7ab88b098defB751B7401B5f6d8976F');
  });

});

