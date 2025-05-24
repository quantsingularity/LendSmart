const Loan = require("../models/loanModel");
const User = require("../models/userModel");
const BlockchainService = require("../services/blockchainService");
const NotificationService = require("../services/notificationService");
const mongoose = require("mongoose");

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

    // Validate borrower eligibility
    if (!borrower.kycStatus || borrower.kycStatus !== "verified") {
        throw new Error("KYC verification required before applying for loans");
    }

    // Check if user has too many active loans
    const activeLoans = await Loan.countDocuments({
        borrower: borrowerId,
        status: { $in: ["pending", "funded", "active"] }
    });

    if (activeLoans >= 3) {
        throw new Error("Maximum number of active loans reached (3)");
    }

    // Validate loan data
    if (!loanData.amountRequested || loanData.amountRequested <= 0) {
        throw new Error("Invalid loan amount requested");
    }

    if (!loanData.interestRate || loanData.interestRate < 0) {
        throw new Error("Invalid interest rate");
    }

    if (!loanData.term || loanData.term <= 0) {
        throw new Error("Invalid loan term");
    }

    if (!["days", "weeks", "months", "years"].includes(loanData.termUnit)) {
        throw new Error("Invalid term unit. Must be days, weeks, months, or years");
    }

    // Add borrower to loan data
    const newLoanData = {
        ...loanData,
        borrower: borrowerId,
        status: "pending",
        applicationDate: new Date(),
        amountFunded: 0,
        repaymentSchedule: []
    };

    // Calculate credit score and risk assessment
    try {
        const creditScore = await calculateCreditScore(borrowerId);
        newLoanData.creditScore = creditScore;
        newLoanData.riskLevel = determineRiskLevel(creditScore, loanData.amountRequested);
    } catch (error) {
        console.error("Credit scoring error:", error);
        // Continue without credit score if calculation fails
    }

    // Create loan in database
    const loan = await Loan.create(newLoanData);
    if (!loan) {
        throw new Error("Loan application failed. Please try again.");
    }

    // Notify borrower
    await NotificationService.sendNotification(
        borrowerId,
        "Loan Application Submitted",
        `Your loan application for ${loanData.amountRequested} has been submitted successfully.`
    );

    return loan;
};

/**
 * @desc    Get all loans (e.g., for marketplace or admin view)
 * @param   {object} filters - Optional filters (e.g., status, interestRate range)
 * @param   {object} pagination - Optional pagination (page, limit)
 * @returns {Promise<object>} { loans, totalLoans, page, pages }
 */
const getAllLoans = async (filters = {}, pagination = { page: 1, limit: 10 }) => {
    const { status, minAmount, maxAmount, minInterest, maxInterest, purpose, term, termUnit } = filters;
    const query = {};

    // Apply filters
    if (status) {
        if (Array.isArray(status)) {
            query.status = { $in: status };
        } else {
            query.status = status;
        }
    }
    
    // Amount range filter
    if (minAmount || maxAmount) {
        query.amountRequested = {};
        if (minAmount) query.amountRequested.$gte = parseFloat(minAmount);
        if (maxAmount) query.amountRequested.$lte = parseFloat(maxAmount);
    }
    
    // Interest rate range filter
    if (minInterest || maxInterest) {
        query.interestRate = {};
        if (minInterest) query.interestRate.$gte = parseFloat(minInterest);
        if (maxInterest) query.interestRate.$lte = parseFloat(maxInterest);
    }
    
    // Purpose filter
    if (purpose) query.purpose = purpose;
    
    // Term filters
    if (term) query.term = parseInt(term, 10);
    if (termUnit) query.termUnit = termUnit;

    // Pagination
    const page = parseInt(pagination.page, 10) || 1;
    const limit = parseInt(pagination.limit, 10) || 10;
    const skip = (page - 1) * limit;

    // Execute query with pagination
    const totalLoans = await Loan.countDocuments(query);
    const loans = await Loan.find(query)
        .populate("borrower", "username firstName lastName email profileImage kycStatus creditScore")
        .populate("lender", "username firstName lastName email profileImage")
        .sort({ applicationDate: -1 })
        .skip(skip)
        .limit(limit);

    // Calculate additional metrics for marketplace display
    const loansWithMetrics = loans.map(loan => {
        const loanObj = loan.toObject();
        
        // Calculate time remaining if funded
        if (loan.fundingDate && loan.term && loan.termUnit) {
            loanObj.timeRemaining = calculateTimeRemaining(loan.fundingDate, loan.term, loan.termUnit);
        }
        
        // Calculate funding progress percentage
        if (loan.amountRequested > 0) {
            loanObj.fundingProgress = (loan.amountFunded / loan.amountRequested) * 100;
        }
        
        // Calculate expected return for potential lenders
        if (loan.amountRequested && loan.interestRate && loan.term) {
            loanObj.expectedReturn = calculateExpectedReturn(
                loan.amountRequested, 
                loan.interestRate, 
                loan.term, 
                loan.termUnit
            );
        }
        
        return loanObj;
    });

    return {
        loans: loansWithMetrics,
        totalLoans,
        page,
        pages: Math.ceil(totalLoans / limit),
    };
};

