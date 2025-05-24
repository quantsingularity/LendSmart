const blockchainService = require('../services/blockchainService');
const Loan = require('../models/Loan');
const User = require('../models/User');

/**
 * @desc    Get all loans
 * @route   GET /api/loans
 * @access  Public
 */
exports.getLoans = async (req, res, next) => {
  try {
    // Get query parameters for filtering
    const { status, minAmount, maxAmount, borrower, lender } = req.query;
    
    // Build filter object
    const filter = {};
    if (status) filter.status = status;
    if (borrower) filter.borrower = borrower;
    if (lender) filter.lender = lender;
    if (minAmount) filter.principal = { $gte: minAmount };
    if (maxAmount) {
      if (filter.principal) {
        filter.principal.$lte = maxAmount;
      } else {
        filter.principal = { $lte: maxAmount };
      }
    }
    
    // Get loans from database
    const loans = await Loan.find(filter)
      .populate('borrower', 'name email walletAddress')
      .populate('lender', 'name email walletAddress')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: loans.length,
      data: loans
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get loans for the authenticated user
 * @route   GET /api/loans/my-loans
 * @access  Private
 */
exports.getMyLoans = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    
    if (!user.walletAddress) {
      return res.status(400).json({
        success: false,
        message: 'User wallet address not found'
      });
    }
    
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
    
    res.status(200).json({
      success: true,
      count: loans.length,
      data: loans
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get a single loan
 * @route   GET /api/loans/:id
 * @access  Public
 */
exports.getLoan = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if ID is a blockchain ID (numeric) or database ID
    const isBlockchainId = !isNaN(id);
    
    let loan;
    if (isBlockchainId) {
      // Try to get from database first
      loan = await Loan.findOne({ blockchainId: id })
        .populate('borrower', 'name email walletAddress')
        .populate('lender', 'name email walletAddress');
      
      // If not in database, get from blockchain
      if (!loan) {
        const blockchainLoan = await blockchainService.getLoanDetails(id);
        
        // Create minimal loan object from blockchain data
        loan = {
          blockchainId: id,
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
      }
    } else {
      // Get from database by MongoDB ID
      loan = await Loan.findById(id)
        .populate('borrower', 'name email walletAddress')
        .populate('lender', 'name email walletAddress');
    }
    
    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Loan not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: loan
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Apply for a new loan
 * @route   POST /api/loans/apply
 * @access  Private
 */
exports.applyForLoan = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    
    if (!user.walletAddress) {
      return res.status(400).json({
        success: false,
        message: 'User wallet address not found'
      });
    }
    
    // Get loan data from request body
    const {
      token,
      principal,
      interestRate,
      duration,
      purpose,
      isCollateralized,
      collateralToken,
      collateralAmount,
      decimals,
      collateralDecimals,
      privateKey
    } = req.body;
    
    // Validate required fields
    if (!token || !principal || !interestRate || !duration || !purpose || !privateKey) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }
    
    // Set signer for blockchain transaction
    blockchainService.setSigner(privateKey);
    
    // Submit loan request to blockchain
    const result = await blockchainService.requestLoan({
      token,
      principal,
      interestRate,
      duration,
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
      borrower: userId,
      principal,
      interestRate,
      duration,
      purpose,
      status: 'Requested',
      isCollateralized,
      collateralToken,
      collateralAmount,
      transactionHash: result.transactionHash
    });
    
    res.status(201).json({
      success: true,
      data: loan,
      blockchainData: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Fund a loan
 * @route   POST /api/loans/:id/fund
 * @access  Private
 */
exports.fundLoan = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { privateKey } = req.body;
    
    if (!privateKey) {
      return res.status(400).json({
        success: false,
        message: 'Private key is required'
      });
    }
    
    // Set signer for blockchain transaction
    blockchainService.setSigner(privateKey);
    
    // Fund loan on blockchain
    const result = await blockchainService.fundLoan(id);
    
    // Update loan in database if it exists
    const loan = await Loan.findOne({ blockchainId: id });
    if (loan) {
      loan.lender = req.user.id;
      loan.status = 'Funded';
      loan.fundedAt = Date.now();
      await loan.save();
    }
    
    res.status(200).json({
      success: true,
      data: loan || { blockchainId: id },
      blockchainData: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Disburse a loan
 * @route   POST /api/loans/:id/disburse
 * @access  Private
 */
exports.disburseLoan = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { privateKey } = req.body;
    
    if (!privateKey) {
      return res.status(400).json({
        success: false,
        message: 'Private key is required'
      });
    }
    
    // Set signer for blockchain transaction
    blockchainService.setSigner(privateKey);
    
    // Disburse loan on blockchain
    const result = await blockchainService.disburseLoan(id);
    
    // Update loan in database if it exists
    const loan = await Loan.findOne({ blockchainId: id });
    if (loan) {
      loan.status = 'Active';
      loan.disbursedAt = Date.now();
      await loan.save();
    }
    
    res.status(200).json({
      success: true,
      data: loan || { blockchainId: id },
      blockchainData: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Repay a loan
 * @route   POST /api/loans/:id/repay
 * @access  Private
 */
exports.repayLoan = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { amount, decimals, privateKey } = req.body;
    
    if (!amount || !privateKey) {
      return res.status(400).json({
        success: false,
        message: 'Amount and private key are required'
      });
    }
    
    // Set signer for blockchain transaction
    blockchainService.setSigner(privateKey);
    
    // Repay loan on blockchain
    const result = await blockchainService.repayLoan(id, amount, decimals || 18);
    
    // Update loan in database if it exists
    const loan = await Loan.findOne({ blockchainId: id });
    if (loan) {
      // Get updated loan details from blockchain to check if fully repaid
      const blockchainLoan = await blockchainService.getLoanDetails(id);
      
      if (blockchainLoan.loan.status === 'Repaid') {
        loan.status = 'Repaid';
        loan.repaidAt = Date.now();
      }
      
      loan.amountRepaid = blockchainLoan.loan.amountRepaid;
      await loan.save();
    }
    
    res.status(200).json({
      success: true,
      data: loan || { blockchainId: id },
      blockchainData: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Cancel a loan request
 * @route   POST /api/loans/:id/cancel
 * @access  Private
 */
exports.cancelLoan = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { privateKey } = req.body;
    
    if (!privateKey) {
      return res.status(400).json({
        success: false,
        message: 'Private key is required'
      });
    }
    
    // Set signer for blockchain transaction
    blockchainService.setSigner(privateKey);
    
    // Cancel loan on blockchain
    const result = await blockchainService.cancelLoanRequest(id);
    
    // Update loan in database if it exists
    const loan = await Loan.findOne({ blockchainId: id });
    if (loan) {
      loan.status = 'Cancelled';
      loan.cancelledAt = Date.now();
      await loan.save();
    }
    
    res.status(200).json({
      success: true,
      data: loan || { blockchainId: id },
      blockchainData: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create repayment schedule for a loan
 * @route   POST /api/loans/:id/schedule
 * @access  Private
 */
exports.createRepaymentSchedule = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { numberOfPayments, privateKey } = req.body;
    
    if (!numberOfPayments || !privateKey) {
      return res.status(400).json({
        success: false,
        message: 'Number of payments and private key are required'
      });
    }
    
    // Set signer for blockchain transaction
    blockchainService.setSigner(privateKey);
    
    // Create repayment schedule on blockchain
    const result = await blockchainService.createRepaymentSchedule(id, numberOfPayments);
    
    // Get updated loan details with schedule
    const blockchainLoan = await blockchainService.getLoanDetails(id);
    
    // Update loan in database if it exists
    const loan = await Loan.findOne({ blockchainId: id });
    if (loan) {
      loan.repaymentSchedule = blockchainLoan.repaymentSchedule;
      loan.repaymentAmounts = blockchainLoan.repaymentAmounts;
      await loan.save();
    }
    
    res.status(200).json({
      success: true,
      data: {
        blockchainId: id,
        repaymentSchedule: blockchainLoan.repaymentSchedule,
        repaymentAmounts: blockchainLoan.repaymentAmounts
      },
      blockchainData: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Deposit collateral for a loan
 * @route   POST /api/loans/:id/collateral
 * @access  Private
 */
exports.depositCollateral = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { privateKey } = req.body;
    
    if (!privateKey) {
      return res.status(400).json({
        success: false,
        message: 'Private key is required'
      });
    }
    
    // Set signer for blockchain transaction
    blockchainService.setSigner(privateKey);
    
    // Deposit collateral on blockchain
    const result = await blockchainService.depositCollateral(id);
    
    // Update loan in database if it exists
    const loan = await Loan.findOne({ blockchainId: id });
    if (loan) {
      loan.collateralDeposited = true;
      await loan.save();
    }
    
    res.status(200).json({
      success: true,
      data: loan || { blockchainId: id },
      blockchainData: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Set risk score for a loan
 * @route   POST /api/loans/:id/risk
 * @access  Private (Risk Assessor Only)
 */
exports.setRiskScore = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { riskScore, shouldReject, privateKey } = req.body;
    
    if (riskScore === undefined || !privateKey) {
      return res.status(400).json({
        success: false,
        message: 'Risk score and private key are required'
      });
    }
    
    // Set signer for blockchain transaction
    blockchainService.setSigner(privateKey);
    
    // Set risk score on blockchain
    const result = await blockchainService.setLoanRiskScore(id, riskScore, shouldReject || false);
    
    // Update loan in database if it exists
    const loan = await Loan.findOne({ blockchainId: id });
    if (loan) {
      loan.riskScore = riskScore;
      if (shouldReject) {
        loan.status = 'Rejected';
      }
      await loan.save();
    }
    
    res.status(200).json({
      success: true,
      data: loan || { blockchainId: id, riskScore },
      blockchainData: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark a loan as defaulted
 * @route   POST /api/loans/:id/default
 * @access  Private (Lender or Admin Only)
 */
exports.markAsDefaulted = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { privateKey } = req.body;
    
    if (!privateKey) {
      return res.status(400).json({
        success: false,
        message: 'Private key is required'
      });
    }
    
    // Set signer for blockchain transaction
    blockchainService.setSigner(privateKey);
    
    // Mark loan as defaulted on blockchain
    const result = await blockchainService.markLoanAsDefaulted(id);
    
    // Update loan in database if it exists
    const loan = await Loan.findOne({ blockchainId: id });
    if (loan) {
      loan.status = 'Defaulted';
      loan.defaultedAt = Date.now();
      await loan.save();
    }
    
    res.status(200).json({
      success: true,
      data: loan || { blockchainId: id },
      blockchainData: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get user reputation score
 * @route   GET /api/loans/reputation/:address
 * @access  Public
 */
exports.getReputationScore = async (req, res, next) => {
  try {
    const { address } = req.params;
    
    // Get reputation score from blockchain
    const score = await blockchainService.getUserReputationScore(address);
    
    res.status(200).json({
      success: true,
      data: {
        address,
        reputationScore: score
      }
    });
  } catch (error) {
    next(error);
  }
};
