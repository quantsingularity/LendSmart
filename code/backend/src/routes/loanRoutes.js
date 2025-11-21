const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const {
  getLoans,
  getMyLoans,
  getLoan,
  applyForLoan,
  fundLoan,
  disburseLoan,
  repayLoan,
  cancelLoan,
  createRepaymentSchedule,
  depositCollateral,
  setRiskScore,
  markAsDefaulted,
  getReputationScore,
} = require("../controllers/loanController");

// Public routes
router.get("/", getLoans);
router.get("/:id", getLoan);
router.get("/reputation/:address", getReputationScore);

// Protected routes (require authentication)
router.get("/user/my-loans", protect, getMyLoans);
router.post("/apply", protect, applyForLoan);
router.post("/:id/fund", protect, fundLoan);
router.post("/:id/disburse", protect, disburseLoan);
router.post("/:id/repay", protect, repayLoan);
router.post("/:id/cancel", protect, cancelLoan);
router.post("/:id/schedule", protect, createRepaymentSchedule);
router.post("/:id/collateral", protect, depositCollateral);

// Risk assessor only routes
router.post(
  "/:id/risk",
  protect,
  authorize("risk-assessor", "admin"),
  setRiskScore,
);

// Lender or admin only routes
router.post(
  "/:id/default",
  protect,
  authorize("lender", "admin"),
  markAsDefaulted,
);

module.exports = router;
