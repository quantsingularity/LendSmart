const { ethers } = require('ethers');
const LendSmartLoanABI = require('../config/abis/LendSmartLoan.json');
const config = require('../config/blockchain');

/**
 * BlockchainService - Handles all interactions with the blockchain and smart contracts
 */
class BlockchainService {
  constructor() {
    this.provider = null;
    this.lendSmartLoanContract = null;
    this.signer = null;
    this.initialize();
  }

  /**
   * Initialize blockchain connection and contract instances
   */
  async initialize() {
    try {
      // Connect to the blockchain network
      this.provider = new ethers.JsonRpcProvider(config.rpcUrl);
      
      // Create contract instance
      this.lendSmartLoanContract = new ethers.Contract(
        config.lendSmartLoanAddress,
        LendSmartLoanABI.abi,
        this.provider
      );
      
      console.log('Blockchain service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize blockchain service:', error);
      throw new Error('Blockchain service initialization failed');
    }
  }

  /**
   * Set the signer for transactions that require authentication
   * @param {string} privateKey - Private key of the account to sign transactions
   */
  setSigner(privateKey) {
    try {
      this.signer = new ethers.Wallet(privateKey, this.provider);
      this.lendSmartLoanContract = this.lendSmartLoanContract.connect(this.signer);
    } catch (error) {
      console.error('Failed to set signer:', error);
      throw new Error('Invalid private key or provider not initialized');
    }
  }

  /**
   * Get all loans associated with a user (borrower or lender)
   * @param {string} userAddress - Ethereum address of the user
   * @returns {Promise<Array>} - Array of loan IDs
   */
  async getUserLoans(userAddress) {
    try {
      const loanIds = await this.lendSmartLoanContract.getUserLoans(userAddress);
      return loanIds.map(id => id.toString());
    } catch (error) {
      console.error('Failed to get user loans:', error);
      throw new Error('Failed to retrieve user loans from blockchain');
    }
  }

