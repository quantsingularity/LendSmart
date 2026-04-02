const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  getUsersByRole,
  getUserByWalletAddress,
} = require("../controllers/userController");

router.use(protect);
router.use(authorize("admin"));

// Specific routes BEFORE :id to prevent conflicts
router.get("/role/:role", getUsersByRole);
router.get("/wallet/:address", getUserByWalletAddress);

// General CRUD routes
router.route("/").get(getUsers).post(createUser);
router.route("/:id").get(getUser).put(updateUser).delete(deleteUser);

module.exports = router;
