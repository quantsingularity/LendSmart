const jwt = require("jsonwebtoken");
const User = require("../models/UserModel");
// const ErrorResponse = require("../utils/errorResponse"); // Example for custom error handling

exports.protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    // Set token from Bearer token in header
    token = req.headers.authorization.split(" ")[1];
  } 
  // else if (req.cookies.token) { // Alternative: Set token from cookie
  //   token = req.cookies.token;
  // }

  // Make sure token exists
  if (!token) {
    // return next(new ErrorResponse("Not authorized to access this route", 401));
    return res.status(401).json({ success: false, message: "Not authorized to access this route, no token" });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Add user from payload to request object
    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) {
        // return next(new ErrorResponse("No user found with this id", 404));
        return res.status(404).json({ success: false, message: "No user found with this id" });
    }

    next();
  } catch (err) {
    console.error("Token verification error:", err);
    // return next(new ErrorResponse("Not authorized to access this route", 401));
    return res.status(401).json({ success: false, message: "Not authorized to access this route, token failed" });
  }
};

// Grant access to specific roles (example)
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      // return next(
      //   new ErrorResponse(
      //     `User role ${req.user ? req.user.role : 'none'} is not authorized to access this route`,
      //     403
      //   )
      // );
      return res.status(403).json({ 
        success: false, 
        message: `User role ${req.user ? req.user.role : 'none'} is not authorized to access this route` 
      });
    }
    next();
  };
};

