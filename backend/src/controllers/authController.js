const User = require("../models/UserModel");
const jwt = require("jsonwebtoken");
// const ErrorResponse = require("../utils/errorResponse"); // Example for custom error handling

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d", // Token expiration (e.g., 30 days)
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  const { username, email, password, role, firstName, lastName, walletAddress } = req.body;

  try {
    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      // return next(new ErrorResponse("User already exists", 400));
      return res.status(400).json({ success: false, message: "User already exists with this email" });
    }
    user = await User.findOne({ username });
    if (user) {
      return res.status(400).json({ success: false, message: "User already exists with this username" });
    }

    // Create user
    user = await User.create({
      username,
      email,
      password, // Password will be hashed by pre-save hook in UserModel
      role,
      firstName,
      lastName,
      walletAddress
    });

    const token = generateToken(user._id);

    // Send back user info and token (excluding password)
    // To exclude password even if not selected:false in model, re-fetch or manually build response object
    const userResponse = {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        walletAddress: user.walletAddress,
        createdAt: user.createdAt
    };

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      token,
      user: userResponse,
    });
  } catch (error) {
    console.error("Registration Error:", error);
    // next(error); // Pass to error handling middleware
    res.status(500).json({ success: false, message: "Server error during registration", error: error.message });
  }
};

// @desc    Authenticate user & get token (Login)
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  const { email, password } = req.body;

  // Validate email & password
  if (!email || !password) {
    // return next(new ErrorResponse("Please provide an email and password", 400));
    return res.status(400).json({ success: false, message: "Please provide an email and password" });
  }

  try {
    // Check for user
    const user = await User.findOne({ email }).select("+password"); // Explicitly select password

    if (!user) {
      // return next(new ErrorResponse("Invalid credentials", 401));
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      // return next(new ErrorResponse("Invalid credentials", 401));
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const token = generateToken(user._id);
    
    const userResponse = {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        walletAddress: user.walletAddress,
        createdAt: user.createdAt
    };

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: userResponse,
    });
  } catch (error) {
    console.error("Login Error:", error);
    // next(error);
    res.status(500).json({ success: false, message: "Server error during login", error: error.message });
  }
};

// @desc    Get current logged in user (example protected route)
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  // This route would require authentication middleware to populate req.user
  // For now, assuming req.user is populated by a middleware like: 
  // const decoded = jwt.verify(token, process.env.JWT_SECRET);
  // req.user = await User.findById(decoded.id).select("-password");
  try {
    // req.user will be set by the auth middleware
    if (!req.user) {
        return res.status(401).json({ success: false, message: "Not authorized, user not found" });
    }
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
    }
    res.status(200).json({ success: true, user });
  } catch (error) {
    console.error("GetMe Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

