const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const { getAuditLogger } = require('../compliance/auditLogger');
const { logger } = require('../utils/logger');

/**
 * Enhanced Rate Limiting Middleware
 * Implements sophisticated rate limiting with different strategies for different endpoints
 */
class RateLimiter {
    constructor() {
        this.auditLogger = getAuditLogger();

        // Redis store for distributed rate limiting (fallback to memory store)
        let store;
        try {
            const RedisStore = require('rate-limit-redis');
            const redisClient = require('../config/redis');
            store = new RedisStore({
                client: redisClient,
                prefix: 'rl:',
            });
        } catch (error) {
            logger.warn('Redis not available for rate limiting, using memory store');
            store = undefined; // Use default memory store
        }

        this.store = store;
    }

    /**
     * Global rate limiter for all API requests
     */
    get globalLimiter() {
        return rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 1000, // Limit each IP to 1000 requests per windowMs
            message: {
                success: false,
                error: {
                    code: 'RATE_LIMIT_EXCEEDED',
                    message: 'Too many requests from this IP, please try again later',
                },
            },
            standardHeaders: true,
            legacyHeaders: false,
            store: this.store,
            keyGenerator: (req) => {
                // Use user ID if authenticated, otherwise IP
                return req.user?.id || req.ip;
            },
            onLimitReached: (req, res, options) => {
                this.logRateLimitViolation(req, 'global', options.max);
            },
        });
    }

    /**
     * Authentication rate limiter (stricter for login/register)
     */
    get authLimiter() {
        return rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 10, // Limit each IP to 10 auth requests per windowMs
            message: {
                success: false,
                error: {
                    code: 'RATE_LIMIT_EXCEEDED',
                    message: 'Too many authentication attempts, please try again later',
                },
            },
            standardHeaders: true,
            legacyHeaders: false,
            store: this.store,
            keyGenerator: (req) => `auth:${req.ip}`,
            onLimitReached: (req, res, options) => {
                this.logRateLimitViolation(req, 'authentication', options.max);
                this.auditSecurityEvent(req, 'auth_rate_limit_exceeded');
            },
        });
    }

    /**
     * Password reset rate limiter
     */
    get passwordResetLimiter() {
        return rateLimit({
            windowMs: 60 * 60 * 1000, // 1 hour
            max: 3, // Limit each IP to 3 password reset requests per hour
            message: {
                success: false,
                error: {
                    code: 'RATE_LIMIT_EXCEEDED',
                    message: 'Too many password reset attempts, please try again later',
                },
            },
            standardHeaders: true,
            legacyHeaders: false,
            store: this.store,
            keyGenerator: (req) => `pwd_reset:${req.ip}`,
            onLimitReached: (req, res, options) => {
                this.logRateLimitViolation(req, 'password_reset', options.max);
                this.auditSecurityEvent(req, 'password_reset_rate_limit_exceeded');
            },
        });
    }

    /**
     * Loan application rate limiter
     */
    get loanApplicationLimiter() {
        return rateLimit({
            windowMs: 24 * 60 * 60 * 1000, // 24 hours
            max: 5, // Limit each user to 5 loan applications per day
            message: {
                success: false,
                error: {
                    code: 'RATE_LIMIT_EXCEEDED',
                    message: 'Too many loan applications today, please try again tomorrow',
                },
            },
            standardHeaders: true,
            legacyHeaders: false,
            store: this.store,
            keyGenerator: (req) => `loan_app:${req.user?.id || req.ip}`,
            onLimitReached: (req, res, options) => {
                this.logRateLimitViolation(req, 'loan_application', options.max);
            },
        });
    }

    /**
     * File upload rate limiter
     */
    get fileUploadLimiter() {
        return rateLimit({
            windowMs: 60 * 60 * 1000, // 1 hour
            max: 20, // Limit each user to 20 file uploads per hour
            message: {
                success: false,
                error: {
                    code: 'RATE_LIMIT_EXCEEDED',
                    message: 'Too many file uploads, please try again later',
                },
            },
            standardHeaders: true,
            legacyHeaders: false,
            store: this.store,
            keyGenerator: (req) => `file_upload:${req.user?.id || req.ip}`,
            onLimitReached: (req, res, options) => {
                this.logRateLimitViolation(req, 'file_upload', options.max);
            },
        });
    }

    /**
     * API key rate limiter (for external API access)
     */
    get apiKeyLimiter() {
        return rateLimit({
            windowMs: 60 * 60 * 1000, // 1 hour
            max: 10000, // Higher limit for API key access
            message: {
                success: false,
                error: {
                    code: 'RATE_LIMIT_EXCEEDED',
                    message: 'API rate limit exceeded',
                },
            },
            standardHeaders: true,
            legacyHeaders: false,
            store: this.store,
            keyGenerator: (req) => `api_key:${req.apiKey || req.ip}`,
            onLimitReached: (req, res, options) => {
                this.logRateLimitViolation(req, 'api_key', options.max);
            },
        });
    }

    /**
     * Slow down middleware for progressive delays
     */
    get progressiveSlowDown() {
        return slowDown({
            windowMs: 15 * 60 * 1000, // 15 minutes
            delayAfter: 100, // Allow 100 requests per windowMs without delay
            delayMs: 500, // Add 500ms delay per request after delayAfter
            maxDelayMs: 20000, // Maximum delay of 20 seconds
            store: this.store,
            keyGenerator: (req) => req.user?.id || req.ip,
            onLimitReached: (req, res, options) => {
                this.logSlowDownActivation(req, options);
            },
        });
    }

    /**
     * Adaptive rate limiter based on user behavior
     */
    createAdaptiveLimiter(baseConfig) {
        return rateLimit({
            ...baseConfig,
            max: (req) => {
                // Increase limits for verified users
                if (req.user?.kycStatus === 'verified') {
                    return Math.floor(baseConfig.max * 1.5);
                }

                // Decrease limits for suspicious users
                if (req.user?.accountStatus === 'suspended') {
                    return Math.floor(baseConfig.max * 0.5);
                }

                return baseConfig.max;
            },
            keyGenerator: (req) => {
                // Different keys for different user types
                const userType = req.user?.role || 'anonymous';
                const identifier = req.user?.id || req.ip;
                return `adaptive:${userType}:${identifier}`;
            },
            store: this.store,
        });
    }

    /**
     * Burst protection for high-frequency endpoints
     */
    get burstProtection() {
        return rateLimit({
            windowMs: 1000, // 1 second
            max: 10, // Maximum 10 requests per second
            message: {
                success: false,
                error: {
                    code: 'RATE_LIMIT_EXCEEDED',
                    message: 'Request rate too high, please slow down',
                },
            },
            standardHeaders: true,
            legacyHeaders: false,
            store: this.store,
            keyGenerator: (req) => `burst:${req.user?.id || req.ip}`,
            onLimitReached: (req, res, options) => {
                this.logRateLimitViolation(req, 'burst_protection', options.max);
            },
        });
    }

    /**
     * Create custom rate limiter
     * @param {Object} config - Rate limiter configuration
     * @returns {Function} Rate limiter middleware
     */
    createCustomLimiter(config) {
        const defaultConfig = {
            windowMs: 15 * 60 * 1000,
            max: 100,
            message: {
                success: false,
                error: {
                    code: 'RATE_LIMIT_EXCEEDED',
                    message: 'Rate limit exceeded',
                },
            },
            standardHeaders: true,
            legacyHeaders: false,
            store: this.store,
        };

        return rateLimit({
            ...defaultConfig,
            ...config,
            onLimitReached: (req, res, options) => {
                this.logRateLimitViolation(req, config.name || 'custom', options.max);
                if (config.onLimitReached) {
                    config.onLimitReached(req, res, options);
                }
            },
        });
    }

    /**
     * IP whitelist middleware
     * @param {Array} whitelist - Array of whitelisted IPs
     * @returns {Function} Middleware function
     */
    createIPWhitelist(whitelist = []) {
        return (req, res, next) => {
            const clientIP = req.ip;

            // Check if IP is whitelisted
            if (whitelist.includes(clientIP)) {
                return next();
            }

            // Check if IP is in CIDR ranges
            for (const range of whitelist) {
                if (this.isIPInRange(clientIP, range)) {
                    return next();
                }
            }

            // Apply rate limiting for non-whitelisted IPs
            return this.globalLimiter(req, res, next);
        };
    }

    /**
     * Check if IP is in CIDR range
     * @param {string} ip - IP address to check
     * @param {string} range - CIDR range
     * @returns {boolean} True if IP is in range
     */
    isIPInRange(ip, range) {
        if (!range.includes('/')) {
            return ip === range;
        }

        try {
            const [rangeIP, prefixLength] = range.split('/');
            const ipInt = this.ipToInt(ip);
            const rangeInt = this.ipToInt(rangeIP);
            const mask = (0xffffffff << (32 - parseInt(prefixLength))) >>> 0;

            return (ipInt & mask) === (rangeInt & mask);
        } catch (error) {
            logger.error('Error checking IP range', {
                error: error.message,
                ip,
                range,
            });
            return false;
        }
    }

    /**
     * Convert IP address to integer
     * @param {string} ip - IP address
     * @returns {number} IP as integer
     */
    ipToInt(ip) {
        return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0) >>> 0;
    }

    /**
     * Log rate limit violation
     * @param {Object} req - Express request object
     * @param {string} limiterType - Type of rate limiter
     * @param {number} limit - Rate limit that was exceeded
     */
    logRateLimitViolation(req, limiterType, limit) {
        logger.warn('Rate limit exceeded', {
            limiterType,
            limit,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            userId: req.user?.id,
            method: req.method,
            url: req.originalUrl,
            timestamp: new Date().toISOString(),
        });
    }

    /**
     * Log slow down activation
     * @param {Object} req - Express request object
     * @param {Object} options - Slow down options
     */
    logSlowDownActivation(req, options) {
        logger.info('Slow down activated', {
            delay: options.delay,
            ip: req.ip,
            userId: req.user?.id,
            method: req.method,
            url: req.originalUrl,
            timestamp: new Date().toISOString(),
        });
    }

    /**
     * Audit security event
     * @param {Object} req - Express request object
     * @param {string} eventType - Type of security event
     */
    async auditSecurityEvent(req, eventType) {
        try {
            await this.auditLogger.logSecurityEvent({
                action: eventType,
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                userId: req.user?.id,
                method: req.method,
                url: req.originalUrl,
                timestamp: new Date().toISOString(),
            });
        } catch (error) {
            logger.error('Failed to audit security event', {
                error: error.message,
                eventType,
            });
        }
    }

    /**
     * Get rate limit status for a key
     * @param {string} key - Rate limit key
     * @returns {Object} Rate limit status
     */
    async getRateLimitStatus(key) {
        if (!this.store || !this.store.get) {
            return { remaining: 'unknown', reset: 'unknown' };
        }

        try {
            const result = await this.store.get(key);
            return {
                remaining: result ? result.remaining : 'unknown',
                reset: result ? result.reset : 'unknown',
            };
        } catch (error) {
            logger.error('Error getting rate limit status', {
                error: error.message,
                key,
            });
            return { remaining: 'error', reset: 'error' };
        }
    }

    /**
     * Reset rate limit for a key
     * @param {string} key - Rate limit key
     * @returns {boolean} Success status
     */
    async resetRateLimit(key) {
        if (!this.store || !this.store.reset) {
            return false;
        }

        try {
            await this.store.reset(key);
            logger.info('Rate limit reset', { key });
            return true;
        } catch (error) {
            logger.error('Error resetting rate limit', {
                error: error.message,
                key,
            });
            return false;
        }
    }
}

// Create singleton instance
const rateLimiter = new RateLimiter();

module.exports = rateLimiter;
