const { getAuditLogger } = require('../compliance/auditLogger');
const logger = require('../utils/logger');

/**
 * Enhanced Error Handler Middleware
 * Provides comprehensive error handling with security, compliance, and audit features
 */
class ErrorHandler {
  constructor() {
    this.auditLogger = getAuditLogger();
    
    // Error codes mapping
    this.errorCodes = {
      // Authentication & Authorization
      'INVALID_CREDENTIALS': { status: 401, message: 'Invalid credentials provided' },
      'TOKEN_EXPIRED': { status: 401, message: 'Authentication token has expired' },
      'TOKEN_INVALID': { status: 401, message: 'Invalid authentication token' },
      'ACCESS_DENIED': { status: 403, message: 'Access denied' },
      'INSUFFICIENT_PERMISSIONS': { status: 403, message: 'Insufficient permissions' },
      
      // Validation
      'VALIDATION_ERROR': { status: 400, message: 'Validation failed' },
      'INVALID_INPUT': { status: 400, message: 'Invalid input provided' },
      'MISSING_REQUIRED_FIELD': { status: 400, message: 'Required field is missing' },
      
      // Business Logic
      'LOAN_NOT_FOUND': { status: 404, message: 'Loan not found' },
      'USER_NOT_FOUND': { status: 404, message: 'User not found' },
      'INSUFFICIENT_FUNDS': { status: 400, message: 'Insufficient funds' },
      'LOAN_ALREADY_FUNDED': { status: 409, message: 'Loan is already funded' },
      'KYC_NOT_VERIFIED': { status: 400, message: 'KYC verification required' },
      
      // Rate Limiting
      'RATE_LIMIT_EXCEEDED': { status: 429, message: 'Rate limit exceeded' },
      'TOO_MANY_REQUESTS': { status: 429, message: 'Too many requests' },
      
      // System
      'INTERNAL_ERROR': { status: 500, message: 'Internal server error' },
      'SERVICE_UNAVAILABLE': { status: 503, message: 'Service temporarily unavailable' },
      'DATABASE_ERROR': { status: 500, message: 'Database operation failed' },
      'EXTERNAL_SERVICE_ERROR': { status: 502, message: 'External service error' },
      
      // Security
      'SECURITY_VIOLATION': { status: 400, message: 'Security violation detected' },
      'SUSPICIOUS_ACTIVITY': { status: 400, message: 'Suspicious activity detected' },
      'ACCOUNT_LOCKED': { status: 423, message: 'Account is locked' },
      
      // Compliance
      'COMPLIANCE_VIOLATION': { status: 400, message: 'Compliance violation' },
      'REGULATORY_RESTRICTION': { status: 403, message: 'Regulatory restriction applies' },
      
      // File Upload
      'FILE_TOO_LARGE': { status: 413, message: 'File size exceeds limit' },
      'INVALID_FILE_TYPE': { status: 400, message: 'Invalid file type' },
      'FILE_UPLOAD_ERROR': { status: 500, message: 'File upload failed' }
    };
  }

  /**
   * Main error handling middleware
   * @param {Error} err - Error object
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Next middleware function
   */
  handleError(err, req, res, next) {
    // Don't handle if response already sent
    if (res.headersSent) {
      return next(err);
    }

    // Extract error information
    const errorInfo = this.extractErrorInfo(err, req);
    
    // Log error
    this.logError(errorInfo, req);
    
    // Audit security-related errors
    if (this.isSecurityError(err)) {
      this.auditSecurityError(errorInfo, req);
    }
    
    // Send error response
    this.sendErrorResponse(res, errorInfo);
  }

