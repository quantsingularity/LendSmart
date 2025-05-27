const Loan = require("../models/Loan");
const User = require("../models/User");
const blockchainService = require("./blockchainService");

/**
 * Apply for a new loan
 * @param {string} borrowerId - ID of the borrower
 * @param {Object} loanData - Loan application data
 * @returns {Promise<Object>} - Created loan object
 */
const applyForLoan = async (borrowerId, loanData) => {
  const {
    amountRequested,
    interestRate,
    term,
    termUnit,
    purpose,
    collateral,
    token,
    isCollateralized,
    collateralToken,
    collateralAmount,
    decimals,
    collateralDecimals,
    privateKey
  } = loanData;

  // Validate required fields
  if (!amountRequested || !interestRate || !term || !termUnit || !purpose) {
    throw new Error("Missing required loan application fields");
  }

  // If blockchain integration is needed
  if (privateKey) {
    const user = await User.findById(borrowerId);
    
    if (!user.walletAddress) {
      throw new Error('User wallet address not found');
    }
    
    // Set signer for blockchain transaction
    blockchainService.setSigner(privateKey);
    
    // Submit loan request to blockchain
    const result = await blockchainService.requestLoan({
      token,
      principal: amountRequested,
      interestRate,
      duration: term,
      purpose,
      isCollateralized,
      collateralToken,
      collateralAmount,
      decimals,
      collateralDecimals
    });
    
    // Create loan in database
    const loan = await Loan.create({
      blockchainId: result.loanId,
      borrower: borrowerId,
      principal: amountRequested,
      interestRate,
      duration: term,
      purpose,
      status: 'Requested',
      isCollateralized,
      collateralToken,
      collateralAmount,
      transactionHash: result.transactionHash
    });
    
    return {
      loan,
      blockchainData: result
    };
  } else {
    // Create loan in database without blockchain integration
    const loan = await Loan.create({
      borrower: borrowerId,
      amountRequested,
      interestRate,
      term,
      termUnit,
      purpose,
      collateral,
      status: "pending"
    });
    
    return loan;
  }
};

/**
 * Get all loans with optional filtering and pagination
 * @param {Object} filters - Filter criteria
 * @param {Object} pagination - Pagination options
 * @returns {Promise<Object>} - Loans and pagination data
 */
const getAllLoans = async (filters = {}, pagination = {}) => {
  const { status, minAmount, maxAmount, minInterest, maxInterest, borrower, lender } = filters;
  const { page = 1, limit = 10 } = pagination;
  
  // Build filter object
  const filter = {};
  if (status) filter.status = status;
  if (borrower) filter.borrower = borrower;
  if (lender) filter.lender = lender;
  
  if (minAmount) filter.amountRequested = { $gte: parseFloat(minAmount) };
  if (maxAmount) {
    if (filter.amountRequested) {
      filter.amountRequested.$lte = parseFloat(maxAmount);
    } else {
      filter.amountRequested = { $lte: parseFloat(maxAmount) };
    }
  }
  
  if (minInterest) filter.interestRate = { $gte: parseFloat(minInterest) };
  if (maxInterest) {
    if (filter.interestRate) {
      filter.interestRate.$lte = parseFloat(maxInterest);
    } else {
      filter.interestRate = { $lte: parseFloat(maxInterest) };
    }
  }
  
  // Calculate pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  // Get loans from database
  const totalLoans = await Loan.countDocuments(filter);
  const loans = await Loan.find(filter)
    .populate('borrower', 'name email walletAddress')
    .populate('lender', 'name email walletAddress')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));
  
  return {
    loans,
    totalLoans,
    page: parseInt(page),
    pages: Math.ceil(totalLoans / parseInt(limit))
  };
};

/**
 * Get loans for a specific user
 * @param {string} userId - User ID
 * @param {string} type - Type of loans ('borrowed' or 'lended')
 * @returns {Promise<Array>} - Array of loans
 */
