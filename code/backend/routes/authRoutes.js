const express = require("express");
const {
    register,
    login,
    getMe,
    updateProfile,
    logout,
} = require("../controllers/authController");
const { protect } = require("../middlewares/authMiddleware"); // Assuming you will create this middleware

const router = express.Router();

// Public routes
router.post("/register", register);
router.post("/login", login);

// Private routes (require authentication)
router.get("/me", protect, getMe);
router.put("/profile", protect, updateProfile);
router.post("/logout", protect, logout); // Or just client-side, depending on strategy

module.exports = router;