/**
 * @desc    Get loans for a specific user (borrowed or lended)
 * @param   {string} userId - The ID of the user
 * @param   {string} type - Type of loans to fetch ("borrowed" or "lended")
 * @param   {object} filters - Optional filters (e.g., status)
 * @returns {Promise<Array>} Array of loan objects
 */
const getUserLoans = async (userId, type = "borrowed", filters = {}) => {
    const query = {};
    
    // Set user relationship filter
    if (type === "borrowed") {
        query.borrower = mongoose.Types.ObjectId(userId);
    } else if (type === "lended") {
        query.lender = mongoose.Types.ObjectId(userId);
    } else {
        throw new Error("Invalid loan type specified. Must be \"borrowed\" or \"lended\".");
    }
    
    // Apply status filter if provided
    if (filters.status) {
        if (Array.isArray(filters.status)) {
            query.status = { $in: filters.status };
        } else {
            query.status = filters.status;
        }
    }

    // Execute query
    const loans = await Loan.find(query)
        .populate("borrower", "username firstName lastName email profileImage kycStatus")
        .populate("lender", "username firstName lastName email profileImage")
        .sort({ applicationDate: -1 });
    
    // Enhance loan objects with additional information
    const enhancedLoans = loans.map(loan => {
        const loanObj = loan.toObject();
        
        // Add next payment date and amount if applicable
        if (loan.status === "active" && loan.repaymentSchedule && loan.repaymentSchedule.length > 0) {
            const nextPayment = loan.repaymentSchedule.find(payment => 
                payment.status !== "paid" && new Date(payment.dueDate) > new Date()
            );
            
            if (nextPayment) {
                loanObj.nextPaymentDate = nextPayment.dueDate;
                loanObj.nextPaymentAmount = nextPayment.amountDue;
            }
        }
        
        // Calculate repayment progress
        if (loan.repaymentSchedule && loan.repaymentSchedule.length > 0) {
            const totalPayments = loan.repaymentSchedule.length;
            const paidPayments = loan.repaymentSchedule.filter(payment => 
                payment.status === "paid"
            ).length;
            
            loanObj.repaymentProgress = (paidPayments / totalPayments) * 100;
        }
        
        return loanObj;
    });
    
    return enhancedLoans;
};

/**
 * @desc    Get details of a specific loan by its ID
 * @param   {string} loanId - The ID of the loan
 * @returns {Promise<object>} The loan object
 * @throws  {Error} If loan not found
 */