const getUserLoans = async (userId, type = 'borrowed') => {
  // Determine filter based on type
  const filter = type === 'lended' ? { lender: userId } : { borrower: userId };
  
  // Check if blockchain integration is needed
  const user = await User.findById(userId);
  if (user.walletAddress) {
    try {
      // Get loan IDs from blockchain
      const loanIds = await blockchainService.getUserLoans(user.walletAddress);
      
      // Get loan details from database or blockchain
      const loans = [];
      for (const loanId of loanIds) {
        // Try to get from database first
        let loan = await Loan.findOne({ blockchainId: loanId })
          .populate('borrower', 'name email walletAddress')
          .populate('lender', 'name email walletAddress');
        
        // If not in database, get from blockchain
        if (!loan) {
          const blockchainLoan = await blockchainService.getLoanDetails(loanId);
          
          // Create minimal loan object from blockchain data
          loan = {
            blockchainId: loanId,
            borrower: blockchainLoan.loan.borrower,
            lender: blockchainLoan.loan.lender,
            principal: blockchainLoan.loan.principal,
            interestRate: blockchainLoan.loan.interestRate,
            duration: blockchainLoan.loan.duration,
            status: blockchainLoan.loan.status,
            purpose: blockchainLoan.loan.purpose,
            isCollateralized: blockchainLoan.loan.isCollateralized,
            fromBlockchain: true
          };
        }
        
        loans.push(loan);
      }
      
      return loans;
    } catch (error) {
      // Fall back to database if blockchain fails
      console.error("Blockchain fetch failed, falling back to database:", error);
    }
  }
  
  // Get loans from database
  const loans = await Loan.find(filter)
    .populate('borrower', 'name email walletAddress')
    .populate('lender', 'name email walletAddress')
    .sort({ createdAt: -1 });
  
  return loans;
};

/**
 * Get a loan by ID
 * @param {string} loanId - Loan ID
 * @returns {Promise<Object>} - Loan object
 */
const getLoanById = async (loanId) => {
  // Check if ID is a blockchain ID (numeric) or database ID
  const isBlockchainId = !isNaN(loanId);
  
  let loan;
  if (isBlockchainId) {
    // Try to get from database first
    loan = await Loan.findOne({ blockchainId: loanId })
      .populate('borrower', 'name email walletAddress')
      .populate('lender', 'name email walletAddress');
    
    // If not in database, get from blockchain
    if (!loan) {
      try {
        const blockchainLoan = await blockchainService.getLoanDetails(loanId);
        
        // Create minimal loan object from blockchain data
        loan = {
          blockchainId: loanId,
          borrower: blockchainLoan.loan.borrower,
          lender: blockchainLoan.loan.lender,
          principal: blockchainLoan.loan.principal,
          interestRate: blockchainLoan.loan.interestRate,
          duration: blockchainLoan.loan.duration,
          status: blockchainLoan.loan.status,
          purpose: blockchainLoan.loan.purpose,
          isCollateralized: blockchainLoan.loan.isCollateralized,
          repaymentSchedule: blockchainLoan.repaymentSchedule,
          repaymentAmounts: blockchainLoan.repaymentAmounts,
          fromBlockchain: true
        };
      } catch (error) {
        throw new Error(`Loan not found on blockchain: ${error.message}`);
      }
    }
  } else {
    // Get from database by MongoDB ID
    loan = await Loan.findById(loanId)
      .populate('borrower', 'name email walletAddress')
      .populate('lender', 'name email walletAddress');
  }
  
  if (!loan) {
    throw new Error('Loan not found');
  }
  
  return loan;
};

/**
 * Fund a loan
 * @param {string} loanId - Loan ID
 * @param {string} lenderId - Lender ID
 * @param {number} amountToFund - Amount to fund
 * @param {string} privateKey - Private key for blockchain transaction
 * @returns {Promise<Object>} - Updated loan object
 */
