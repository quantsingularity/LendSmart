const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, "Please provide a username"],
    unique: true,
    trim: true,
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
    minlength: 6,
    select: false, // Do not return password by default
  },
  role: {
    type: String,
    enum: ["borrower", "lender", "admin"],
    default: "borrower",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  // Add more fields as necessary, e.g., profile information, wallet address
  firstName: { type: String, trim: true },
  lastName: { type: String, trim: true },
  walletAddress: { type: String, trim: true, unique: true, sparse: true }, // sparse allows multiple nulls but unique if value exists
});

// Encrypt password using bcrypt before saving
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare entered password with hashed password in database
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method to generate JWT (to be implemented in controller or service)
// UserSchema.methods.getSignedJwtToken = function () { ... };

module.exports = mongoose.model("User", UserSchema);