const getLoanById = async (loanId) => {
    const loan = await Loan.findById(loanId)
        .populate("borrower", "username firstName lastName email kycStatus walletAddress profileImage creditScore")
        .populate("lender", "username firstName lastName email walletAddress profileImage");

    if (!loan) {
        throw new Error("Loan not found");
    }
    
    // Get blockchain transaction history if available
    if (loan.smartContractAddress) {
        try {
            const transactionHistory = await BlockchainService.getLoanTransactionHistory(loan.smartContractAddress);
            loan._doc.transactionHistory = transactionHistory;
        } catch (error) {
            console.error("Error fetching blockchain transaction history:", error);
            // Continue without transaction history if fetch fails
        }
    }
    
    // Calculate loan metrics
    const loanObj = loan.toObject();
    
    // Calculate time remaining
    if (loan.fundingDate && loan.term && loan.termUnit) {
        loanObj.timeRemaining = calculateTimeRemaining(loan.fundingDate, loan.term, loan.termUnit);
    }
    
    // Calculate funding progress percentage
    if (loan.amountRequested > 0) {
        loanObj.fundingProgress = (loan.amountFunded / loan.amountRequested) * 100;
    }
    
    // Calculate repayment progress
    if (loan.repaymentSchedule && loan.repaymentSchedule.length > 0) {
        const totalPayments = loan.repaymentSchedule.length;
        const paidPayments = loan.repaymentSchedule.filter(payment => 
            payment.status === "paid"
        ).length;
        
        loanObj.repaymentProgress = (paidPayments / totalPayments) * 100;
    }
    
    return loanObj;
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
    // Start a database transaction
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
        // Find loan and lender with session
        const loan = await Loan.findById(loanId).session(session);
        if (!loan) {
            throw new Error("Loan not found");
        }
        
        if (loan.status !== "pending") {
            throw new Error("Loan is not available for funding. Current status: " + loan.status);
        }

        const lender = await User.findById(lenderId).session(session);
        if (!lender) {
            throw new Error("Lender not found");
        }
        
        // Validate lender
        if (!lender.kycStatus || lender.kycStatus !== "verified") {
            throw new Error("KYC verification required before funding loans");
        }
        
        if (lenderId.toString() === loan.borrower.toString()) {
            throw new Error("Cannot lend to yourself");
        }

        // Validate funding amount
        if (amountToFund <= 0) {
            throw new Error("Funding amount must be greater than zero");
        }
        
        const remainingAmount = loan.amountRequested - loan.amountFunded;
        
        if (amountToFund > remainingAmount) {
            throw new Error(`Funding amount exceeds remaining required amount of ${remainingAmount}`);
        }

        // Update loan with funding information
        loan.lender = lenderId;
        loan.amountFunded += amountToFund;
        loan.fundingDate = new Date();

        // If fully funded, update status and create repayment schedule
        if (loan.amountFunded >= loan.amountRequested) {
            loan.status = "funded";
            
            // Generate repayment schedule
            loan.repaymentSchedule = generateRepaymentSchedule(
                loan.amountRequested,
                loan.interestRate,
                loan.term,
                loan.termUnit,
                loan.fundingDate
            );
            
            // Deploy smart contract if blockchain integration is enabled
            try {
                const contractAddress = await BlockchainService.deployLoanContract(
                    loan.borrower.toString(),
                    loan.lender.toString(),
                    loan.amountRequested,
                    loan.interestRate,
                    loan.term,
                    loan._id.toString()
                );
                
                if (contractAddress) {
                    loan.smartContractAddress = contractAddress;
                }
            } catch (error) {
                console.error("Smart contract deployment error:", error);
                // Continue without smart contract if deployment fails
            }
        }
        
        // Save loan changes
        await loan.save({ session });
        
        // Send notifications
        await NotificationService.sendNotification(
            loan.borrower,
            "Loan Funded",
            `Your loan request for ${loan.amountRequested} has been ${loan.amountFunded >= loan.amountRequested ? 'fully' : 'partially'} funded.`
        );
        
        await NotificationService.sendNotification(
            lenderId,
            "Funding Successful",
            `You have successfully funded a loan for ${amountToFund}.`
        );
        
        // Commit transaction
        await session.commitTransaction();
        
        // Return updated loan
        return await getLoanById(loanId);
        
    } catch (error) {
        // Abort transaction on error
        await session.abortTransaction();
        throw error;
    } finally {
        // End session
        session.endSession();
    }
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
    const validStatuses = ["pending", "funded", "active", "repaid", "defaulted", "cancelled", "rejected"];
    
    if (!validStatuses.includes(status)) {
        throw new Error(`Invalid status. Must be one of: ${validStatuses.join(", ")}`);
    }
    
    const loan = await Loan.findById(loanId);
    if (!loan) {
        throw new Error("Loan not found");
    }

    // Validate status transitions
    const validTransitions = {
        "pending": ["funded", "cancelled", "rejected"],
        "funded": ["active", "cancelled"],
        "active": ["repaid", "defaulted"],
        "repaid": [],
        "defaulted": ["repaid"],
        "cancelled": [],
        "rejected": []
    };
    
    if (!validTransitions[loan.status].includes(status)) {
        throw new Error(`Invalid status transition from ${loan.status} to ${status}`);
    }

    // Update loan status
    loan.status = status;
    
    // Handle additional details
    if (details.smartContractAddress) {
        loan.smartContractAddress = details.smartContractAddress;
    }
    
    if (status === "active" && !loan.fundingDate) {
        loan.fundingDate = new Date();
    }
    
    if (status === "active" && (!loan.repaymentSchedule || loan.repaymentSchedule.length === 0)) {
        // Generate repayment schedule if not already created
        loan.repaymentSchedule = generateRepaymentSchedule(
            loan.amountRequested,
            loan.interestRate,
            loan.term,
            loan.termUnit,
            loan.fundingDate || new Date()
        );
    }
    
    if (status === "repaid") {
        loan.completionDate = new Date();
    }
    
    if (status === "defaulted") {
        loan.defaultDate = new Date();
    }
    
    // Save changes
    await loan.save();
    
    // Send notifications
    if (loan.borrower) {
        await NotificationService.sendNotification(
            loan.borrower,
            `Loan Status Updated`,
            `Your loan has been updated to status: ${status}`
        );
    }
    
    if (loan.lender && ["active", "repaid", "defaulted"].includes(status)) {
        await NotificationService.sendNotification(
            loan.lender,
            `Loan Status Updated`,
            `A loan you funded has been updated to status: ${status}`
        );
    }
    
    return loan;
};

