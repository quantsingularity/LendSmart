const loanService = require("../services/loanService");

/**
 * @desc    Apply for a new loan
 * @route   POST /api/loans/apply
 * @access  Private (Borrower)
 */
const applyLoan = async (req, res) => {
  try {
    // Input validation
    const { amountRequested, interestRate, term, termUnit, purpose, collateral } = req.body;
    const borrowerId = req.user?.id;

    if (!borrowerId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. User ID not found."
      });
    }

    if (!amountRequested || !interestRate || !term || !termUnit || !purpose) {
      return res.status(400).json({
        success: false,
        message: "Missing required loan application fields: amount, interest rate, term, term unit, and purpose."
      });
    }

    // Process loan application through service
    const loan = await loanService.applyForLoan(borrowerId, {
      amountRequested,
      interestRate,
      term,
      termUnit,
      purpose,
      collateral,
      ...req.body // Pass any additional blockchain-related fields
    });

    // Return success response
    return res.status(201).json({
      success: true,
      message: "Loan application submitted successfully.",
      data: loan
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Loan application failed."
    });
  }
};

/**
 * @desc    Get all loans (for marketplace or admin)
 * @route   GET /api/loans
 * @access  Public or Private (Admin/Lender)
 */
const getMarketplaceLoans = async (req, res) => {
  try {
    // Extract and validate query parameters
    const { status, minAmount, maxAmount, minInterest, maxInterest, page, limit } = req.query;
    
    // For marketplace, typically show only 'pending' loans
    const filters = { 
      status: status || "pending", 
      minAmount, 
      maxAmount, 
      minInterest, 
      maxInterest 
    };
    
    const pagination = { page, limit };

    // Get loans through service
    const result = await loanService.getAllLoans(filters, pagination);

    // Return success response
    return res.status(200).json({
      success: true,
      data: result.loans,
      totalLoans: result.totalLoans,
      page: result.page,
      pages: result.pages
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch marketplace loans."
    });
  }
};

/**
 * @desc    Get loans for the authenticated user (borrowed or lended)
 * @route   GET /api/loans/my-loans
 * @access  Private
 */
const getMyLoans = async (req, res) => {
  try {
    // Input validation
    const userId = req.user?.id;
    const { type } = req.query; // type can be 'borrowed' or 'lended'

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. User ID not found."
      });
    }

    // Get user loans through service
    const loans = await loanService.getUserLoans(userId, type);

    // Return success response
    return res.status(200).json({
      success: true,
      count: loans.length,
      data: loans
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to fetch user loans."
    });
  }
};

/**
 * @desc    Get a single loan by ID
 * @route   GET /api/loans/:id
 * @access  Public or Private (depending on requirements)
 */
const getLoanDetails = async (req, res) => {
  try {
    // Input validation
    const loanId = req.params.id;
    
    if (!loanId) {
      return res.status(400).json({
        success: false,
        message: "Loan ID is required."
      });
    }

    // Get loan details through service
    const loan = await loanService.getLoanById(loanId);

    // Return success response
    return res.status(200).json({
      success: true,
      data: loan
    });
  } catch (error) {
    // Handle specific error types
    if (error.message.includes("not found")) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    if (error.name === 'CastError' || error.message.includes("Invalid")) {
      return res.status(400).json({
        success: false,
        message: `Invalid loan ID format: ${req.params.id}`
      });
    }
    
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch loan details."
    });
  }
};

/**
 * @desc    Fund a loan
 * @route   POST /api/loans/:id/fund
 * @access  Private (Lender)
 */
