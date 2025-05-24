const authService = require("../services/authService");
const asyncHandler = require("../middlewares/asyncHandler");
const jwt = require("jsonwebtoken");

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

/**
 * @desc    Logout user and invalidate token
 * @route   POST /api/auth/logout
 * @access  Private (requires token)
 */
const logout = asyncHandler(async (req, res, next) => {
    try {
        // Get token from authorization header
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(200).json({ 
                success: true, 
                message: "No token provided, logout successful" 
            });
        }
        
        // Add token to blocklist in Redis or database
        await authService.invalidateToken(token);
        
        // Clear HTTP-only cookie if using cookies
        if (req.cookies && req.cookies.token) {
            res.clearCookie('token');
        }
        
        res.status(200).json({ 
            success: true, 
            message: "Logout successful, token invalidated" 
        });
    } catch (error) {
        res.status(500);
        throw new Error(error.message || "Logout failed");
    }
});

/**
 * @desc    Refresh access token using refresh token
 * @route   POST /api/auth/refresh-token
 * @access  Public (with refresh token)
 */
const refreshToken = asyncHandler(async (req, res, next) => {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
        res.status(400);
        throw new Error("Refresh token is required");
    }
    
    try {
        const { newAccessToken, newRefreshToken, user } = await authService.refreshUserToken(refreshToken);
        
        res.status(200).json({
            success: true,
            message: "Token refreshed successfully",
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
            data: user
        });
    } catch (error) {
        res.status(401);
        throw new Error(error.message || "Invalid or expired refresh token");
    }
});

/**
 * @desc    Reset password request (sends email)
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
const forgotPassword = asyncHandler(async (req, res, next) => {
    const { email } = req.body;
    
    if (!email) {
        res.status(400);
        throw new Error("Email is required");
    }
    
    try {
        await authService.sendPasswordResetEmail(email);
        
        res.status(200).json({
            success: true,
            message: "Password reset email sent successfully"
        });
    } catch (error) {
        res.status(400);
        throw new Error(error.message || "Failed to send password reset email");
    }
});

/**
 * @desc    Reset password with token
 * @route   POST /api/auth/reset-password/:resetToken
 * @access  Public (with reset token)
 */
const resetPassword = asyncHandler(async (req, res, next) => {
    const { resetToken } = req.params;
    const { password } = req.body;
    
    if (!resetToken || !password) {
        res.status(400);
        throw new Error("Reset token and new password are required");
    }
    
    try {
        await authService.resetUserPassword(resetToken, password);
        
        res.status(200).json({
            success: true,
            message: "Password reset successful"
        });
    } catch (error) {
        res.status(400);
        throw new Error(error.message || "Password reset failed");
    }
});

module.exports = {
    register,
    login,
    getMe,
    updateProfile,
    logout,
    refreshToken,
    forgotPassword,
    resetPassword
};
