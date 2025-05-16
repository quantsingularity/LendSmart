const express = require("express");
const router = express.Router({ mergeParams: true }); // mergeParams allows us to access params from parent routers (e.g., /api/users/:userId/loans)

const {
  getLoans,
  getLoanById,
  createLoan,
  updateLoan,
  deleteLoan,
} = require("../controllers/loanController");

const { protect, authorize } = require("../middleware/authMiddleware");

// Route to get all loans or create a new loan
router
  .route("/")
  .get(protect, getLoans) // Protect general access, specific filtering/authorization in controller
  .post(protect, createLoan); // User must be logged in to create a loan

// Route for specific loan by ID
router
  .route("/:id")
  .get(protect, getLoanById) // Protect general access, specific auth in controller
  .put(protect, updateLoan)   // Protect, specific auth (admin, borrower, lender) in controller
  .delete(protect, deleteLoan); // Protect, specific auth (admin, borrower) in controller

module.exports = router;

