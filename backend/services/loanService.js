const Loan = require("../models/loanModel");
const User = require("../models/userModel");
// const mongoose = require("mongoose"); // If needed for specific ObjectId operations

/**
 * @desc    Apply for a new loan
 * @param   {string} borrowerId - The ID of the user applying for the loan
 * @param   {object} loanData - Data for the new loan (amountRequested, interestRate, term, termUnit, purpose, collateral)
 * @returns {Promise<object>} The created loan object
 * @throws  {Error} If loan application fails (e.g., user not found, invalid data)
 */
const applyForLoan = async (borrowerId, loanData) => {
    const borrower = await User.findById(borrowerId);
    if (!borrower) {
        throw new Error("Borrower not found");
    }

    // Add borrower to loan data
    const newLoanData = {
        ...loanData,
        borrower: borrowerId,
        status: "pending", // Initial status
    };

    // TODO: Add more validation or business logic here if needed
    // e.g., check if user has outstanding loans, credit score check (pre-ML integration)

    const loan = await Loan.create(newLoanData);
    if (!loan) {
        throw new Error("Loan application failed. Please try again.");
    }
    return loan;
};

/**
 * @desc    Get all loans (e.g., for marketplace or admin view)
 * @param   {object} filters - Optional filters (e.g., status, interestRate range)
 * @param   {object} pagination - Optional pagination (page, limit)
 * @returns {Promise<object>} { loans, totalLoans, page, pages }
 */
