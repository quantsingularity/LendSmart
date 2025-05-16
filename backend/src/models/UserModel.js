const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, "Please provide a username"],
    unique: true,
    trim: true,
    minlength: [3, "Username must be at least 3 characters"],
    maxlength: [30, "Username cannot exceed 30 characters"]
  },
  email: {
    type: String,
    required: [true, "Please provide an email"],
    unique: true,
    trim: true,
    lowercase: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      "Please fill a valid email address",
    ],
  },
  password: {
    type: String,
    required: [true, "Please provide a password"],
    minlength: [6, "Password must be at least 6 characters"],
    select: false, // Do not return password by default
  },
  role: {
    type: String,
    enum: ["borrower", "lender", "admin"],
    default: "borrower",
  },
  firstName: { 
    type: String, 
    trim: true 
  },
  lastName: { 
    type: String, 
    trim: true 
  },
  profileImage: {
    type: String,
    default: "default-profile.png"
  },
  walletAddress: { 
    type: String, 
    trim: true, 
    unique: true, 
    sparse: true // sparse allows multiple nulls but unique if value exists
  },
  kycStatus: {
    type: String,
    enum: ["not_started", "pending", "verified", "rejected"],
    default: "not_started"
  },
  kycDocuments: {
    idProof: { type: String },
    addressProof: { type: String },
    selfie: { type: String },
    verificationDate: { type: Date }
  },
  creditScore: {
    type: Number,
    min: 300,
    max: 850,
    default: 600
  },
  phoneNumber: {
    type: String,
    trim: true
  },
  address: {
    street: { type: String },
    city: { type: String },
    state: { type: String },
    zipCode: { type: String },
    country: { type: String }
  },
  dateOfBirth: {
    type: Date
  },
  occupation: {
    type: String
  },
  income: {
    type: Number,
    min: 0
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  emailVerificationExpire: Date,
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  lastLogin: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  preferences: {
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      sms: { type: Boolean, default: false }
    },
    theme: {
      type: String,
      enum: ["light", "dark", "system"],
      default: "system"
    },
    language: {
      type: String,
      default: "en"
    }
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
UserSchema.index({ email: 1, username: 1 });
UserSchema.index({ walletAddress: 1 }, { sparse: true });

// Update the updatedAt field on save
UserSchema.pre("save", function(next) {
  this.updatedAt = Date.now();
  next();
});

// Encrypt password using bcrypt before saving
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare entered password with hashed password in database
UserSchema.methods.matchPassword = async function (enteredPassword) {
  try {
    return await bcrypt.compare(enteredPassword, this.password);
  } catch (error) {
    throw new Error("Password comparison failed");
  }
};

// Method to generate JWT
UserSchema.methods.getSignedJwtToken = function () {
  return jwt.sign(
    { 
      id: this._id,
      role: this.role,
      username: this.username
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRE
    }
  );
};

// Method to generate refresh token
UserSchema.methods.getRefreshToken = function () {
  return jwt.sign(
    { id: this._id },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRE
    }
  );
};

// Generate and hash password reset token
UserSchema.methods.getResetPasswordToken = function () {
  // Generate token
  const resetToken = crypto.randomBytes(20).toString("hex");

  // Hash token and set to resetPasswordToken field
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // Set expire time (10 minutes)
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

// Generate email verification token
UserSchema.methods.getEmailVerificationToken = function () {
  // Generate token
  const verificationToken = crypto.randomBytes(20).toString("hex");

  // Hash token and set to emailVerificationToken field
  this.emailVerificationToken = crypto
    .createHash("sha256")
    .update(verificationToken)
    .digest("hex");

  // Set expire time (24 hours)
  this.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000;

  return verificationToken;
};

// Get full name
UserSchema.virtual("fullName").get(function () {
  return `${this.firstName || ""} ${this.lastName || ""}`.trim() || this.username;
});

// Get user's loan statistics
UserSchema.methods.getLoanStats = async function () {
  const Loan = mongoose.model("Loan");
  
  const stats = {
    totalBorrowed: 0,
    totalLent: 0,
    activeLoans: 0,
    repaidLoans: 0,
    defaultedLoans: 0
  };
  
  // Get loans where user is borrower
  const borrowedLoans = await Loan.find({ borrower: this._id });
  
  // Get loans where user is lender
  const lentLoans = await Loan.find({ lender: this._id });
  
  // Calculate borrowed stats
  borrowedLoans.forEach(loan => {
    if (loan.status === "repaid") {
      stats.repaidLoans++;
    } else if (loan.status === "defaulted") {
      stats.defaultedLoans++;
    } else if (["active", "funded"].includes(loan.status)) {
      stats.activeLoans++;
    }
    
    if (loan.amountRequested) {
      stats.totalBorrowed += loan.amountRequested;
    }
  });
  
  // Calculate lent stats
  lentLoans.forEach(loan => {
    if (loan.amountFunded) {
      stats.totalLent += loan.amountFunded;
    }
  });
  
  return stats;
};

// Method to update user's credit score
UserSchema.methods.updateCreditScore = async function () {
  const Loan = mongoose.model("Loan");
  
  // Base score
  let score = 600;
  
  // Adjust based on KYC status
  if (this.kycStatus === "verified") {
    score += 50;
  }
  
  // Adjust based on account age (months)
  const accountAgeMonths = Math.floor((new Date() - new Date(this.createdAt)) / (1000 * 60 * 60 * 24 * 30));
  score += Math.min(accountAgeMonths * 2, 50);
  
  // Get user's loan history
  const loanHistory = await Loan.find({
    borrower: this._id,
    status: { $in: ["repaid", "defaulted"] }
  });
  
  // Adjust based on repayment history
  const repaidLoans = loanHistory.filter(loan => loan.status === "repaid").length;
  const defaultedLoans = loanHistory.filter(loan => loan.status === "defaulted").length;
  
  score += repaidLoans * 20;
  score -= defaultedLoans * 100;
  
  // Cap score between 300 and 850
  this.creditScore = Math.max(300, Math.min(850, score));
  await this.save();
  
  return this.creditScore;
};

module.exports = mongoose.model("User", UserSchema);
