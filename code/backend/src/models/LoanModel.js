const mongoose = require("mongoose");

const LoanSchema = new mongoose.Schema({
  borrower: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  lender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null, // Can be null if the loan is on the marketplace and not yet funded
  },
  amount: {
    type: Number,
    required: [true, "Please provide the loan amount"],
    min: [0.01, "Loan amount must be greater than 0"],
  },
  interestRate: {
    type: Number,
    required: [true, "Please provide the interest rate"],
    min: [0, "Interest rate cannot be negative"],
    max: [100, "Interest rate seems too high"], // Example validation
  },
  term: {
    type: Number, // e.g., in months or days
    required: [true, "Please provide the loan term"],
    min: [1, "Loan term must be at least 1 unit (e.g., 1 month)"],
  },
  termUnit: {
    type: String,
    enum: ["days", "weeks", "months", "years"],
    default: "months",
  },
  status: {
    type: String,
    enum: [
      "pending_approval", // Borrower applied, waiting for admin/system approval
      "marketplace",      // Approved, listed on marketplace for lenders
      "funded",           // Lender has funded the loan
      "active",           // Loan is active and repayments are ongoing
      "repaid",           // Loan fully repaid
      "defaulted",        // Loan defaulted
      "cancelled",        // Loan application cancelled by borrower
      "rejected",         // Loan application rejected
    ],
    default: "pending_approval",
  },
  purpose: {
    type: String,
    trim: true,
    maxlength: [500, "Purpose description is too long"],
  },
  collateral: {
    type: String, // Description of collateral, or could be a more complex object/schema
    trim: true,
  },
  applicationDate: {
    type: Date,
    default: Date.now,
  },
  approvalDate: { type: Date },
  fundedDate: { type: Date },
  firstPaymentDate: { type: Date },
  maturityDate: { type: Date }, // Calculated based on term and fundedDate
  // Repayment schedule can be an array of objects if needed for more detail
  // repaymentSchedule: [
  //   {
  //     dueDate: Date,
  //     amountDue: Number,
  //     amountPaid: Number,
  //     paymentDate: Date,
  //     status: String, // e.g., pending, paid, overdue
  //   },
  // ],
  // paymentHistory: [ // Simplified history for now
  //   {
  //     date: Date,
  //     amount: Number,
  //     transactionId: String
  //   }
  // ]
});

// Example: Calculate maturityDate before saving if term, termUnit and fundedDate are set
LoanSchema.pre("save", function (next) {
  if (this.isModified("fundedDate") || this.isModified("term") || this.isModified("termUnit")) {
    if (this.fundedDate && this.term && this.termUnit) {
      const funded = new Date(this.fundedDate);
      let maturity = new Date(funded);
      switch (this.termUnit) {
        case "days":
          maturity.setDate(funded.getDate() + this.term);
          break;
        case "weeks":
          maturity.setDate(funded.getDate() + this.term * 7);
          break;
        case "months":
          maturity.setMonth(funded.getMonth() + this.term);
          break;
        case "years":
          maturity.setFullYear(funded.getFullYear() + this.term);
          break;
      }
      this.maturityDate = maturity;
    }
  }
  next();
});

module.exports = mongoose.model("Loan", LoanSchema);

