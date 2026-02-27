const rateLimit = require("express-rate-limit");
const slowDown = require("express-slow-down");
const { logger } = require("../../utils/logger");

/**
 * Advanced rate limiting middleware with optional Redis backend
 * Implements multiple rate limiting strategies for different endpoints
 * Falls back to memory store if Redis is not available
 */

// Try to use Redis store for rate limiting, fallback to memory store
let redisStore = null;
try {
  const RedisStore = require("rate-limit-redis");
  const redisClient = require("../../config/redis");
  redisStore = new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  });
  console.log("✅ Rate limiting using Redis store");
} catch (error) {
  console.log("⚠️  Rate limiting using memory store (Redis not available)");
  redisStore = undefined; // Use default memory store
}

/**
 * General API rate limiter
 */
const generalLimiter = rateLimit({
  store: redisStore,
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: {
    error: "Too many requests from this IP, please try again later.",
    retryAfter: "15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise IP
    return req.user ? `user:${req.user.id}` : `ip:${req.ip}`;
  },
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === "/health" || req.path === "/api/health";
  },
  handler: (req, res) => {
    logger.warn("Rate limit exceeded", {
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      path: req.path,
      userId: req.user?.id,
    });
    res.status(429).json({
      error: "Too many requests from this IP, please try again later.",
      retryAfter: "15 minutes",
    });
  },
});

/**
 * Strict rate limiter for authentication endpoints
 */
const authLimiter = rateLimit({
  store: redisStore,
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 auth requests per windowMs
  message: {
    error: "Too many authentication attempts, please try again later.",
    retryAfter: "15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `auth:${req.ip}`,
  skipSuccessfulRequests: true, // Don't count successful requests
  handler: (req, res) => {
    logger.warn("Auth rate limit exceeded", {
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      path: req.path,
      body: { email: req.body?.email, username: req.body?.username },
    });
    res.status(429).json({
      error: "Too many authentication attempts, please try again later.",
      retryAfter: "15 minutes",
    });
  },
});

/**
 * Password reset rate limiter
 */
const passwordResetLimiter = rateLimit({
  store: redisStore,
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 password reset requests per hour
  message: {
    error: "Too many password reset attempts, please try again later.",
    retryAfter: "1 hour",
  },
  keyGenerator: (req) => `password-reset:${req.ip}`,
  handler: (req, res) => {
    logger.warn("Password reset rate limit exceeded", {
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      email: req.body?.email,
    });
    res.status(429).json({
      error: "Too many password reset attempts, please try again later.",
      retryAfter: "1 hour",
    });
  },
});

/**
 * Loan application rate limiter
 */
const loanApplicationLimiter = rateLimit({
  store: redisStore,
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 10, // Limit each user to 10 loan applications per day
  message: {
    error: "Too many loan applications today, please try again tomorrow.",
    retryAfter: "24 hours",
  },
  keyGenerator: (req) => `loan-app:${req.user?.id || req.ip}`,
  skip: (req) => !req.user, // Only apply to authenticated users
  handler: (req, res) => {
    logger.warn("Loan application rate limit exceeded", {
      userId: req.user?.id,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
    });
    res.status(429).json({
      error: "Too many loan applications today, please try again tomorrow.",
      retryAfter: "24 hours",
    });
  },
});

/**
 * File upload rate limiter
 */
const uploadLimiter = rateLimit({
  store: redisStore,
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // Limit each user to 50 uploads per hour
  message: {
    error: "Too many file uploads, please try again later.",
    retryAfter: "1 hour",
  },
  keyGenerator: (req) => `upload:${req.user?.id || req.ip}`,
  handler: (req, res) => {
    logger.warn("Upload rate limit exceeded", {
      userId: req.user?.id,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
    });
    res.status(429).json({
      error: "Too many file uploads, please try again later.",
      retryAfter: "1 hour",
    });
  },
});

/**
 * API key rate limiter for external integrations
 */
const apiKeyLimiter = rateLimit({
  store: redisStore,
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10000, // Higher limit for API keys
  message: {
    error: "API rate limit exceeded.",
    retryAfter: "1 hour",
  },
  keyGenerator: (req) => `api-key:${req.apiKey?.id || req.ip}`,
  skip: (req) => !req.apiKey,
  handler: (req, res) => {
    logger.warn("API key rate limit exceeded", {
      apiKeyId: req.apiKey?.id,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
    });
    res.status(429).json({
      error: "API rate limit exceeded.",
      retryAfter: "1 hour",
    });
  },
});

/**
 * Slow down middleware for progressive delays
 */
const speedLimiter = slowDown({
  store: redisStore,
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 100, // Allow 100 requests per windowMs without delay
  delayMs: 500, // Add 500ms delay per request after delayAfter
  maxDelayMs: 20000, // Maximum delay of 20 seconds
  keyGenerator: (req) => (req.user ? `user:${req.user.id}` : `ip:${req.ip}`),
});

/**
 * Burst protection for high-frequency requests
 */
const burstLimiter = rateLimit({
  store: redisStore,
  windowMs: 1000, // 1 second
  max: 10, // Maximum 10 requests per second
  message: {
    error: "Request rate too high, please slow down.",
    retryAfter: "1 second",
  },
  keyGenerator: (req) =>
    req.user ? `burst:user:${req.user.id}` : `burst:ip:${req.ip}`,
  handler: (req, res) => {
    logger.warn("Burst limit exceeded", {
      ip: req.ip,
      userId: req.user?.id,
      path: req.path,
    });
    res.status(429).json({
      error: "Request rate too high, please slow down.",
      retryAfter: "1 second",
    });
  },
});

/**
 * Create custom rate limiter with specific configuration
 * @param {Object} options - Rate limiter options
 * @returns {Function} Express middleware
 */
function createCustomLimiter(options) {
  const defaultOptions = {
    store: redisStore,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) =>
      req.user ? `custom:user:${req.user.id}` : `custom:ip:${req.ip}`,
    handler: (req, res) => {
      logger.warn("Custom rate limit exceeded", {
        ip: req.ip,
        userId: req.user?.id,
        path: req.path,
        limit: options.max,
        window: options.windowMs,
      });
      res.status(429).json({
        error: options.message?.error || "Rate limit exceeded",
        retryAfter: options.message?.retryAfter || "Please try again later",
      });
    },
  };

  return rateLimit({ ...defaultOptions, ...options });
}