const getAllLoans = async (filters = {}, pagination = { page: 1, limit: 10 }) => {
    const { status, minAmount, maxAmount, minInterest, maxInterest } = filters;
    const query = {};

    if (status) query.status = status;
    if (minAmount) query.amountRequested = { ...query.amountRequested, $gte: parseFloat(minAmount) };
    if (maxAmount) query.amountRequested = { ...query.amountRequested, $lte: parseFloat(maxAmount) };
    if (minInterest) query.interestRate = { ...query.interestRate, $gte: parseFloat(minInterest) };
    if (maxInterest) query.interestRate = { ...query.interestRate, $lte: parseFloat(maxInterest) };

    // Only show loans that are pending or funded for the marketplace, for example
    // query.status = { $in: ["pending", "funded"] };

    const page = parseInt(pagination.page, 10) || 1;
    const limit = parseInt(pagination.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const totalLoans = await Loan.countDocuments(query);
    const loans = await Loan.find(query)
        .populate("borrower", "username firstName lastName email") // Populate borrower details
        .populate("lender", "username firstName lastName email") // Populate lender details if funded
        .sort({ applicationDate: -1 }) // Sort by newest first
        .skip(skip)
        .limit(limit);

    return {
        loans,
        totalLoans,
        page,
        pages: Math.ceil(totalLoans / limit),
    };
};

/**
 * @desc    Get loans for a specific user (borrowed or lended)
 * @param   {string} userId - The ID of the user
 * @param   {string} type - Type of loans to fetch ("borrowed" or "lended")
 * @returns {Promise<Array>} Array of loan objects
 */
const getUserLoans = async (userId, type = "borrowed") => {
    const query = {};
    if (type === "borrowed") {
        query.borrower = userId;
    } else if (type === "lended") {
        query.lender = userId;
    } else {
        throw new Error("Invalid loan type specified. Must be \"borrowed\" or \"lended\".");
    }

    const loans = await Loan.find(query)
        .populate("borrower", "username email")
        .populate("lender", "username email")
        .sort({ applicationDate: -1 });
    return loans;
};

/**
 * @desc    Get details of a specific loan by its ID
 * @param   {string} loanId - The ID of the loan
 * @returns {Promise<object>} The loan object
 * @throws  {Error} If loan not found
 */
const getLoanById = async (loanId) => {
    const loan = await Loan.findById(loanId)
        .populate("borrower", "username firstName lastName email kycStatus walletAddress")
        .populate("lender", "username firstName lastName email walletAddress");

    if (!loan) {
        throw new Error("Loan not found");
    }
    return loan;
};

/**
 * @desc    Fund a loan (by a lender)
 * @param   {string} loanId - The ID of the loan to fund
 * @param   {string} lenderId - The ID of the user funding the loan
 * @param   {number} amountToFund - The amount the lender is funding (can be partial or full)
 * @returns {Promise<object>} The updated loan object
 * @throws  {Error} If funding fails (e.g., loan not found, already funded, lender not found)
 */
const fundLoan = async (loanId, lenderId, amountToFund) => {
    const loan = await Loan.findById(loanId);
    if (!loan) {
        throw new Error("Loan not found");
    }
    if (loan.status !== "pending") {
        throw new Error("Loan is not available for funding. Current status: " + loan.status);
    }

    const lender = await User.findById(lenderId);
    if (!lender) {
        throw new Error("Lender not found");
    }
    if (lenderId.toString() === loan.borrower.toString()) {
        throw new Error("Cannot lend to yourself.");
    }

    // Basic check, more complex logic for partial funding can be added
    if (amountToFund < loan.amountRequested - loan.amountFunded) {
        // Partial funding logic can be implemented here if desired
        // For now, let's assume full funding or exact remaining amount
        throw new Error(`Funding amount ${amountToFund} is less than remaining required amount of ${loan.amountRequested - loan.amountFunded}. Partial funding not yet implemented or amount incorrect.`);
    }
    
    // For simplicity, this example assumes one lender funds the full remaining amount.
    // Real-world scenarios might involve multiple lenders or partial funding.
    if (loan.amountFunded + amountToFund > loan.amountRequested) {
        throw new Error("Funding amount exceeds requested amount.");
    }

    loan.lender = lenderId;
    loan.amountFunded += amountToFund;
    loan.fundingDate = new Date();

    if (loan.amountFunded >= loan.amountRequested) {
        loan.status = "funded"; // Or "active" if funds are considered disbursed immediately
        // TODO: Calculate dueDate and repaymentSchedule if not done by smart contract
    }
    
    // TODO: Integrate with blockchain service to trigger smart contract interaction

    await loan.save();
    return loan;
};

/**
 * @desc    Update loan status (e.g., by admin or system events)
 * @param   {string} loanId - The ID of the loan
 * @param   {string} status - The new status for the loan
 * @param   {object} details - Additional details for the update (e.g. smartContractAddress)
 * @returns {Promise<object>} The updated loan object
 * @throws  {Error} If update fails
 */
const updateLoanStatus = async (loanId, status, details = {}) => {
    const loan = await Loan.findById(loanId);
    if (!loan) {
        throw new Error("Loan not found");
    }

    // Add validation for status transitions if necessary
    loan.status = status;
    if (details.smartContractAddress) loan.smartContractAddress = details.smartContractAddress;
    if (status === "active" && !loan.fundingDate) loan.fundingDate = new Date();
    // Add more logic for specific statuses, e.g., calculating repayment schedule when "active"

    await loan.save();
    return loan;
};

/**
 * @desc    Record a repayment for a loan
 * @param   {string} loanId - The ID of the loan
 * @param   {number} installmentNumber - The installment number being paid
 * @param   {number} amountPaid - The amount being paid for this installment
 * @param   {string} paymentDate - Date of payment
 * @returns {Promise<object>} The updated loan object
 * @throws  {Error} If repayment recording fails
 */
const recordRepayment = async (loanId, installmentNumber, amountPaid, paymentDate) => {
    const loan = await Loan.findById(loanId);
    if (!loan) {
        throw new Error("Loan not found");
    }
    if (loan.status !== "active" && loan.status !== "funded") { // Assuming funded means ready for repayment in some contexts
        throw new Error("Loan is not active for repayments.");
    }

    const installment = loan.repaymentSchedule.find(inst => inst.installmentNumber === installmentNumber);
    if (!installment) {
        throw new Error(`Installment #${installmentNumber} not found in repayment schedule.`);
    }
    if (installment.status === "paid") {
        throw new Error(`Installment #${installmentNumber} has already been paid.`);
    }

    installment.amountPaid = (installment.amountPaid || 0) + amountPaid;
    installment.paymentDate = paymentDate ? new Date(paymentDate) : new Date();

    if (installment.amountPaid >= installment.amountDue) {
        installment.status = "paid";
    } else {
        // Partial payment logic if needed
        // installment.status = "partially_paid"; // if you have such a status
    }

    // Check if all installments are paid to update loan status to "repaid"
    const allPaid = loan.repaymentSchedule.every(inst => inst.status === "paid");
    if (allPaid) {
        loan.status = "repaid";
    }

    // TODO: Integrate with blockchain service if repayments are managed via smart contract

    await loan.save();
    return loan;
};

module.exports = {
    applyForLoan,
    getAllLoans,
    getUserLoans,
    getLoanById,
    fundLoan,
    updateLoanStatus,
    recordRepayment,
};
