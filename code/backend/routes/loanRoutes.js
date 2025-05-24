const express = require("express");
const {
    applyLoan,
    getMarketplaceLoans,
    getMyLoans,
    getLoanDetails,
    fundSpecificLoan,
    updateSpecificLoanStatus,
    recordLoanRepayment,
} = require("../controllers/loanController");
const { protect, authorize } = require("../middlewares/authMiddleware"); // Assuming authorize middleware for roles

const router = express.Router();

// Get all loans for the marketplace (public or lender/admin access)
router.get("/", getMarketplaceLoans); // Or protect, authorize(["lender", "admin"]) depending on policy

// Apply for a new loan (borrower only)
router.post("/apply", protect, authorize(["borrower", "user"]), applyLoan); // Allow 'user' if they can become a borrower

// Get loans for the authenticated user (borrowed or lended)
router.get("/my-loans", protect, getMyLoans);

// Get a single loan by ID (public or protected)
router.get("/:id", getLoanDetails);

// Fund a loan (lender only)
router.post("/:id/fund", protect, authorize(["lender", "user"]), fundSpecificLoan);

// Record a repayment for a loan (borrower or system/admin)
router.post("/:id/repay", protect, authorize(["borrower", "admin", "user"]), recordLoanRepayment);

// Update loan status (admin or system - potentially for smart contract events)
router.put("/:id/status", protect, authorize(["admin"]), updateSpecificLoanStatus);

module.exports = router;