const fundSpecificLoan = async (req, res) => {
  try {
    // Input validation
    const loanId = req.params.id;
    const lenderId = req.user?.id;
    const { amountToFund, privateKey } = req.body;

    if (!lenderId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Lender ID not found."
      });
    }

    if (!loanId) {
      return res.status(400).json({
        success: false,
        message: "Loan ID is required."
      });
    }

    if (!amountToFund || isNaN(parseFloat(amountToFund)) || parseFloat(amountToFund) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid funding amount is required."
      });
    }

    // Fund loan through service
    const updatedLoan = await loanService.fundLoan(
      loanId, 
      lenderId, 
      parseFloat(amountToFund),
      privateKey
    );

    // Return success response
    return res.status(200).json({
      success: true,
      message: "Loan funded successfully.",
      data: updatedLoan
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to fund loan."
    });
  }
};

/**
 * @desc    Update loan status (e.g., by admin or system events)
 * @route   PUT /api/loans/:id/status
 * @access  Private (Admin or System)
 */
const updateSpecificLoanStatus = async (req, res) => {
  try {
    // Input validation
    const loanId = req.params.id;
    const { status, smartContractAddress, privateKey } = req.body;

    if (!loanId) {
      return res.status(400).json({
        success: false,
        message: "Loan ID is required."
      });
    }

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "New status is required."
      });
    }

    // Update loan status through service
    const updatedLoan = await loanService.updateLoanStatus(
      loanId, 
      status, 
      { smartContractAddress, privateKey }
    );

    // Return success response
    return res.status(200).json({
      success: true,
      message: `Loan status updated to ${status}.`,
      data: updatedLoan
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to update loan status."
    });
  }
};

/**
 * @desc    Record a repayment for a loan
 * @route   POST /api/loans/:id/repay
 * @access  Private (Borrower or System)
 */
const recordLoanRepayment = async (req, res) => {
  try {
    // Input validation
    const loanId = req.params.id;
    const { installmentNumber, amountPaid, paymentDate, privateKey } = req.body;

    if (!loanId) {
      return res.status(400).json({
        success: false,
        message: "Loan ID is required."
      });
    }

    if (installmentNumber === undefined || !amountPaid) {
      return res.status(400).json({
        success: false,
        message: "Installment number and amount paid are required."
      });
    }

    // Record repayment through service
    const updatedLoan = await loanService.recordRepayment(
      loanId, 
      parseInt(installmentNumber), 
      parseFloat(amountPaid), 
      paymentDate,
      privateKey
    );

    // Return success response
    return res.status(200).json({
      success: true,
      message: "Repayment recorded successfully.",
      data: updatedLoan
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to record repayment."
    });
  }
};

/**
 * @desc    Create repayment schedule for a loan
 * @route   POST /api/loans/:id/schedule
 * @access  Private
 */
const createRepaymentSchedule = async (req, res) => {
  try {
    // Input validation
    const loanId = req.params.id;
    const { numberOfPayments, privateKey } = req.body;

    if (!loanId) {
      return res.status(400).json({
        success: false,
        message: "Loan ID is required."
      });
    }

    if (!numberOfPayments || !privateKey) {
      return res.status(400).json({
        success: false,
        message: "Number of payments and private key are required."
      });
    }

    // Create repayment schedule through service
    const result = await loanService.createRepaymentSchedule(
      loanId, 
      numberOfPayments, 
      privateKey
    );

    // Return success response
    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to create repayment schedule."
    });
  }
};

/**
 * @desc    Get user reputation score
 * @route   GET /api/loans/reputation/:address
 * @access  Public
 */
const getReputationScore = async (req, res) => {
  try {
    // Input validation
    const { address } = req.params;

    if (!address) {
      return res.status(400).json({
        success: false,
        message: "Wallet address is required."
      });
    }

    // Get reputation score through service
    const score = await loanService.getUserReputationScore(address);

    // Return success response
    return res.status(200).json({
      success: true,
      data: {
        address,
        reputationScore: score
      }
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to get reputation score."
    });
  }
};

module.exports = {
  applyLoan,
  getMarketplaceLoans,
  getMyLoans,
  getLoanDetails,
  fundSpecificLoan,
  updateSpecificLoanStatus,
  recordLoanRepayment,
  createRepaymentSchedule,
  getReputationScore
};