const fundLoan = async (loanId, lenderId, amountToFund, privateKey) => {
  // Validate input
  if (!amountToFund || isNaN(parseFloat(amountToFund)) || parseFloat(amountToFund) <= 0) {
    throw new Error("Valid funding amount is required");
  }
  
  // Get the loan
  const loan = await getLoanById(loanId);
  
  // Check if loan can be funded
  if (loan.status !== 'pending' && loan.status !== 'Requested') {
    throw new Error(`Loan cannot be funded in ${loan.status} status`);
  }
  
  // If blockchain integration is needed
  if (privateKey && loan.blockchainId) {
    // Set signer for blockchain transaction
    blockchainService.setSigner(privateKey);
    
    // Fund loan on blockchain
    const result = await blockchainService.fundLoan(loan.blockchainId);
    
    // Update loan in database
    if (!loan.fromBlockchain) {
      loan.lender = lenderId;
      loan.status = 'Funded';
      loan.fundedAt = Date.now();
      loan.amountFunded = amountToFund;
      await loan.save();
    }
    
    return {
      loan: loan.fromBlockchain ? { blockchainId: loan.blockchainId } : loan,
      blockchainData: result
    };
  } else {
    // Update loan in database without blockchain integration
    loan.lender = lenderId;
    loan.status = 'funded';
    loan.amountFunded = amountToFund;
    loan.fundedDate = Date.now();
    await loan.save();
    
    return loan;
  }
};

/**
 * Update loan status
 * @param {string} loanId - Loan ID
 * @param {string} status - New status
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} - Updated loan object
 */
const updateLoanStatus = async (loanId, status, options = {}) => {
  const { smartContractAddress, privateKey } = options;
  
  // Validate status
  const validStatuses = ['pending', 'approved', 'rejected', 'funded', 'active', 'repaid', 'defaulted', 'cancelled'];
  if (!validStatuses.includes(status.toLowerCase())) {
    throw new Error(`Invalid status: ${status}. Valid statuses are: ${validStatuses.join(', ')}`);
  }
  
  // Get the loan
  const loan = await getLoanById(loanId);
  
  // If blockchain integration is needed
  if (privateKey && loan.blockchainId) {
    // Set signer for blockchain transaction
    blockchainService.setSigner(privateKey);
    
    // Update status on blockchain based on status type
    let result;
    switch (status.toLowerCase()) {
      case 'cancelled':
        result = await blockchainService.cancelLoanRequest(loan.blockchainId);
        break;
      case 'defaulted':
        result = await blockchainService.markLoanAsDefaulted(loan.blockchainId);
        break;
      // Add other status transitions as needed
    }
    
    // Update loan in database if it's not from blockchain
    if (!loan.fromBlockchain) {
      loan.status = status;
      if (smartContractAddress) loan.smartContractAddress = smartContractAddress;
      
      // Add timestamps based on status
      if (status.toLowerCase() === 'cancelled') loan.cancelledAt = Date.now();
      if (status.toLowerCase() === 'defaulted') loan.defaultedAt = Date.now();
      
      await loan.save();
    }
    
    return {
      loan: loan.fromBlockchain ? { blockchainId: loan.blockchainId, status } : loan,
      blockchainData: result
    };
  } else {
    // Update loan in database without blockchain integration
    loan.status = status;
    if (smartContractAddress) loan.smartContractAddress = smartContractAddress;
    
    // Add timestamps based on status
    if (status === 'funded') loan.fundedDate = Date.now();
    if (status === 'repaid') loan.repaidDate = Date.now();
    if (status === 'defaulted') loan.defaultedDate = Date.now();
    
    await loan.save();
    
    return loan;
  }
};

/**
 * Record a loan repayment
 * @param {string} loanId - Loan ID
 * @param {number} installmentNumber - Installment number
 * @param {number} amountPaid - Amount paid
 * @param {Date} paymentDate - Payment date
 * @param {string} privateKey - Private key for blockchain transaction
 * @returns {Promise<Object>} - Updated loan object
 */
