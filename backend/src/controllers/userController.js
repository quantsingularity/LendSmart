const User = require("../models/UserModel");
const Loan = require("../models/LoanModel");
// const ErrorResponse = require("../utils/errorResponse");

// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Private/Admin
exports.getUsers = async (req, res, next) => {
  try {
    // Ensure only admin can access
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Not authorized to access this route" });
    }
    const users = await User.find().select("-password");
    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (error) {
    console.error("Get Users Error:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// @desc    Get single user by ID (Admin or the user themselves)
// @route   GET /api/users/:id
// @access  Private
exports.getUserById = async (req, res, next) => {
  try {
    // Admin or the user themselves can access
    if (req.user.role !== "admin" && req.user.id !== req.params.id) {
      return res.status(403).json({ success: false, message: "Not authorized to access this profile" });
    }
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: `User not found with id of ${req.params.id}` });
    }
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error("Get User By ID Error:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// @desc    Update user details (Admin or the user themselves)
// @route   PUT /api/users/:id
// @access  Private
exports.updateUser = async (req, res, next) => {
  try {
    if (req.user.role !== "admin" && req.user.id !== req.params.id) {
      return res.status(403).json({ success: false, message: "Not authorized to update this profile" });
    }

    // Fields that can be updated by user/admin. Admin might have more privileges.
    const { firstName, lastName, email, username, walletAddress } = req.body;
    const updateFields = {};
    if (firstName) updateFields.firstName = firstName;
    if (lastName) updateFields.lastName = lastName;
    if (walletAddress) updateFields.walletAddress = walletAddress;

    // Username and email updates need careful handling due to uniqueness constraints
    if (email && email !== req.user.email) {
        const existingUser = await User.findOne({ email });
        if (existingUser && existingUser._id.toString() !== req.params.id) {
            return res.status(400).json({ success: false, message: "Email already in use" });
        }
        updateFields.email = email;
    }
    if (username && username !== req.user.username) {
        const existingUser = await User.findOne({ username });
        if (existingUser && existingUser._id.toString() !== req.params.id) {
            return res.status(400).json({ success: false, message: "Username already in use" });
        }
        updateFields.username = username;
    }

    // Admin can update role
    if (req.user.role === "admin" && req.body.role) {
      updateFields.role = req.body.role;
    }

    // Password updates should be handled via a separate route (e.g., /api/auth/updatepassword)
    // For simplicity, not including password update here directly.

    const user = await User.findByIdAndUpdate(req.params.id, updateFields, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!user) {
      return res.status(404).json({ success: false, message: `User not found with id of ${req.params.id}` });
    }

    res.status(200).json({ success: true, message: "User updated successfully", data: user });
  } catch (error) {
    console.error("Update User Error:", error);
    if (error.name === "ValidationError") {
        const messages = Object.values(error.errors).map(val => val.message);
        return res.status(400).json({ success: false, message: messages });
    }
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// @desc    Delete user (Admin only)
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Not authorized to delete users" });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: `User not found with id of ${req.params.id}` });
    }

    // Optional: Handle related data (e.g., reassign loans, delete loans, etc.)
    // For now, just deleting the user.
    // await Loan.deleteMany({ borrower: req.params.id });
    // await Loan.updateMany({ lender: req.params.id }, { lender: null }); // Or reassign

    await user.deleteOne();

    res.status(200).json({ success: true, message: "User deleted successfully", data: {} });
  } catch (error) {
    console.error("Delete User Error:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Nested route for user loans (already handled by loanRoutes with mergeParams)
// This controller can be extended with more user-specific functionalities.

