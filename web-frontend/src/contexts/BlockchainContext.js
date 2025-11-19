import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { ethers } from 'ethers';
import LendSmartLoanABI from '../utils/LendSmartLoanABI.json';

// Create blockchain context
const BlockchainContext = createContext();

export const useBlockchain = () => useContext(BlockchainContext);

export const BlockchainProvider = ({ children }) => {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [lendSmartLoanContract, setLendSmartLoanContract] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Contract addresses - should be environment variables in production
  const LEND_SMART_LOAN_ADDRESS = process.env.REACT_APP_LEND_SMART_LOAN_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3';

  // Handle account changes
  const handleAccountsC []);

  // Initialize provider
  useEffect(() => {
    const initProvider = async () => {
      try {
        // Check if window.ethereum is available
        if (window.ethereum) {
          const web3Provider = new ethers.BrowserProvider(window.ethereum);
          setProvider(web3Provider);
          
          // Get network information
          const network = await web3Provider.getNetwork();
          setChainId(network.chainId);
          
          // Initialize contract
          const contract = new ethers.Contract(
            LEND_SMART_LOAN_ADDRESS,
            LendSmartLoanABI.abi,
            web3Provider
          );
          setLendSmartLoanContract(contract);
          
          // Listen for account changes
          window.ethereum.on('accountsChanged', handleAccountsChanged);
          
          // Listen for chain changes
          window.ethereum.on('chainChanged', handleChainChanged);
          
          return () => {
            window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
            window.ethereum.removeListener('chainChanged', handleChainChanged);
          };
        } else {
          setError('Please install MetaMask or another Ethereum wallet');
        }
      } catch (err) {
        console.error('Error initializing provider:', err);
        setError('Failed to initialize blockchain connection');
      }
    };
    
    initProvider();
  }, [LEND_SMART_LOAN_ADDRESS, handleAccountsChanged, handleChainChanged]);

  // Connect wallet
  const connectWallet = useCallback(async () => {
    if (!provider) {
      setError('Provider not initialized');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const account = accounts[0];
      setAccount(account);
      
      // Get signer
      const signer = await provider.getSigner();
      setSigner(signer);
      
      // Connect contract with signer
      const contractWithSigner = lendSmartLoanContract.connect(signer);
      setLendSmartLoanContract(contractWithSigner);
      
      setIsConnected(true);
      setIsLoading(false);
    } catch (err) {
      console.error('Error connecting wallet:', err);
      setError('Failed to connect wallet');
      setIsLoading(false);
    }
  }, [provider, lendSmartLoanContract]);

  // Disconnect wallet
  const disconnectWallet = () => {
    setAccount(null);
    setSigner(null);
    setIsConnected(false);
  };

  // Request a loan
  const requestLoan = async (loanData) => {
    if (!isConnected) {
      setError('Please connect your wallet first');
      return null;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      const tx = await lendSmartLoanContract.requestLoan(
        loanData.token,
        ethers.parseUnits(loanData.principal.toString(), loanData.decimals || 18),
        loanData.interestRate,
        loanData.duration,
        loanData.purpose,
        loanData.isCollateralized || false,
        loanData.collateralToken || ethers.ZeroAddress,
        loanData.collateralAmount ? ethers.parseUnits(loanData.collateralAmount.toString(), loanData.collateralDecimals || 18) : 0
      );
      
      const receipt = await tx.wait();
      
      // Find the LoanRequested event to get the loan ID
      const event = receipt.logs
        .filter(log => log.fragment && log.fragment.name === 'LoanRequested')
        .map(log => {
          return {
            loanId: log.args.loanId.toString(),
            borrower: log.args.borrower,
            token: log.args.token,
            principal: log.args.principal.toString(),
            interestRate: log.args.interestRate.toString(),
            duration: log.args.duration.toString(),
            purpose: log.args.purpose,
            isCollateralized: log.args.isCollateralized
          };
        })[0];
      
      setIsLoading(false);
      return {
        transactionHash: receipt.hash,
        loanId: event.loanId,
        event
      };
    } catch (err) {
      console.error('Error requesting loan:', err);
      setError('Failed to request loan');
      setIsLoading(false);
      return null;
    }
  };

  // Get user loans
  const getUserLoans = async (userAddress) => {
    if (!lendSmartLoanContract) {
      setError('Contract not initialized');
      return [];
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      const address = userAddress || account;
      if (!address) {
        setError('No address provided');
        setIsLoading(false);
        return [];
      }
      
      const loanIds = await lendSmartLoanContract.getUserLoans(address);
      
      setIsLoading(false);
      return loanIds.map(id => id.toString());
    } catch (err) {
      console.error('Error getting user loans:', err);
      setError('Failed to get user loans');
      setIsLoading(false);
      return [];
    }
  };

  // Get loan details
  const getLoanDetails = async (loanId) => {
    if (!lendSmartLoanContract) {
      setError('Contract not initialized');
      return null;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      const [loan, schedule, amounts] = await lendSmartLoanContract.getLoanDetails(loanId);
      
      // Convert BigInt values to strings for JSON compatibility
      const formattedLoan = {
        id: loan.id.toString(),
        borrower: loan.borrower,
        lender: loan.lender,
        token: loan.token,
        principal: loan.principal.toString(),
        interestRate: loan.interestRate.toString(),
        duration: loan.duration.toString(),
        requestedTime: loan.requestedTime.toString(),
        fundedTime: loan.fundedTime.toString(),
        disbursedTime: loan.disbursedTime.toString(),
        repaymentAmount: loan.repaymentAmount.toString(),
        amountRepaid: loan.amountRepaid.toString(),
        riskScore: loan.riskScore.toString(),
        status: getLoanStatusString(loan.status),
        purpose: loan.purpose,
        isCollateralized: loan.isCollateralized,
        collateralAmount: loan.collateralAmount.toString(),
        collateralToken: loan.collateralToken
      };
      
      // Format schedule and amounts
      const formattedSchedule = schedule.map(time => time.toString());
      const formattedAmounts = amounts.map(amount => amount.toString());
      
      setIsLoading(false);
      return {
        loan: formattedLoan,
        repaymentSchedule: formattedSchedule,
        repaymentAmounts: formattedAmounts
      };
    } catch (err) {
      console.error('Error getting loan details:', err);
      setError(`Failed to get details for loan ID ${loanId}`);
      setIsLoading(false);
      return null;
    }
  };

  // Fund a loan
  const fundLoan = async (loanId) => {
    if (!isConnected) {
      setError('Please connect your wallet first');
      return null;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      const tx = await lendSmartLoanContract.fundLoan(loanId);
      const receipt = await tx.wait();
      
      setIsLoading(false);
      return {
        transactionHash: receipt.hash,
        status: receipt.status === 1 ? 'success' : 'failed'
      };
    } catch (err) {
      console.error('Error funding loan:', err);
      setError(`Failed to fund loan ID ${loanId}`);
      setIsLoading(false);
      return null;
    }
  };

  // Disburse a loan
  const disburseLoan = async (loanId) => {
    if (!isConnected) {
      setError('Please connect your wallet first');
      return null;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      const tx = await lendSmartLoanContract.disburseLoan(loanId);
      const receipt = await tx.wait();
      
      setIsLoading(false);
      return {
        transactionHash: receipt.hash,
        status: receipt.status === 1 ? 'success' : 'failed'
      };
    } catch (err) {
      console.error('Error disbursing loan:', err);
      setError(`Failed to disburse loan ID ${loanId}`);
      setIsLoading(false);
      return null;
    }
  };

  // Repay a loan
  const repayLoan = async (loanId, amount, decimals = 18) => {
    if (!isConnected) {
      setError('Please connect your wallet first');
      return null;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      const tx = await lendSmartLoanContract.repayLoan(
        loanId,
        ethers.parseUnits(amount, decimals)
      );
      const receipt = await tx.wait();
      
      setIsLoading(false);
      return {
        transactionHash: receipt.hash,
        status: receipt.status === 1 ? 'success' : 'failed'
      };
    } catch (err) {
      console.error('Error repaying loan:', err);
      setError(`Failed to repay loan ID ${loanId}`);
      setIsLoading(false);
      return null;
    }
  };

  // Deposit collateral
  const depositCollateral = async (loanId) => {
    if (!isConnected) {
      setError('Please connect your wallet first');
      return null;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      const tx = await lendSmartLoanContract.depositCollateral(loanId);
      const receipt = await tx.wait();
      
      setIsLoading(false);
      return {
        transactionHash: receipt.hash,
        status: receipt.status === 1 ? 'success' : 'failed'
      };
    } catch (err) {
      console.error('Error depositing collateral:', err);
      setError(`Failed to deposit collateral for loan ID ${loanId}`);
      setIsLoading(false);
      return null;
    }
  };

  // Create repayment schedule
  const createRepaymentSchedule = async (loanId, numberOfPayments) => {
    if (!isConnected) {
      setError('Please connect your wallet first');
      return null;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      const tx = await lendSmartLoanContract.createRepaymentSchedule(loanId, numberOfPayments);
      const receipt = await tx.wait();
      
      setIsLoading(false);
      return {
        transactionHash: receipt.hash,
        status: receipt.status === 1 ? 'success' : 'failed'
      };
    } catch (err) {
      console.error('Error creating repayment schedule:', err);
      setError(`Failed to create repayment schedule for loan ID ${loanId}`);
      setIsLoading(false);
      return null;
    }
  };

  // Cancel a loan request
  const cancelLoanRequest = async (loanId) => {
    if (!isConnected) {
      setError('Please connect your wallet first');
      return null;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      const tx = await lendSmartLoanContract.cancelLoanRequest(loanId);
      const receipt = await tx.wait();
      
      setIsLoading(false);
      return {
        transactionHash: receipt.hash,
        status: receipt.status === 1 ? 'success' : 'failed'
      };
    } catch (err) {
      console.error('Error cancelling loan request:', err);
      setError(`Failed to cancel loan request ID ${loanId}`);
      setIsLoading(false);
      return null;
    }
  };

  // Set loan risk score (only callable by risk assessor)
  const setLoanRiskScore = async (loanId, riskScore, shouldReject = false) => {
    if (!isConnected) {
      setError('Please connect your wallet first');
      return null;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      const tx = await lendSmartLoanContract.setLoanRiskScore(loanId, riskScore, shouldReject);
      const receipt = await tx.wait();
      
      setIsLoading(false);
      return {
        transactionHash: receipt.hash,
        status: receipt.status === 1 ? 'success' : 'failed'
      };
    } catch (err) {
      console.error('Error setting loan risk score:', err);
      setError(`Failed to set risk score for loan ID ${loanId}`);
      setIsLoading(false);
      return null;
    }
  };

  // Mark a loan as defaulted (only callable by lender or owner)
  const markLoanAsDefaulted = async (loanId) => {
    if (!isConnected) {
      setError('Please connect your wallet first');
      return null;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      const tx = await lendSmartLoanContract.markLoanAsDefaulted(loanId);
      const receipt = await tx.wait();
      
      setIsLoading(false);
      return {
        transactionHash: receipt.hash,
        status: receipt.status === 1 ? 'success' : 'failed'
      };
    } catch (err) {
      console.error('Error marking loan as defaulted:', err);
      setError(`Failed to mark loan ID ${loanId} as defaulted`);
      setIsLoading(false);
      return null;
    }
  };

  // Get user reputation score
  const getUserReputationScore = async (userAddress) => {
    if (!lendSmartLoanContract) {
      setError('Contract not initialized');
      return null;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      const address = userAddress || account;
      if (!address) {
        setError('No address provided');
        setIsLoading(false);
        return null;
      }
      
      const score = await lendSmartLoanContract.getUserReputationScore(address);
      
      setIsLoading(false);
      return score.toString();
    } catch (err) {
      console.error('Error getting user reputation score:', err);
      setError(`Failed to get reputation score for user ${userAddress || account}`);
      setIsLoading(false);
      return null;
    }
  };

  // Helper function to convert numeric loan status to string
  const getLoanStatusString = (statusCode) => {
    const statusMap = {
      0: 'Requested',
      1: 'Funded',
      2: 'Active',
      3: 'Repaid',
      4: 'Defaulted',
      5: 'Cancelled',
      6: 'Rejected'
    };
    
    return statusMap[statusCode] || 'Unknown';
  };

  // Context value
  const value = {
    provider,
    signer,
    account,
    chainId,
    lendSmartLoanContract,
    isConnected,
    isLoading,
    error,
    connectWallet,
    disconnectWallet,
    requestLoan,
    getUserLoans,
    getLoanDetails,
    fundLoan,
    disburseLoan,
    repayLoan,
    depositCollateral,
    createRepaymentSchedule,
    cancelLoanRequest,
    setLoanRiskScore,
    markLoanAsDefaulted,
    getUserReputationScore
  };

  return (
    <BlockchainContext.Provider value={value}>
      {children}
    </BlockchainContext.Provider>
  );
};

export default BlockchainContext;
