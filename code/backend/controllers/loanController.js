const loanService = require("../services/loanService");
const asyncHandler = require("../middlewares/asyncHandler");

/**
 * @desc    Apply for a new loan
 * @route   POST /api/loans/apply
 * @access  Private (Borrower)
 */
const applyLoan = asyncHandler(async (req, res, next) => {
    const borrowerId = req.user.id; // Assuming req.user is populated by authMiddleware
    const { amountRequested, interestRate, term, termUnit, purpose, collateral } = req.body;

    if (!amountRequested || !interestRate || !term || !termUnit || !purpose) {
        res.status(400);
        throw new Error("Missing required loan application fields: amount, interest rate, term, term unit, and purpose.");
    }

    try {
        const loan = await loanService.applyForLoan(borrowerId, {
            amountRequested,
            interestRate,
            term,
            termUnit,
            purpose,
            collateral,
        });
        res.status(201).json({
            success: true,
            message: "Loan application submitted successfully.",
            data: loan,
        });
    } catch (error) {
        res.status(400);
        throw new Error(error.message || "Loan application failed.");
    }
});

/**
 * @desc    Get all loans (for marketplace or admin)
 * @route   GET /api/loans
 * @access  Public or Private (Admin/Lender)
 */
const getMarketplaceLoans = asyncHandler(async (req, res, next) => {
    // Filters and pagination can be passed as query parameters
    const { status, minAmount, maxAmount, minInterest, maxInterest, page, limit } = req.query;
    const filters = { status, minAmount, maxAmount, minInterest, maxInterest };
    // For marketplace, typically show only 'pending' loans
    filters.status = filters.status || "pending"; 
    const pagination = { page, limit };

    try {
        const result = await loanService.getAllLoans(filters, pagination);
        res.status(200).json({
            success: true,
            data: result.loans,
            totalLoans: result.totalLoans,
            page: result.page,
            pages: result.pages,
        });
    } catch (error) {
        res.status(500);
        throw new Error(error.message || "Failed to fetch marketplace loans.");
    }
});

/**
 * @desc    Get loans for the authenticated user (borrowed or lended)
 * @route   GET /api/loans/my-loans
 * @access  Private
 */
const getMyLoans = asyncHandler(async (req, res, next) => {
    const userId = req.user.id;
    const { type } = req.query; // type can be 'borrowed' or 'lended'

    try {
        const loans = await loanService.getUserLoans(userId, type);
        res.status(200).json({
            success: true,
            count: loans.length,
            data: loans,
        });
    } catch (error) {
        res.status(400);
        throw new Error(error.message || "Failed to fetch user loans.");
    }
});

/**
 * @desc    Get a single loan by ID
 * @route   GET /api/loans/:id
 * @access  Public or Private (depending on requirements)
 */
const getLoanDetails = asyncHandler(async (req, res, next) => {
    const loanId = req.params.id;
    try {
        const loan = await loanService.getLoanById(loanId);
        if (!loan) {
            res.status(404);
            throw new Error("Loan not found.");
        }
        res.status(200).json({
            success: true,
            data: loan,
        });
    } catch (error) {
        // If error is due to invalid ObjectId format, Mongoose might throw a CastError
        if (error.name === 'CastError') {
            res.status(400);
            throw new Error(`Invalid loan ID format: ${loanId}`);
        }
        res.status(error.statusCode || 500); // Use error's status code if available
        throw new Error(error.message || "Failed to fetch loan details.");
    }
});

/**
 * @desc    Fund a loan
 * @route   POST /api/loans/:id/fund
 * @access  Private (Lender)
 */
const fundSpecificLoan = asyncHandler(async (req, res, next) => {
    const loanId = req.params.id;
    const lenderId = req.user.id; // Assuming lender is the authenticated user
    const { amountToFund } = req.body;

    if (!amountToFund || isNaN(parseFloat(amountToFund)) || parseFloat(amountToFund) <= 0) {
        res.status(400);
        throw new Error("Valid funding amount is required.");
    }

    try {
        const updatedLoan = await loanService.fundLoan(loanId, lenderId, parseFloat(amountToFund));
        res.status(200).json({
            success: true,
            message: "Loan funded successfully.",
            data: updatedLoan,
        });
    } catch (error) {
        res.status(400);
        throw new Error(error.message || "Failed to fund loan.");
    }
});

/**
 * @desc    Update loan status (e.g., by admin or system events)
 * @route   PUT /api/loans/:id/status
 * @access  Private (Admin or System)
 */
const updateSpecificLoanStatus = asyncHandler(async (req, res, next) => {
    const loanId = req.params.id;
    const { status, smartContractAddress } = req.body;

    if (!status) {
        res.status(400);
        throw new Error("New status is required.");
    }
    // Add more validation for allowed statuses if needed

    try {
        const updatedLoan = await loanService.updateLoanStatus(loanId, status, { smartContractAddress });
        res.status(200).json({
            success: true,
            message: `Loan status updated to ${status}.`,
            data: updatedLoan,
        });
    } catch (error) {
        res.status(400);
        throw new Error(error.message || "Failed to update loan status.");
    }
});

/**
 * @desc    Record a repayment for a loan
 * @route   POST /api/loans/:id/repay
 * @access  Private (Borrower or System)
 */
const recordLoanRepayment = asyncHandler(async (req, res, next) => {
    const loanId = req.params.id;
    // const userId = req.user.id; // Could verify if req.user is the borrower
    const { installmentNumber, amountPaid, paymentDate } = req.body;

    if (installmentNumber === undefined || !amountPaid) {
        res.status(400);
        throw new Error("Installment number and amount paid are required.");
    }

    try {
        const updatedLoan = await loanService.recordRepayment(loanId, parseInt(installmentNumber), parseFloat(amountPaid), paymentDate);
        res.status(200).json({
            success: true,
            message: "Repayment recorded successfully.",
            data: updatedLoan,
        });
    } catch (error) {
        res.status(400);
        throw new Error(error.message || "Failed to record repayment.");
    }
});

module.exports = {
    applyLoan,
    getMarketplaceLoans,
    getMyLoans,
    getLoanDetails,
    fundSpecificLoan,
    updateSpecificLoanStatus,
    recordLoanRepayment,
};
