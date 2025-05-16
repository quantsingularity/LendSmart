const authService = require("../services/authService");
const asyncHandler = require("../middlewares/asyncHandler"); // Assuming you have an asyncHandler middleware

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = asyncHandler(async (req, res, next) => {
    const { username, email, password, firstName, lastName, role, walletAddress } = req.body;

    if (!username || !email || !password) {
        res.status(400);
        throw new Error("Please provide username, email, and password");
    }

    try {
        const { user, token } = await authService.registerUser({
            username,
            email,
            password,
            firstName,
            lastName,
            role,
            walletAddress
        });
        res.status(201).json({
            success: true,
            message: "User registered successfully",
            data: user,
            token,
        });
    } catch (error) {
        res.status(400); // Bad Request
        throw new Error(error.message || "User registration failed");
    }
});

/**
 * @desc    Authenticate user and get token
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = asyncHandler(async (req, res, next) => {
    const { emailOrUsername, password } = req.body;

    if (!emailOrUsername || !password) {
        res.status(400);
        throw new Error("Please provide email/username and password");
    }

    try {
        const { user, token } = await authService.loginUser(emailOrUsername, password);
        res.status(200).json({
            success: true,
            message: "Login successful",
            data: user,
            token,
        });
    } catch (error) {
        res.status(401); // Unauthorized
        throw new Error(error.message || "Invalid credentials");
    }
});

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/me
 * @access  Private (requires token)
 */
const getMe = asyncHandler(async (req, res, next) => {
    // req.user is set by the authMiddleware
    if (!req.user) {
        res.status(401);
        throw new Error("Not authorized, no token or user not found");
    }
    // We can re-fetch or use req.user, for simplicity using req.user if it contains all necessary, non-sensitive info.
    // Or fetch fresh data:
    try {
        const user = await authService.getUserProfile(req.user.id);
        if (!user) {
            res.status(404);
            throw new Error("User not found");
        }
        res.status(200).json({
            success: true,
            data: user,
        });
    } catch (error) {
        res.status(404);
        throw new Error(error.message || "User not found");
    }
});

/**
 * @desc    Update user profile
 * @route   PUT /api/auth/profile
 * @access  Private (requires token)
 */
const updateProfile = asyncHandler(async (req, res, next) => {
    if (!req.user) {
        res.status(401);
        throw new Error("Not authorized");
    }

    try {
        const updatedUser = await authService.updateUserProfile(req.user.id, req.body);
        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            data: updatedUser,
        });
    } catch (error) {
        res.status(400); // Bad Request or other error from service
        throw new Error(error.message || "Profile update failed");
    }
});

// Placeholder for logout if using server-side session invalidation or blocklisting tokens
const logout = asyncHandler(async (req, res, next) => {
    // For JWT, logout is typically handled client-side by deleting the token.
    // If using a token blocklist, implement that logic here.
    res.status(200).json({ success: true, message: "Logout successful (client-side action required)" });
});

module.exports = {
    register,
    login,
    getMe,
    updateProfile,
    logout,
};