/**
 * @desc    Record a repayment for a loan
 * @param   {string} loanId - The ID of the loan
 * @param   {number} installmentNumber - The installment number being paid
 * @param   {number} amountPaid - The amount being paid for this installment
 * @param   {string} paymentDate - Date of payment
 * @param   {string} transactionHash - Blockchain transaction hash if applicable
 * @returns {Promise<object>} The updated loan object
 * @throws  {Error} If repayment recording fails
 */
const recordRepayment = async (loanId, installmentNumber, amountPaid, paymentDate, transactionHash = null) => {
    // Start a database transaction
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
        const loan = await Loan.findById(loanId).session(session);
        if (!loan) {
            throw new Error("Loan not found");
        }
        
        if (loan.status !== "active" && loan.status !== "funded") {
            throw new Error("Loan is not active for repayments");
        }

        // Find the installment
        if (!loan.repaymentSchedule || loan.repaymentSchedule.length === 0) {
            throw new Error("Loan has no repayment schedule");
        }
        
        const installmentIndex = loan.repaymentSchedule.findIndex(
            inst => inst.installmentNumber === installmentNumber
        );
        
        if (installmentIndex === -1) {
            throw new Error(`Installment #${installmentNumber} not found in repayment schedule`);
        }
        
        const installment = loan.repaymentSchedule[installmentIndex];
        
        if (installment.status === "paid") {
            throw new Error(`Installment #${installmentNumber} has already been paid`);
        }

        // Update installment with payment information
        installment.amountPaid = (installment.amountPaid || 0) + amountPaid;
        installment.paymentDate = paymentDate ? new Date(paymentDate) : new Date();
        
        if (transactionHash) {
            installment.transactionHash = transactionHash;
        }

        // Update installment status
        if (installment.amountPaid >= installment.amountDue) {
            installment.status = "paid";
        } else {
            installment.status = "partially_paid";
        }
        
        // Update loan repayment schedule
        loan.repaymentSchedule[installmentIndex] = installment;

        // Check if all installments are paid to update loan status to "repaid"
        const allPaid = loan.repaymentSchedule.every(inst => inst.status === "paid");
        if (allPaid) {
            loan.status = "repaid";
            loan.completionDate = new Date();
        }

        // Save changes
        await loan.save({ session });
        
        // Send notifications
        await NotificationService.sendNotification(
            loan.borrower,
            "Payment Recorded",
            `Your payment of ${amountPaid} for installment #${installmentNumber} has been recorded.`
        );
        
        if (loan.lender) {
            await NotificationService.sendNotification(
                loan.lender,
                "Payment Received",
                `A payment of ${amountPaid} for installment #${installmentNumber} has been received.`
            );
        }
        
        // If loan is fully repaid, send additional notifications
        if (allPaid) {
            await NotificationService.sendNotification(
                loan.borrower,
                "Loan Fully Repaid",
                "Congratulations! You have fully repaid your loan."
            );
            
            if (loan.lender) {
                await NotificationService.sendNotification(
                    loan.lender,
                    "Loan Fully Repaid",
                    "A loan you funded has been fully repaid."
                );
            }
        }
        
        // Commit transaction
        await session.commitTransaction();
        
        // Return updated loan
        return await getLoanById(loanId);
        
    } catch (error) {
        // Abort transaction on error
        await session.abortTransaction();
        throw error;
    } finally {
        // End session
        session.endSession();
    }
};

