const mongoose = require('mongoose');

const LoanSchema = new mongoose.Schema(
    {
        blockchainId: {
            type: String,
            required: true,
            unique: true,
        },
        borrower: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        lender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        token: {
            type: String,
            required: true,
        },
        principal: {
            type: Number,
            required: true,
        },
        interestRate: {
            type: Number,
            required: true,
        },
        duration: {
            type: Number,
            required: true,
        },
        purpose: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            enum: ['Requested', 'Funded', 'Active', 'Repaid', 'Defaulted', 'Cancelled', 'Rejected'],
            default: 'Requested',
        },
        riskScore: {
            type: Number,
            min: 0,
            max: 100,
        },
        isCollateralized: {
            type: Boolean,
            default: false,
        },
        collateralToken: {
            type: String,
        },
        collateralAmount: {
            type: Number,
        },
        collateralDeposited: {
            type: Boolean,
            default: false,
        },
        repaymentSchedule: {
            type: [Number],
        },
        repaymentAmounts: {
            type: [Number],
        },
        amountRepaid: {
            type: Number,
            default: 0,
        },
        transactionHash: {
            type: String,
        },
        requestedAt: {
            type: Date,
            default: Date.now,
        },
        fundedAt: {
            type: Date,
        },
        disbursedAt: {
            type: Date,
        },
        repaidAt: {
            type: Date,
        },
        defaultedAt: {
            type: Date,
        },
        cancelledAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
    },
);

module.exports = mongoose.model('Loan', LoanSchema);