/**
 * Dynamic rate limiter based on user role
 * @param {Object} limits - Role-based limits
 * @returns {Function} Express middleware
 */
function createRoleLimiter(limits) {
  return (req, res, next) => {
    const userRole = req.user?.role || "guest";
    const limit = limits[userRole] ||
      limits.default || { max: 100, windowMs: 15 * 60 * 1000 };

    const limiter = createCustomLimiter({
      ...limit,
      keyGenerator: (req) => `role:${userRole}:${req.user?.id || req.ip}`,
      message: {
        error: `Rate limit exceeded for ${userRole} role.`,
        retryAfter: Math.ceil(limit.windowMs / 60000) + " minutes",
      },
    });

    return limiter(req, res, next);
  };
}

/**
 * Adaptive rate limiter that adjusts based on system load
 * @param {Object} baseOptions - Base rate limiter options
 * @returns {Function} Express middleware
 */
function createAdaptiveLimiter(baseOptions) {
  return async (req, res, next) => {
    try {
      // Get system metrics (simplified example)
      const systemLoad = await getSystemLoad();

      // Adjust limits based on system load
      let adjustedMax = baseOptions.max;
      if (systemLoad > 0.8) {
        adjustedMax = Math.floor(baseOptions.max * 0.5); // Reduce by 50%
      } else if (systemLoad > 0.6) {
        adjustedMax = Math.floor(baseOptions.max * 0.75); // Reduce by 25%
      }

      const limiter = createCustomLimiter({
        ...baseOptions,
        max: adjustedMax,
        keyGenerator: (req) => `adaptive:${req.user?.id || req.ip}`,
      });

      return limiter(req, res, next);
    } catch (error) {
      // Fallback to base limiter if adaptive logic fails
      const limiter = createCustomLimiter(baseOptions);
      return limiter(req, res, next);
    }
  };
}

/**
 * Get system load (simplified implementation)
 * In production, this would integrate with monitoring systems
 * @returns {number} System load between 0 and 1
 */
async function getSystemLoad() {
  try {
    // This is a simplified example
    // In production, you would integrate with monitoring systems like Prometheus
    const memoryUsage = process.memoryUsage();
    const used = memoryUsage.heapUsed / memoryUsage.heapTotal;
    return Math.min(used, 1);
  } catch (error) {
    return 0.5; // Default moderate load
  }
}

/**
 * Rate limiter for WebSocket connections
 * @param {Object} options - WebSocket rate limiter options
 * @returns {Function} WebSocket middleware
 */
function createWebSocketLimiter(options = {}) {
  const connections = new Map();
  const maxConnections = options.maxConnections || 10;
  const windowMs = options.windowMs || 60000; // 1 minute

  return (ws, req, next) => {
    const key = req.user ? `ws:user:${req.user.id}` : `ws:ip:${req.ip}`;
    const now = Date.now();

    // Clean old connections
    if (connections.has(key)) {
      const userConnections = connections
        .get(key)
        .filter((conn) => now - conn.timestamp < windowMs);
      connections.set(key, userConnections);
    }

    const currentConnections = connections.get(key) || [];

    if (currentConnections.length >= maxConnections) {
      logger.warn("WebSocket rate limit exceeded", {
        ip: req.ip,
        userId: req.user?.id,
        connections: currentConnections.length,
      });

      ws.close(1008, "Rate limit exceeded");
      return;
    }

    // Add new connection
    currentConnections.push({ timestamp: now });
    connections.set(key, currentConnections);

    // Remove connection on close
    ws.on("close", () => {
      const userConnections = connections.get(key) || [];
      const index = userConnections.findIndex((conn) => conn.timestamp === now);
      if (index > -1) {
        userConnections.splice(index, 1);
        connections.set(key, userConnections);
      }
    });

    next();
  };
}

// Export with backward compatibility
module.exports = {
  rateLimiter: {
    globalLimiter: generalLimiter,
    authLimiter: authLimiter,
  },
  generalLimiter,
  authLimiter,
  passwordResetLimiter,
  loanApplicationLimiter,
  uploadLimiter,
  apiKeyLimiter,
  speedLimiter,
  burstLimiter,
  createCustomLimiter,
  createRoleLimiter,
  createAdaptiveLimiter,
  createWebSocketLimiter,
};
