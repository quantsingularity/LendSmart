const mongoose = require("mongoose");

const loanSchema = new mongoose.Schema({
    borrower: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Borrower ID is required"],
    },
    lender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null, // Becomes non-null when a lender funds the loan
    },
    amountRequested: {
        type: Number,
        required: [true, "Loan amount is required"],
        min: [1, "Loan amount must be at least 1"],
    },
    amountFunded: {
        type: Number,
        default: 0,
    },
    interestRate: {
        type: Number,
        required: [true, "Interest rate is required"],
        min: [0, "Interest rate cannot be negative"],
        max: [100, "Interest rate seems too high"], // Example validation
    },
    term: {
        type: Number, // Loan term in months or days, define clearly
        required: [true, "Loan term is required"],
        min: [1, "Loan term must be at least 1 unit (e.g., month)"],
    },
    termUnit: {
        type: String,
        enum: ["days", "weeks", "months", "years"],
        default: "months",
        required: true,
    },
    purpose: {
        type: String,
        trim: true,
        required: [true, "Loan purpose is required"],
        maxlength: [500, "Purpose description is too long"],
    },
    status: {
        type: String,
        enum: [
            "pending",        // Newly created, awaiting lender
            "funded",         // Lender has committed funds
            "active",         // Funds disbursed, repayment ongoing
            "repaid",         // Loan fully repaid
            "defaulted",      // Borrower failed to repay
            "cancelled",      // Cancelled by borrower before funding
            "expired",        // Not funded within a certain timeframe
        ],
        default: "pending",
    },
    creditScore: { // Could be populated by the ML model
        type: Number,
        min: [300, "Credit score seems too low"],
        max: [850, "Credit score seems too high"],
    },
    collateral: {
        type: String, // Description of collateral, if any
        trim: true,
    },
    applicationDate: {
        type: Date,
        default: Date.now,
    },
    fundingDate: {
        type: Date,
    },
    dueDate: { // Calculated based on term and fundingDate
        type: Date,
    },
    repaymentSchedule: [
        {
            installmentNumber: Number,
            dueDate: Date,
            amountDue: Number,
            amountPaid: { type: Number, default: 0 },
            status: { type: String, enum: ["pending", "paid", "overdue"], default: "pending" },
            paymentDate: Date,
        },
    ],
    smartContractAddress: { // Address of the loan contract on the blockchain
        type: String,
        trim: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

// Pre-save hook to update `updatedAt` timestamp
loanSchema.pre("save", function (next) {
    this.updatedAt = new Date();
    // Potentially calculate dueDate or repaymentSchedule here if not done elsewhere
    next();
});

// Pre-findOneAndUpdate hook to update `updatedAt` timestamp
loanSchema.pre("findOneAndUpdate", function (next) {
    this.set({ updatedAt: new Date() });
    next();
});

const Loan = mongoose.model("Loan", loanSchema);

module.exports = Loan;

