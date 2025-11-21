const User = require("../models/User");

/**
 * @desc    Get all users
 * @route   GET /api/users
 * @access  Private/Admin
 */
exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find();

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single user
 * @route   GET /api/users/:id
 * @access  Private/Admin
 */
exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create user
 * @route   POST /api/users
 * @access  Private/Admin
 */
exports.createUser = async (req, res, next) => {
  try {
    const { name, email, password, walletAddress, role } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide name, email, and password",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already in use",
      });
    }

    // Check if wallet address is already in use
    if (walletAddress) {
      const walletUser = await User.findOne({ walletAddress });
      if (walletUser) {
        return res.status(400).json({
          success: false,
          message: "Wallet address already in use",
        });
      }
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      walletAddress,
      role,
    });

    res.status(201).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update user
 * @route   PUT /api/users/:id
 * @access  Private/Admin
 */
exports.updateUser = async (req, res, next) => {
  try {
    const fieldsToUpdate = {
      name: req.body.name,
      email: req.body.email,
      role: req.body.role,
    };

    // Only update wallet address if provided
    if (req.body.walletAddress) {
      // Check if wallet address is already in use by another user
      const walletUser = await User.findOne({
        walletAddress: req.body.walletAddress,
        _id: { $ne: req.params.id },
      });

      if (walletUser) {
        return res.status(400).json({
          success: false,
          message: "Wallet address already in use",
        });
      }

      fieldsToUpdate.walletAddress = req.body.walletAddress;
    }

    // Only update password if provided
    if (req.body.password) {
      fieldsToUpdate.password = req.body.password;
    }

    const user = await User.findByIdAndUpdate(req.params.id, fieldsToUpdate, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete user
 * @route   DELETE /api/users/:id
 * @access  Private/Admin
 */
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    await user.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get users by role
 * @route   GET /api/users/role/:role
 * @access  Private/Admin
 */
exports.getUsersByRole = async (req, res, next) => {
  try {
    const { role } = req.params;

    // Validate role
    const validRoles = ["user", "borrower", "lender", "risk-assessor", "admin"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role",
      });
    }

    const users = await User.find({ role });

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get user by wallet address
 * @route   GET /api/users/wallet/:address
 * @access  Private
 */
exports.getUserByWalletAddress = async (req, res, next) => {
  try {
    const { address } = req.params;

    const user = await User.findOne({ walletAddress: address });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};
