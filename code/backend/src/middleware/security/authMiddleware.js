const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const { logger } = require('../../utils/logger');
const { AppError } = require('../monitoring/errorHandler');

/**
 * Enhanced Authentication Middleware for LendSmart
 * Provides comprehensive authentication, authorization, and security features
 * including JWT management, MFA, session management, and security monitoring
 */
class AuthMiddleware {
    constructor() {
        this.jwtSecret = process.env.JWT_SECRET || this._generateSecureSecret();
        this.jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || this._generateSecureSecret();
        this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '15m';
        this.refreshTokenExpiresIn = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';

        // Token blacklist (in production, use Redis or database)
        this.tokenBlacklist = new Set();
        this.refreshTokens = new Map(); // Store refresh tokens with metadata

        // Rate limiting configurations
        this.authRateLimiter = rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 5, // 5 attempts per window
            message: 'Too many authentication attempts, please try again later',
            standardHeaders: true,
            legacyHeaders: false,
            handler: (req, res) => {
                logger.security.suspiciousActivity(
                    req.body?.email || 'unknown',
                    'auth_rate_limit_exceeded',
                    req.ip,
                    req.get('User-Agent'),
                );
                res.status(429).json({
                    error: 'Too many authentication attempts',
                    retryAfter: Math.round(req.rateLimit.resetTime / 1000),
                });
            },
        });

        this.passwordResetRateLimiter = rateLimit({
            windowMs: 60 * 60 * 1000, // 1 hour
            max: 3, // 3 password reset attempts per hour
            message: 'Too many password reset attempts, please try again later',
        });
    }

    /**
     * Generate secure secret for JWT signing
     * @private
     */
    _generateSecureSecret() {
        return crypto.randomBytes(64).toString('hex');
    }

    /**
     * Hash password with bcrypt
     * @param {string} password - Plain text password
     * @returns {Promise<string>} Hashed password
     */
    async hashPassword(password) {
        try {
            const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
            return await bcrypt.hash(password, saltRounds);
        } catch (error) {
            logger.error('Password hashing failed', { error: error.message });
            throw new AppError('Password processing failed', 500, 'HASH_ERROR');
        }
    }

    /**
     * Verify password against hash
     * @param {string} password - Plain text password
     * @param {string} hash - Hashed password
     * @returns {Promise<boolean>} Verification result
     */
    async verifyPassword(password, hash) {
        try {
            return await bcrypt.compare(password, hash);
        } catch (error) {
            logger.error('Password verification failed', { error: error.message });
            throw new AppError('Password verification failed', 500, 'VERIFY_ERROR');
        }
    }

    /**
     * Generate JWT access token
     * @param {Object} payload - Token payload
     * @param {Object} options - Token options
     * @returns {string} JWT token
     */
    generateAccessToken(payload, options = {}) {
        try {
            const tokenPayload = {
                ...payload,
                type: 'access',
                iat: Math.floor(Date.now() / 1000),
                jti: crypto.randomUUID(), // JWT ID for tracking
            };

            return jwt.sign(tokenPayload, this.jwtSecret, {
                expiresIn: options.expiresIn || this.jwtExpiresIn,
                issuer: 'lendsmart-api',
                audience: 'lendsmart-client',
            });
        } catch (error) {
            logger.error('Access token generation failed', { error: error.message });
            throw new AppError('Token generation failed', 500, 'TOKEN_ERROR');
        }
    }

    /**
     * Generate JWT refresh token
     * @param {Object} payload - Token payload
     * @returns {string} Refresh token
     */
    generateRefreshToken(payload) {
        try {
            const tokenId = crypto.randomUUID();
            const tokenPayload = {
                userId: payload.userId,
                type: 'refresh',
                jti: tokenId,
                iat: Math.floor(Date.now() / 1000),
            };

            const token = jwt.sign(tokenPayload, this.jwtRefreshSecret, {
                expiresIn: this.refreshTokenExpiresIn,
                issuer: 'lendsmart-api',
                audience: 'lendsmart-client',
            });

            // Store refresh token metadata
            this.refreshTokens.set(tokenId, {
                userId: payload.userId,
                createdAt: new Date(),
                lastUsed: new Date(),
                ipAddress: payload.ipAddress,
                userAgent: payload.userAgent,
            });

            return token;
        } catch (error) {
            logger.error('Refresh token generation failed', { error: error.message });
            throw new AppError('Refresh token generation failed', 500, 'TOKEN_ERROR');
        }
    }

    /**
     * Verify JWT token
     * @param {string} token - JWT token
     * @param {string} type - Token type ('access' or 'refresh')
     * @returns {Object} Decoded token payload
     */
    verifyToken(token, type = 'access') {
        try {
            const secret = type === 'refresh' ? this.jwtRefreshSecret : this.jwtSecret;
            const decoded = jwt.verify(token, secret, {
                issuer: 'lendsmart-api',
                audience: 'lendsmart-client',
            });

            // Check if token is blacklisted
            if (this.tokenBlacklist.has(decoded.jti)) {
                throw new AppError('Token has been revoked', 401, 'TOKEN_REVOKED');
            }

            // Verify token type
            if (decoded.type !== type) {
                throw new AppError('Invalid token type', 401, 'INVALID_TOKEN_TYPE');
            }

            return decoded;
        } catch (error) {
            if (error instanceof jwt.JsonWebTokenError) {
                throw new AppError('Invalid token', 401, 'INVALID_TOKEN');
            } else if (error instanceof jwt.TokenExpiredError) {
                throw new AppError('Token expired', 401, 'TOKEN_EXPIRED');
            } else if (error instanceof AppError) {
                throw error;
            } else {
                logger.error('Token verification failed', { error: error.message });
                throw new AppError('Token verification failed', 500, 'TOKEN_ERROR');
            }
        }
    }

    /**
     * Revoke token (add to blacklist)
     * @param {string} tokenId - JWT ID
     */
    revokeToken(tokenId) {
        this.tokenBlacklist.add(tokenId);
        logger.info('Token revoked', { tokenId });
    }

    /**
     * Revoke refresh token
     * @param {string} tokenId - JWT ID
     */
    revokeRefreshToken(tokenId) {
        this.refreshTokens.delete(tokenId);
        this.tokenBlacklist.add(tokenId);
        logger.info('Refresh token revoked', { tokenId });
    }

    /**
     * Revoke all user tokens
     * @param {string} userId - User ID
     */
    revokeAllUserTokens(userId) {
        // Find and revoke all refresh tokens for user
        for (const [tokenId, metadata] of this.refreshTokens.entries()) {
            if (metadata.userId === userId) {
                this.revokeRefreshToken(tokenId);
            }
        }

        logger.info('All user tokens revoked', { userId });
    }

    /**
     * Authentication middleware
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Express next function
     */
    authenticate = async (req, res, next) => {
        try {
            const authHeader = req.headers.authorization;

            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                throw new AppError('Access token required', 401, 'MISSING_TOKEN');
            }

            const token = authHeader.substring(7); // Remove 'Bearer ' prefix
            const decoded = this.verifyToken(token, 'access');

            // Attach user info to request
            req.user = {
                id: decoded.userId,
                email: decoded.email,
                role: decoded.role,
                permissions: decoded.permissions || [],
                tokenId: decoded.jti,
            };

            // Log successful authentication
            logger.info('User authenticated', {
                userId: req.user.id,
                email: req.user.email,
                ip: req.ip,
                userAgent: req.get('User-Agent'),
            });

            next();
        } catch (error) {
            logger.warn('Authentication failed', {
                error: error.message,
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                path: req.path,
            });

            if (error instanceof AppError) {
                return res.status(error.statusCode).json({
                    error: error.message,
                    code: error.code,
                });
            }

            return res.status(401).json({
                error: 'Authentication failed',
                code: 'AUTH_ERROR',
            });
        }
    };

    /**
     * Optional authentication middleware (doesn't fail if no token)
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Express next function
     */
    optionalAuthenticate = async (req, res, next) => {
        try {
            const authHeader = req.headers.authorization;

            if (authHeader && authHeader.startsWith('Bearer ')) {
                const token = authHeader.substring(7);
                const decoded = this.verifyToken(token, 'access');

                req.user = {
                    id: decoded.userId,
                    email: decoded.email,
                    role: decoded.role,
                    permissions: decoded.permissions || [],
                    tokenId: decoded.jti,
                };
            }

            next();
        } catch (error) {
            // For optional auth, we don't fail on invalid tokens
            logger.debug('Optional authentication failed', {
                error: error.message,
                ip: req.ip,
            });
            next();
        }
    };

    /**
     * Authorization middleware factory
     * @param {Array|string} requiredRoles - Required roles
     * @param {Array|string} requiredPermissions - Required permissions
     * @returns {Function} Authorization middleware
     */
    authorize = (requiredRoles = [], requiredPermissions = []) => {
        return (req, res, next) => {
            try {
                if (!req.user) {
                    throw new AppError('Authentication required', 401, 'AUTH_REQUIRED');
                }

                const userRole = req.user.role;
                const userPermissions = req.user.permissions || [];

                // Normalize to arrays
                const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
                const permissions = Array.isArray(requiredPermissions)
                    ? requiredPermissions
                    : [requiredPermissions];

                // Check roles
                if (roles.length > 0 && !roles.includes(userRole)) {
                    logger.warn('Authorization failed - insufficient role', {
                        userId: req.user.id,
                        userRole,
                        requiredRoles: roles,
                        ip: req.ip,
                        path: req.path,
                    });

                    throw new AppError('Insufficient permissions', 403, 'INSUFFICIENT_ROLE');
                }

                // Check permissions
                if (permissions.length > 0) {
                    const hasPermission = permissions.some((permission) =>
                        userPermissions.includes(permission),
                    );

                    if (!hasPermission) {
                        logger.warn('Authorization failed - insufficient permissions', {
                            userId: req.user.id,
                            userPermissions,
                            requiredPermissions: permissions,
                            ip: req.ip,
                            path: req.path,
                        });

                        throw new AppError(
                            'Insufficient permissions',
                            403,
                            'INSUFFICIENT_PERMISSIONS',
                        );
                    }
                }

                // Log successful authorization
                logger.debug('User authorized', {
                    userId: req.user.id,
                    role: userRole,
                    permissions: userPermissions,
                    path: req.path,
                });

                next();
            } catch (error) {
                if (error instanceof AppError) {
                    return res.status(error.statusCode).json({
                        error: error.message,
                        code: error.code,
                    });
                }

                logger.error('Authorization error', { error: error.message });
                return res.status(500).json({
                    error: 'Authorization failed',
                    code: 'AUTHZ_ERROR',
                });
            }
        };
    };

    /**
     * Resource ownership middleware
     * @param {string} resourceIdParam - Parameter name for resource ID
     * @param {Function} ownershipCheck - Function to check ownership
     * @returns {Function} Ownership middleware
     */
    requireOwnership = (resourceIdParam, ownershipCheck) => {
        return async (req, res, next) => {
            try {
                if (!req.user) {
                    throw new AppError('Authentication required', 401, 'AUTH_REQUIRED');
                }

                const resourceId = req.params[resourceIdParam];
                if (!resourceId) {
                    throw new AppError('Resource ID required', 400, 'MISSING_RESOURCE_ID');
                }

                // Check if user is admin (admins can access all resources)
                if (req.user.role === 'admin') {
                    return next();
                }

                // Check ownership
                const isOwner = await ownershipCheck(req.user.id, resourceId);
                if (!isOwner) {
                    logger.warn('Resource access denied - not owner', {
                        userId: req.user.id,
                        resourceId,
                        resourceType: resourceIdParam,
                        ip: req.ip,
                        path: req.path,
                    });

                    throw new AppError(
                        'Access denied - resource not found',
                        404,
                        'RESOURCE_NOT_FOUND',
                    );
                }

                next();
            } catch (error) {
                if (error instanceof AppError) {
                    return res.status(error.statusCode).json({
                        error: error.message,
                        code: error.code,
                    });
                }

                logger.error('Ownership check error', { error: error.message });
                return res.status(500).json({
                    error: 'Access check failed',
                    code: 'OWNERSHIP_ERROR',
                });
            }
        };
    };

    /**
     * Refresh token middleware
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Express next function
     */
    refreshToken = async (req, res, next) => {
        try {
            const { refreshToken } = req.body;

            if (!refreshToken) {
                throw new AppError('Refresh token required', 400, 'MISSING_REFRESH_TOKEN');
            }

            const decoded = this.verifyToken(refreshToken, 'refresh');

            // Check if refresh token exists in our store
            const tokenMetadata = this.refreshTokens.get(decoded.jti);
            if (!tokenMetadata) {
                throw new AppError('Invalid refresh token', 401, 'INVALID_REFRESH_TOKEN');
            }

            // Update last used timestamp
            tokenMetadata.lastUsed = new Date();

            // Generate new access token
            const newAccessToken = this.generateAccessToken({
                userId: decoded.userId,
                email: tokenMetadata.email,
                role: tokenMetadata.role,
                permissions: tokenMetadata.permissions,
            });

            // Optionally rotate refresh token
            let newRefreshToken = refreshToken;
            if (process.env.ROTATE_REFRESH_TOKENS === 'true') {
                // Revoke old refresh token
                this.revokeRefreshToken(decoded.jti);

                // Generate new refresh token
                newRefreshToken = this.generateRefreshToken({
                    userId: decoded.userId,
                    ipAddress: req.ip,
                    userAgent: req.get('User-Agent'),
                });
            }

            logger.info('Token refreshed', {
                userId: decoded.userId,
                ip: req.ip,
                rotated: newRefreshToken !== refreshToken,
            });

            res.json({
                accessToken: newAccessToken,
                refreshToken: newRefreshToken,
                expiresIn: this.jwtExpiresIn,
            });
        } catch (error) {
            logger.warn('Token refresh failed', {
                error: error.message,
                ip: req.ip,
                userAgent: req.get('User-Agent'),
            });

            if (error instanceof AppError) {
                return res.status(error.statusCode).json({
                    error: error.message,
                    code: error.code,
                });
            }

            return res.status(401).json({
                error: 'Token refresh failed',
                code: 'REFRESH_ERROR',
            });
        }
    };

    /**
     * Logout middleware
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Express next function
     */
    logout = async (req, res, next) => {
        try {
            const { refreshToken } = req.body;

            // Revoke access token if user is authenticated
            if (req.user && req.user.tokenId) {
                this.revokeToken(req.user.tokenId);
            }

            // Revoke refresh token if provided
            if (refreshToken) {
                try {
                    const decoded = this.verifyToken(refreshToken, 'refresh');
                    this.revokeRefreshToken(decoded.jti);
                } catch (error) {
                    // Ignore errors for invalid refresh tokens during logout
                    logger.debug('Invalid refresh token during logout', {
                        error: error.message,
                    });
                }
            }

            logger.info('User logged out', {
                userId: req.user?.id,
                ip: req.ip,
            });

            res.json({ message: 'Logged out successfully' });
        } catch (error) {
            logger.error('Logout error', { error: error.message });
            return res.status(500).json({
                error: 'Logout failed',
                code: 'LOGOUT_ERROR',
            });
        }
    };

    /**
     * Get rate limiters
     */
    getRateLimiters() {
        return {
            auth: this.authRateLimiter,
            passwordReset: this.passwordResetRateLimiter,
        };
    }

    /**
     * Clean up expired tokens (should be called periodically)
     */
    cleanupExpiredTokens() {
        const now = new Date();
        const refreshTokenTTL = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

        for (const [tokenId, metadata] of this.refreshTokens.entries()) {
            if (now - metadata.createdAt > refreshTokenTTL) {
                this.refreshTokens.delete(tokenId);
                this.tokenBlacklist.add(tokenId);
            }
        }

        logger.debug('Token cleanup completed', {
            activeRefreshTokens: this.refreshTokens.size,
            blacklistedTokens: this.tokenBlacklist.size,
        });
    }
}

module.exports = new AuthMiddleware();