  /**
   * Get details of a specific loan
   * @param {number|string} loanId - ID of the loan
   * @returns {Promise<Object>} - Loan details
   */
  async getLoanDetails(loanId) {
    try {
      const [loan, schedule, amounts] = await this.lendSmartLoanContract.getLoanDetails(loanId);
      
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
        status: this.getLoanStatusString(loan.status),
        purpose: loan.purpose,
        isCollateralized: loan.isCollateralized,
        collateralAmount: loan.collateralAmount.toString(),
        collateralToken: loan.collateralToken
      };
      
      // Format schedule and amounts
      const formattedSchedule = schedule.map(time => time.toString());
      const formattedAmounts = amounts.map(amount => amount.toString());
      
      return {
        loan: formattedLoan,
        repaymentSchedule: formattedSchedule,
        repaymentAmounts: formattedAmounts
      };
    } catch (error) {
      console.error('Failed to get loan details:', error);
      throw new Error(`Failed to retrieve details for loan ID ${loanId}`);
    }
  }

  /**
   * Request a new loan
   * @param {Object} loanData - Loan request data
   * @returns {Promise<Object>} - Transaction receipt and loan ID
   */
  async requestLoan(loanData) {
    try {
      if (!this.signer) {
        throw new Error('Signer not set. Please authenticate first.');
      }
      
      const tx = await this.lendSmartLoanContract.requestLoan(
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
      
      return {
        transactionHash: receipt.hash,
        loanId: event.loanId,
        event
      };
    } catch (error) {
      console.error('Failed to request loan:', error);
      throw new Error('Failed to submit loan request to blockchain');
    }
  }

  /**
   * Deposit collateral for a loan
   * @param {number|string} loanId - ID of the loan
   * @returns {Promise<Object>} - Transaction receipt
   */
  async depositCollateral(loanId) {
    try {
      if (!this.signer) {
        throw new Error('Signer not set. Please authenticate first.');
      }
      
      const tx = await this.lendSmartLoanContract.depositCollateral(loanId);
      const receipt = await tx.wait();
      
      return {
        transactionHash: receipt.hash,
        status: receipt.status === 1 ? 'success' : 'failed'
      };
    } catch (error) {
      console.error('Failed to deposit collateral:', error);
      throw new Error(`Failed to deposit collateral for loan ID ${loanId}`);
    }
  }

  /**
   * Fund a loan as a lender
   * @param {number|string} loanId - ID of the loan to fund
   * @returns {Promise<Object>} - Transaction receipt
   */
  async fundLoan(loanId) {
    try {
      if (!this.signer) {
        throw new Error('Signer not set. Please authenticate first.');
      }
      
      const tx = await this.lendSmartLoanContract.fundLoan(loanId);
      const receipt = await tx.wait();
      
      return {
        transactionHash: receipt.hash,
        status: receipt.status === 1 ? 'success' : 'failed'
      };
    } catch (error) {
      console.error('Failed to fund loan:', error);
      throw new Error(`Failed to fund loan ID ${loanId}`);
    }
  }

  /**
   * Create a repayment schedule for a loan
   * @param {number|string} loanId - ID of the loan
   * @param {number} numberOfPayments - Number of repayments to schedule
   * @returns {Promise<Object>} - Transaction receipt
   */
  async createRepaymentSchedule(loanId, numberOfPayments) {
    try {
      if (!this.signer) {
        throw new Error('Signer not set. Please authenticate first.');
      }
      
      const tx = await this.lendSmartLoanContract.createRepaymentSchedule(loanId, numberOfPayments);
      const receipt = await tx.wait();
      
      return {
        transactionHash: receipt.hash,
        status: receipt.status === 1 ? 'success' : 'failed'
      };
    } catch (error) {
      console.error('Failed to create repayment schedule:', error);
      throw new Error(`Failed to create repayment schedule for loan ID ${loanId}`);
    }
  }

  /**
   * Disburse funds to borrower
   * @param {number|string} loanId - ID of the loan
   * @returns {Promise<Object>} - Transaction receipt
   */
  async disburseLoan(loanId) {
    try {
      if (!this.signer) {
        throw new Error('Signer not set. Please authenticate first.');
      }
      
      const tx = await this.lendSmartLoanContract.disburseLoan(loanId);
      const receipt = await tx.wait();
      
      return {
        transactionHash: receipt.hash,
        status: receipt.status === 1 ? 'success' : 'failed'
      };
    } catch (error) {
      console.error('Failed to disburse loan:', error);
      throw new Error(`Failed to disburse loan ID ${loanId}`);
    }
  }

  /**
   * Make a repayment on a loan
   * @param {number|string} loanId - ID of the loan
   * @param {string} amount - Amount to repay
   * @param {number} decimals - Token decimals
   * @returns {Promise<Object>} - Transaction receipt
   */
  async repayLoan(loanId, amount, decimals = 18) {
    try {
      if (!this.signer) {
        throw new Error('Signer not set. Please authenticate first.');
      }
      
      const tx = await this.lendSmartLoanContract.repayLoan(
        loanId,
        ethers.parseUnits(amount, decimals)
      );
      const receipt = await tx.wait();
      
      return {
        transactionHash: receipt.hash,
        status: receipt.status === 1 ? 'success' : 'failed'
      };
    } catch (error) {
      console.error('Failed to repay loan:', error);
      throw new Error(`Failed to make repayment for loan ID ${loanId}`);
    }
  }

  /**
   * Cancel a loan request
   * @param {number|string} loanId - ID of the loan
   * @returns {Promise<Object>} - Transaction receipt
   */
  async cancelLoanRequest(loanId) {
    try {
      if (!this.signer) {
        throw new Error('Signer not set. Please authenticate first.');
      }
      
      const tx = await this.lendSmartLoanContract.cancelLoanRequest(loanId);
      const receipt = await tx.wait();
      
      return {
        transactionHash: receipt.hash,
        status: receipt.status === 1 ? 'success' : 'failed'
      };
    } catch (error) {
      console.error('Failed to cancel loan request:', error);
      throw new Error(`Failed to cancel loan request ID ${loanId}`);
    }
  }

  /**
   * Mark a loan as defaulted (only callable by lender or owner)
   * @param {number|string} loanId - ID of the loan
   * @returns {Promise<Object>} - Transaction receipt
   */
  async markLoanAsDefaulted(loanId) {
    try {
      if (!this.signer) {
        throw new Error('Signer not set. Please authenticate first.');
      }
      
      const tx = await this.lendSmartLoanContract.markLoanAsDefaulted(loanId);
      const receipt = await tx.wait();
      
      return {
        transactionHash: receipt.hash,
        status: receipt.status === 1 ? 'success' : 'failed'
      };
    } catch (error) {
      console.error('Failed to mark loan as defaulted:', error);
      throw new Error(`Failed to mark loan ID ${loanId} as defaulted`);
    }
  }

  /**
   * Set risk score for a loan (only callable by risk assessor)
   * @param {number|string} loanId - ID of the loan
   * @param {number} riskScore - Risk score (0-100)
   * @param {boolean} shouldReject - Whether to reject the loan
   * @returns {Promise<Object>} - Transaction receipt
   */
  async setLoanRiskScore(loanId, riskScore, shouldReject) {
    try {
      if (!this.signer) {
        throw new Error('Signer not set. Please authenticate first.');
      }
      
      const tx = await this.lendSmartLoanContract.setLoanRiskScore(loanId, riskScore, shouldReject);
      const receipt = await tx.wait();
      
      return {
        transactionHash: receipt.hash,
        status: receipt.status === 1 ? 'success' : 'failed'
      };
    } catch (error) {
      console.error('Failed to set loan risk score:', error);
      throw new Error(`Failed to set risk score for loan ID ${loanId}`);
    }
  }

  /**
   * Get user reputation score
   * @param {string} userAddress - Ethereum address of the user
   * @returns {Promise<string>} - Reputation score
   */
  async getUserReputationScore(userAddress) {
    try {
      const score = await this.lendSmartLoanContract.getUserReputationScore(userAddress);
      return score.toString();
    } catch (error) {
      console.error('Failed to get user reputation score:', error);
      throw new Error(`Failed to retrieve reputation score for user ${userAddress}`);
    }
  }

  /**
   * Convert numeric loan status to string representation
   * @param {number} statusCode - Numeric loan status
   * @returns {string} - String representation of loan status
   */
  getLoanStatusString(statusCode) {
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
  }
}

module.exports = new BlockchainService();