  /**
   * Extract error information from error object
   * @param {Error} err - Error object
   * @param {Object} req - Express request object
   * @returns {Object} Error information
   */
  extractErrorInfo(err) {
    let errorCode = 'INTERNAL_ERROR';
    let statusCode = 500;
    let message = 'Internal server error';
    let details = null;
    let stack = null;

    // Handle custom application errors
    if (err.code && this.errorCodes[err.code]) {
      const errorConfig = this.errorCodes[err.code];
      errorCode = err.code;
      statusCode = errorConfig.status;
      message = err.message || errorConfig.message;
      details = err.details;
    }
    // Handle Mongoose validation errors
    else if (err.name === 'ValidationError') {
      errorCode = 'VALIDATION_ERROR';
      statusCode = 400;
      message = 'Validation failed';
      details = this.extractMongooseValidationErrors(err);
    }
    // Handle Mongoose cast errors
    else if (err.name === 'CastError') {
      errorCode = 'INVALID_INPUT';
      statusCode = 400;
      message = `Invalid ${err.path}: ${err.value}`;
    }
    // Handle Mongoose duplicate key errors
    else if (err.code === 11000) {
      errorCode = 'VALIDATION_ERROR';
      statusCode = 409;
      message = 'Duplicate entry';
      details = this.extractDuplicateKeyError(err);
    }
    // Handle JWT errors
    else if (err.name === 'JsonWebTokenError') {
      errorCode = 'TOKEN_INVALID';
      statusCode = 401;
      message = 'Invalid token';
    }
    else if (err.name === 'TokenExpiredError') {
      errorCode = 'TOKEN_EXPIRED';
      statusCode = 401;
      message = 'Token expired';
    }
    // Handle Joi validation errors
    else if (err.isJoi) {
      errorCode = 'VALIDATION_ERROR';
      statusCode = 400;
      message = 'Validation failed';
      details = err.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
    }
    // Handle Multer errors (file upload)
    else if (err.code === 'LIMIT_FILE_SIZE') {
      errorCode = 'FILE_TOO_LARGE';
      statusCode = 413;
      message = 'File size exceeds limit';
    }
    else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      errorCode = 'INVALID_FILE_TYPE';
      statusCode = 400;
      message = 'Unexpected file field';
    }
    // Handle rate limiting errors
    else if (err.status === 429) {
      errorCode = 'RATE_LIMIT_EXCEEDED';
      statusCode = 429;
      message = 'Rate limit exceeded';
    }
    // Handle other HTTP errors
    else if (err.status || err.statusCode) {
      statusCode = err.status || err.statusCode;
      message = err.message || 'HTTP error';
      
      if (statusCode === 400) errorCode = 'INVALID_INPUT';
      else if (statusCode === 401) errorCode = 'INVALID_CREDENTIALS';
      else if (statusCode === 403) errorCode = 'ACCESS_DENIED';
      else if (statusCode === 404) errorCode = 'USER_NOT_FOUND';
      else if (statusCode === 409) errorCode = 'VALIDATION_ERROR';
      else if (statusCode >= 500) errorCode = 'INTERNAL_ERROR';
    }
    // Handle generic errors
    else {
      message = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
      stack = process.env.NODE_ENV !== 'production' ? err.stack : null;
    }