const recordRepayment = async (loanId, installmentNumber, amountPaid, paymentDate = new Date(), privateKey) => {
  // Validate input
  if (installmentNumber === undefined || !amountPaid) {
    throw new Error("Installment number and amount paid are required");
  }
  
  // Get the loan
  const loan = await getLoanById(loanId);
  
  // Check if loan is active
  if (loan.status !== 'active' && loan.status !== 'Active') {
    throw new Error(`Loan cannot be repaid in ${loan.status} status`);
  }
  
  // If blockchain integration is needed
  if (privateKey && loan.blockchainId) {
    // Set signer for blockchain transaction
    blockchainService.setSigner(privateKey);
    
    // Determine decimals (default to 18 if not specified)
    const decimals = loan.decimals || 18;
    
    // Repay loan on blockchain
    const result = await blockchainService.repayLoan(loan.blockchainId, amountPaid, decimals);
    
    // Update loan in database if it's not from blockchain
    if (!loan.fromBlockchain) {
      // Initialize repayments array if it doesn't exist
      if (!loan.repayments) loan.repayments = [];
      
      // Add new repayment
      loan.repayments.push({
        installmentNumber,
        amountPaid,
        paymentDate: paymentDate || Date.now()
      });
      
      // Update total amount repaid
      loan.amountRepaid = (loan.amountRepaid || 0) + amountPaid;
      
      // Check if loan is fully repaid
      const blockchainLoan = await blockchainService.getLoanDetails(loan.blockchainId);
      if (blockchainLoan.loan.status === 'Repaid') {
        loan.status = 'Repaid';
        loan.repaidAt = Date.now();
      }
      
      await loan.save();
    }
    
    return {
      loan: loan.fromBlockchain ? { blockchainId: loan.blockchainId } : loan,
      blockchainData: result
    };
  } else {
    // Initialize repayments array if it doesn't exist
    if (!loan.repayments) loan.repayments = [];
    
    // Add new repayment
    loan.repayments.push({
      installmentNumber,
      amountPaid,
      paymentDate: paymentDate || Date.now()
    });
    
    // Update total amount repaid
    loan.amountRepaid = (loan.amountRepaid || 0) + amountPaid;
    
    // Check if loan is fully repaid
    if (loan.amountRepaid >= loan.amountRequested) {
      loan.status = 'repaid';
      loan.repaidDate = Date.now();
    }
    
    await loan.save();
    
    return loan;
  }
};

/**
 * Create repayment schedule for a loan
 * @param {string} loanId - Loan ID
 * @param {number} numberOfPayments - Number of payments
 * @param {string} privateKey - Private key for blockchain transaction
 * @returns {Promise<Object>} - Updated loan object with schedule
 */
const createRepaymentSchedule = async (loanId, numberOfPayments, privateKey) => {
  // Validate input
  if (!numberOfPayments || numberOfPayments <= 0) {
    throw new Error("Valid number of payments is required");
  }
  
  // Get the loan
  const loan = await getLoanById(loanId);
  
  // Check if blockchain integration is needed
  if (!privateKey || !loan.blockchainId) {
    throw new Error("Blockchain integration is required for repayment schedule creation");
  }
  
  // Set signer for blockchain transaction
  blockchainService.setSigner(privateKey);
  
  // Create repayment schedule on blockchain
  const result = await blockchainService.createRepaymentSchedule(loan.blockchainId, numberOfPayments);
  
  // Get updated loan details with schedule
  const blockchainLoan = await blockchainService.getLoanDetails(loan.blockchainId);
  
  // Update loan in database if it's not from blockchain
  if (!loan.fromBlockchain) {
    loan.repaymentSchedule = blockchainLoan.repaymentSchedule;
    loan.repaymentAmounts = blockchainLoan.repaymentAmounts;
    await loan.save();
  }
  
  return {
    loan: loan.fromBlockchain ? {
      blockchainId: loan.blockchainId,
      repaymentSchedule: blockchainLoan.repaymentSchedule,
      repaymentAmounts: blockchainLoan.repaymentAmounts
    } : loan,
    blockchainData: result
  };
};

/**
 * Get user reputation score
 * @param {string} address - User wallet address
 * @returns {Promise<number>} - Reputation score
 */
const getUserReputationScore = async (address) => {
  if (!address) {
    throw new Error("Wallet address is required");
  }
  
  // Get reputation score from blockchain
  const score = await blockchainService.getUserReputationScore(address);
  
  return score;
};

module.exports = {
  applyForLoan,
  getAllLoans,
  getUserLoans,
  getLoanById,
  fundLoan,
  updateLoanStatus,
  recordRepayment,
  createRepaymentSchedule,
  getUserReputationScore
};
