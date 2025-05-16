const express = require("express");
const router = express.Router();

const {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
} = require("../controllers/userController");

const { protect, authorize } = require("../middleware/authMiddleware");

// Import loan routes to nest them under users if needed (e.g., /api/users/:userId/loans)
const loanRoutes = require("./loanRoutes");

// Re-route into other resource routers
// Get loans for a specific user
router.use("/:userId/loans", loanRoutes);

// All routes below are protected and most are admin-only
router.use(protect);

router.route("/").get(authorize("admin"), getUsers);

router
  .route("/:id")
  .get(authorize("admin", "borrower", "lender"), getUserById) // User can get their own profile
  .put(authorize("admin", "borrower", "lender"), updateUser)   // User can update their own profile
  .delete(authorize("admin"), deleteUser);

module.exports = router;

