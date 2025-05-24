const User = require("../models/userModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// Generate JWT token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || "1d",
    });
};

/**
 * @desc    Register a new user
 * @param   {object} userData - User data (username, email, password, firstName, lastName, role)
 * @returns {Promise<object>} { user, token }
 * @throws  {Error} If registration fails
 */
const registerUser = async (userData) => {
    const { username, email, password, firstName, lastName, role, walletAddress } = userData;

    // Check if user already exists
    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
        const field = userExists.email === email ? "Email" : "Username";
        throw new Error(`${field} already exists`);
    }

    // Create user
    const user = await User.create({
        username,
        email,
        password,
        firstName,
        lastName,
        role: role || "user",
        walletAddress
    });

    if (user) {
        // Return user data and token (excluding password)
        const userResponse = user.toObject();
        delete userResponse.password;

        return {
            user: userResponse,
            token: generateToken(user._id),
        };
    } else {
        throw new Error("Invalid user data");
    }
};

/**
 * @desc    Authenticate user and get token
 * @param   {string} emailOrUsername - User's email or username
 * @param   {string} password - User's password
 * @returns {Promise<object>} { user, token }
 * @throws  {Error} If login fails
 */
const loginUser = async (emailOrUsername, password) => {
    // Check if user exists by email or username
    const user = await User.findOne({
        $or: [{ email: emailOrUsername }, { username: emailOrUsername }],
    }).select("+password"); // Explicitly select password

    if (user && (await user.comparePassword(password))) {
        // Return user data and token (excluding password)
        const userResponse = user.toObject();
        delete userResponse.password;

        return {
            user: userResponse,
            token: generateToken(user._id),
        };
    } else {
        throw new Error("Invalid credentials");
    }
};

/**
 * @desc    Get user profile by ID
 * @param   {string} userId - User's ID
 * @returns {Promise<object>} User object
 * @throws  {Error} If user not found
 */
const getUserProfile = async (userId) => {
    const user = await User.findById(userId);
    if (!user) {
        throw new Error("User not found");
    }
    return user;
};

/**
 * @desc    Update user profile
 * @param   {string} userId - User's ID
 * @param   {object} updateData - Data to update
 * @returns {Promise<object>} Updated user object
 * @throws  {Error} If update fails or user not found
 */
const updateUserProfile = async (userId, updateData) => {
    // Destructure and remove potentially harmful or unchangeable fields
    const { password, role, kycStatus, ...allowedUpdates } = updateData;

    if (password) {
        throw new Error("Password updates should be handled through a dedicated endpoint.");
    }

    const user = await User.findByIdAndUpdate(userId, allowedUpdates, {
        new: true, // Return the modified document rather than the original
        runValidators: true, // Ensure updates adhere to schema validation
    });

    if (!user) {
        throw new Error("User not found");
    }
    return user;
};

module.exports = {
    registerUser,
    loginUser,
    getUserProfile,
    updateUserProfile,
    generateToken,
};