    return {
      errorCode,
      statusCode,
      message,
      details,
      stack,
      timestamp: new Date().toISOString(),
      requestId: req.id || 'unknown'
    };
  }

  /**
   * Extract Mongoose validation errors
   * @param {Error} err - Mongoose validation error
   * @returns {Array} Validation errors
   */
  extractMongooseValidationErrors(err) {
    const errors = [];
    
    for (const field in err.errors) {
      const error = err.errors[field];
      errors.push({
        field,
        message: error.message,
        value: error.value,
        kind: error.kind
      });
    }
    
    return errors;
  }

  /**
   * Extract duplicate key error information
   * @param {Error} err - Duplicate key error
   * @returns {Object} Duplicate key error details
   */
  extractDuplicateKeyError(err) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    
    return {
      field,
      message: `${field} '${value}' already exists`,
      value
    };
  }

  /**
   * Log error with appropriate level
   * @param {Object} errorInfo - Error information
   * @param {Object} req - Express request object
   */
  logError(errorInfo, req) {
    const logData = {
      errorCode: errorInfo.errorCode,
      statusCode: errorInfo.statusCode,
      message: errorInfo.message,
      requestId: errorInfo.requestId,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id,
      timestamp: errorInfo.timestamp
    };

    // Add details for non-production environments
    if (process.env.NODE_ENV !== 'production') {
      logData.details = errorInfo.details;
      logData.stack = errorInfo.stack;
    }

    // Log based on severity
    if (errorInfo.statusCode >= 500) {
      logger.error('Server error', logData);
    } else if (errorInfo.statusCode >= 400) {
      logger.warn('Client error', logData);
    } else {
      logger.info('Request error', logData);
    }
  }

  /**
   * Check if error is security-related
   * @param {Error} err - Error object
   * @returns {boolean} True if security error
   */
  isSecurityError(err) {
    const securityErrorCodes = [
      'INVALID_CREDENTIALS',
      'TOKEN_EXPIRED',
      'TOKEN_INVALID',
      'ACCESS_DENIED',
      'SECURITY_VIOLATION',
      'SUSPICIOUS_ACTIVITY',
      'ACCOUNT_LOCKED'
    ];
    
    return securityErrorCodes.includes(err.code) ||
           err.name === 'JsonWebTokenError' ||
           err.name === 'TokenExpiredError' ||
           (err.status >= 401 && err.status <= 403);
  }

  /**
   * Audit security-related errors
   * @param {Object} errorInfo - Error information
   * @param {Object} req - Express request object
   */
  async auditSecurityError(errorInfo, req) {
    try {
      await this.auditLogger.logSecurityEvent({
        action: 'security_error',
        errorCode: errorInfo.errorCode,
        statusCode: errorInfo.statusCode,
        message: errorInfo.message,
        userId: req.user?.id,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        method: req.method,
        url: req.originalUrl,
        timestamp: errorInfo.timestamp
      });
    } catch (auditError) {
      logger.error('Failed to audit security error', {
        error: auditError.message,
        originalError: errorInfo
      });
    }
  }

  /**
   * Send error response to client
   * @param {Object} res - Express response object
   * @param {Object} errorInfo - Error information
   */
  sendErrorResponse(res, errorInfo) {
    const response = {
      success: false,
      error: {
        code: errorInfo.errorCode,
        message: errorInfo.message,
        timestamp: errorInfo.timestamp,
        requestId: errorInfo.requestId
      }
    };

    // Add details for development environment
    if (process.env.NODE_ENV !== 'production' && errorInfo.details) {
      response.error.details = errorInfo.details;
    }

    // Add stack trace for development environment
    if (process.env.NODE_ENV !== 'production' && errorInfo.stack) {
      response.error.stack = errorInfo.stack;
    }

    res.status(errorInfo.statusCode).json(response);
  }

  /**
   * Handle 404 errors
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Next middleware function
   */
  handleNotFound(req, res, next) {
    const error = new Error(`Route ${req.originalUrl} not found`);
    error.code = 'USER_NOT_FOUND';
    error.status = 404;
    next(error);
  }

  /**
   * Create custom error
   * @param {string} code - Error code
   * @param {string} message - Error message
   * @param {Object} details - Error details
   * @returns {Error} Custom error
   */
  createError(code, message, details = null) {
    const error = new Error(message);
    error.code = code;
    error.details = details;
    return error;
  }

  /**
   * Async error wrapper
   * @param {Function} fn - Async function to wrap
   * @returns {Function} Wrapped function
   */
  asyncHandler(fn) {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }
}

// Create singleton instance
const errorHandler = new ErrorHandler();

// Export middleware functions
module.exports = {
  handleError: errorHandler.handleError.bind(errorHandler),
  handleNotFound: errorHandler.handleNotFound.bind(errorHandler),
  createError: errorHandler.createError.bind(errorHandler),
  asyncHandler: errorHandler.asyncHandler.bind(errorHandler)
};