/**
 * @desc    Calculate credit score for a user
 * @param   {string} userId - The ID of the user
 * @returns {Promise<number>} Credit score (0-850)
 * @private
 */
const calculateCreditScore = async (userId) => {
    // In a real implementation, this would use the ML model
    // For now, we'll use a simplified calculation based on user history
    
    const user = await User.findById(userId);
    if (!user) {
        throw new Error("User not found");
    }
    
    // Get user's loan history
    const loanHistory = await Loan.find({
        borrower: userId,
        status: { $in: ["repaid", "defaulted"] }
    });
    
    // Base score
    let score = 600;
    
    // Adjust based on KYC status
    if (user.kycStatus === "verified") {
        score += 50;
    }
    
    // Adjust based on account age (months)
    const accountAgeMonths = Math.floor((new Date() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24 * 30));
    score += Math.min(accountAgeMonths * 2, 50);
    
    // Adjust based on repayment history
    const repaidLoans = loanHistory.filter(loan => loan.status === "repaid").length;
    const defaultedLoans = loanHistory.filter(loan => loan.status === "defaulted").length;
    
    score += repaidLoans * 20;
    score -= defaultedLoans * 100;
    
    // Cap score between 300 and 850
    return Math.max(300, Math.min(850, score));
};

/**
 * @desc    Determine risk level based on credit score and loan amount
 * @param   {number} creditScore - User's credit score
 * @param   {number} loanAmount - Requested loan amount
 * @returns {string} Risk level (low, medium, high)
 * @private
 */
const determineRiskLevel = (creditScore, loanAmount) => {
    // Base risk on credit score
    let riskLevel;
    
    if (creditScore >= 700) {
        riskLevel = "low";
    } else if (creditScore >= 600) {
        riskLevel = "medium";
    } else {
        riskLevel = "high";
    }
    
    // Adjust for loan amount
    if (loanAmount > 10000 && riskLevel === "low") {
        riskLevel = "medium";
    } else if (loanAmount > 5000 && riskLevel === "medium") {
        riskLevel = "high";
    }
    
    return riskLevel;
};

/**
 * @desc    Generate repayment schedule for a loan
 * @param   {number} principal - Loan principal amount
 * @param   {number} interestRate - Annual interest rate (percentage)
 * @param   {number} term - Loan term
 * @param   {string} termUnit - Unit of term (days, weeks, months, years)
 * @param   {Date} startDate - Start date for repayments
 * @returns {Array} Array of installment objects
 * @private
 */
