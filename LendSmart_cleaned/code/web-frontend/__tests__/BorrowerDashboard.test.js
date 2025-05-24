import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom'; // Needed if there are Links
import BorrowerDashboard from '../../code/web-frontend/src/components/BorrowerDashboard'; // Adjusted import path
import { Web3ReactProvider } from '@web3-react/core'; // Import Web3ReactProvider
import { Web3Provider } from '@ethersproject/providers'; // For getLibrary

// Mock @web3-react/core
const mockUseWeb3React = jest.fn();
jest.mock('@web3-react/core', () => ({
  ...jest.requireActual('@web3-react/core'), // Import and retain default exports
  useWeb3React: () => mockUseWeb3React(), // Mock useWeb3React specifically
}));

// Mock ethers Contract
const mockBorrowerLoansCount = jest.fn();
const mockBorrowerLoans = jest.fn();
jest.mock('ethers', () => ({
  ...jest.requireActual('ethers'),
  Contract: jest.fn().mockImplementation(() => ({
    borrowerLoansCount: mockBorrowerLoansCount,
    borrowerLoans: mockBorrowerLoans,
  })),
}));

// Helper to provide Web3React context
function getLibrary(provider) {
  return new Web3Provider(provider);
}

const AllTheProviders = ({ children }) => {
  // You might need to mock a provider for Web3ReactProvider if it's used internally
  // For this test, we'll assume the mocked useWeb3React provides what's needed directly.
  return (
    <Web3ReactProvider getLibrary={getLibrary}>
      <Router>{children}</Router>
    </Web3ReactProvider>
  );
};

describe('BorrowerDashboard', () => {
  beforeEach(() => {
    // Reset mocks before each test
    mockUseWeb3React.mockReset();
    mockBorrowerLoansCount.mockReset();
    mockBorrowerLoans.mockReset();
  });

  test('renders "Your Loans" heading and message when no account is connected', async () => {
    mockUseWeb3React.mockReturnValue({
      account: null, // No account connected
      library: null,
      active: false,
    });

    render(<BorrowerDashboard />, { wrapper: AllTheProviders });

    expect(screen.getByRole('heading', { name: /your loans/i, level: 2 })).toBeInTheDocument();
    // Depending on implementation, it might show a message or an empty state
    // For now, we just check the heading. Add more specific checks if the component shows a message.
    // Example: expect(screen.getByText(/Please connect your wallet/i)).toBeInTheDocument();
  });

  test('renders loading state or no loans message when account is connected but no loans', async () => {
    mockUseWeb3React.mockReturnValue({
      account: '0xTestAccount',
      library: { getSigner: jest.fn() }, // Mock library with getSigner
      active: true,
    });
    mockBorrowerLoansCount.mockResolvedValue(0); // No loans

    render(<BorrowerDashboard />, { wrapper: AllTheProviders });

    expect(screen.getByRole('heading', { name: /your loans/i, level: 2 })).toBeInTheDocument();
    // Check for a message indicating no loans, or that loans are loading
    // This depends on how the component handles an empty loan array.
    // For example, if it shows "No loans found.":
    // await waitFor(() => expect(screen.getByText(/No loans found/i)).toBeInTheDocument()); 
    // Or if it just shows nothing, the test might just pass by not finding loan items.
  });

  test('fetches and displays borrower loans when account is connected', async () => {
    const mockLoans = [
      { amount: { toString: () => '10' }, status: 0 }, // Pending
      { amount: { toString: () => '5' }, status: 1 },  // Approved
    ];
    mockUseWeb3React.mockReturnValue({
      account: '0xTestAccount',
      library: { getSigner: jest.fn() },
      active: true,
    });
    mockBorrowerLoansCount.mockResolvedValue(mockLoans.length);
    mockLoans.forEach((loan, index) => {
      mockBorrowerLoans.mockResolvedValueOnce(loan); // Mock each loan call
    });

    render(<BorrowerDashboard />, { wrapper: AllTheProviders });

    expect(screen.getByRole('heading', { name: /your loans/i, level: 2 })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/Amount: 10 ETH/i)).toBeInTheDocument();
      expect(screen.getByText(/Status: Pending/i)).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByText(/Amount: 5 ETH/i)).toBeInTheDocument();
      expect(screen.getByText(/Status: Approved/i)).toBeInTheDocument();
    });

    expect(mockBorrowerLoansCount).toHaveBeenCalledWith('0xTestAccount');
    expect(mockBorrowerLoans).toHaveBeenCalledTimes(mockLoans.length);
    expect(mockBorrowerLoans).toHaveBeenCalledWith('0xTestAccount', 0);
    expect(mockBorrowerLoans).toHaveBeenCalledWith('0xTestAccount', 1);
  });

  test('displays different loan statuses correctly', async () => {
    const mockLoans = [
      { amount: { toString: () => '1' }, status: 0 }, // Pending
      { amount: { toString: () => '2' }, status: 1 }, // Approved
      { amount: { toString: () => '3' }, status: 2 }, // Repaid
      { amount: { toString: () => '4' }, status: 3 }, // Defaulted
    ];
    mockUseWeb3React.mockReturnValue({
      account: '0xTestAccount',
      library: { getSigner: jest.fn() },
      active: true,
    });
    mockBorrowerLoansCount.mockResolvedValue(mockLoans.length);
    mockLoans.forEach(loan => mockBorrowerLoans.mockResolvedValueOnce(loan));

    render(<BorrowerDashboard />, { wrapper: AllTheProviders });

    await waitFor(() => {
      expect(screen.getByText(/Status: Pending/i)).toBeInTheDocument();
      expect(screen.getByText(/Status: Approved/i)).toBeInTheDocument();
      expect(screen.getByText(/Status: Repaid/i)).toBeInTheDocument();
      expect(screen.getByText(/Status: Defaulted/i)).toBeInTheDocument();
    });
  });

});

