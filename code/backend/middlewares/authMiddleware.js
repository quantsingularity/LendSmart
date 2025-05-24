const jwt = require("jsonwebtoken");
const asyncHandler = require("./asyncHandler");
const User = require("../models/userModel");

/**
 * @desc    Protect routes by verifying JWT token
 *          Sets req.user with the user object if token is valid
 */
const protect = asyncHandler(async (req, res, next) => {
    let token;

    // Check for token in Authorization header (Bearer token)
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")
    ) {
        try {
            token = req.headers.authorization.split(" ")[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Fetch user by ID from token, excluding password
            req.user = await User.findById(decoded.id).select("-password");

            if (!req.user) {
                res.status(401);
                throw new Error("Not authorized, user not found for this token");
            }
            next();
        } catch (error) {
            console.error("Token verification error:", error.message);
            res.status(401);
            if (error.name === "JsonWebTokenError") {
                throw new Error("Not authorized, token failed (invalid signature or malformed)");
            } else if (error.name === "TokenExpiredError") {
                throw new Error("Not authorized, token expired");
            }
            throw new Error("Not authorized, token failed");
        }
    }

    if (!token) {
        res.status(401);
        throw new Error("Not authorized, no token provided");
    }
});

/**
 * @desc    Grant access to specific roles
 * @param   {...string} roles - List of roles allowed to access the route
 * @returns {Function} Middleware function
 */
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            // This should ideally not happen if `protect` middleware is used before `authorize`
            res.status(401);
            return next(new Error("Not authorized, user not identified"));
        }
        if (!roles.includes(req.user.role)) {
            res.status(403); // Forbidden
            return next(
                new Error(`User role '${req.user.role}' is not authorized to access this route. Allowed roles: ${roles.join(", ")}`)
            );
        }
        next();
    };
};

module.exports = { protect, authorize };