const generateRepaymentSchedule = (principal, interestRate, term, termUnit, startDate) => {
    const schedule = [];
    const startDateObj = new Date(startDate);
    
    // Convert term to months for calculation
    let termInMonths;
    switch (termUnit) {
        case "days":
            termInMonths = term / 30;
            break;
        case "weeks":
            termInMonths = term / 4.33;
            break;
        case "months":
            termInMonths = term;
            break;
        case "years":
            termInMonths = term * 12;
            break;
        default:
            throw new Error("Invalid term unit");
    }
    
    // Calculate monthly interest rate
    const monthlyInterestRate = interestRate / 100 / 12;
    
    // Calculate monthly payment (amortization formula)
    const monthlyPayment = principal * monthlyInterestRate * 
        Math.pow(1 + monthlyInterestRate, termInMonths) / 
        (Math.pow(1 + monthlyInterestRate, termInMonths) - 1);
    
    let remainingPrincipal = principal;
    
    // Generate installments
    for (let i = 1; i <= termInMonths; i++) {
        const interestPayment = remainingPrincipal * monthlyInterestRate;
        const principalPayment = monthlyPayment - interestPayment;
        
        // Calculate due date
        const dueDate = new Date(startDateObj);
        dueDate.setMonth(dueDate.getMonth() + i);
        
        // Create installment object
        const installment = {
            installmentNumber: i,
            dueDate: dueDate,
            amountDue: monthlyPayment,
            principalComponent: principalPayment,
            interestComponent: interestPayment,
            status: "pending",
            amountPaid: 0
        };
        
        schedule.push(installment);
        
        // Update remaining principal
        remainingPrincipal -= principalPayment;
    }
    
    return schedule;
};

/**
 * @desc    Calculate time remaining for a loan
 * @param   {Date} startDate - Start date of the loan
 * @param   {number} term - Loan term
 * @param   {string} termUnit - Unit of term (days, weeks, months, years)
 * @returns {object} Object with days, months, years remaining
 * @private
 */
const calculateTimeRemaining = (startDate, term, termUnit) => {
    const startDateObj = new Date(startDate);
    let endDate;
    
    switch (termUnit) {
        case "days":
            endDate = new Date(startDateObj);
            endDate.setDate(endDate.getDate() + term);
            break;
        case "weeks":
            endDate = new Date(startDateObj);
            endDate.setDate(endDate.getDate() + (term * 7));
            break;
        case "months":
            endDate = new Date(startDateObj);
            endDate.setMonth(endDate.getMonth() + term);
            break;
        case "years":
            endDate = new Date(startDateObj);
            endDate.setFullYear(endDate.getFullYear() + term);
            break;
        default:
            throw new Error("Invalid term unit");
    }
    
    const now = new Date();
    const diffTime = endDate - now;
    
    // If loan is already ended
    if (diffTime <= 0) {
        return { days: 0, months: 0, years: 0 };
    }
    
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffMonths / 12);
    
    return {
        days: diffDays,
        months: diffMonths,
        years: diffYears
    };
};

/**
 * @desc    Calculate expected return for a loan
 * @param   {number} principal - Loan principal amount
 * @param   {number} interestRate - Annual interest rate (percentage)
 * @param   {number} term - Loan term
 * @param   {string} termUnit - Unit of term (days, weeks, months, years)
 * @returns {number} Expected return amount
 * @private
 */
const calculateExpectedReturn = (principal, interestRate, term, termUnit) => {
    // Convert term to years for calculation
    let termInYears;
    switch (termUnit) {
        case "days":
            termInYears = term / 365;
            break;
        case "weeks":
            termInYears = term / 52;
            break;
        case "months":
            termInYears = term / 12;
            break;
        case "years":
            termInYears = term;
            break;
        default:
            throw new Error("Invalid term unit");
    }
    
    // Simple interest calculation
    const interest = principal * (interestRate / 100) * termInYears;
    return interest;
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
