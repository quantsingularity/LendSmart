const Joi = require('joi');
const { body, param, query, validationResult } = require('express-validator');
const sanitizeHtml = require('sanitize-html');
const xss = require('xss');
const validator = require('validator');
const logger = require('../utils/logger');

/**
 * Comprehensive input validation and sanitization middleware
 * Implements multiple validation strategies for financial data security
 */

/**
 * Custom Joi extensions for financial validation
 */
const customJoi = Joi.extend({
  type: 'financial',
  base: Joi.number(),
  messages: {
    'financial.currency': '{{#label}} must be a valid currency amount',
    'financial.positive': '{{#label}} must be a positive amount',
    'financial.precision': '{{#label}} must have at most {{#precision}} decimal places'
  },
  rules: {
    currency: {
      method() {
        return this.$_addRule('currency');
      },
      validate(value, helpers) {
        if (value < 0) {
          return helpers.error('financial.positive');
        }
        
        // Check decimal places (max 2 for currency)
        const decimalPlaces = (value.toString().split('.')[1] || '').length;
        if (decimalPlaces > 2) {
          return helpers.error('financial.precision', { precision: 2 });
        }
        
        return value;
      }
    },
    
    interestRate: {
      method() {
        return this.$_addRule('interestRate');
      },
      validate(value, helpers) {
        if (value < 0 || value > 100) {
          return helpers.error('financial.range', { min: 0, max: 100 });
        }
        return value;
      }
    }
  }
});

/**
 * Joi schemas for different data types
 */
const schemas = {
  // User registration schema
  userRegistration: Joi.object({
    username: Joi.string()
      .alphanum()
      .min(3)
      .max(30)
      .required()
      .messages({
        'string.alphanum': 'Username must contain only alphanumeric characters',
        'string.min': 'Username must be at least 3 characters long',
        'string.max': 'Username cannot exceed 30 characters'
      }),
    
    email: Joi.string()
      .email({ tlds: { allow: false } })
      .required()
      .messages({
        'string.email': 'Please provide a valid email address'
      }),
    
    password: Joi.string()
      .min(8)
      .max(128)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .required()
      .messages({
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
      }),
    
    firstName: Joi.string()
      .min(1)
      .max(50)
      .pattern(/^[a-zA-Z\s'-]+$/)
      .required()
      .messages({
        'string.pattern.base': 'First name can only contain letters, spaces, hyphens, and apostrophes'
      }),
    
    lastName: Joi.string()
      .min(1)
      .max(50)
      .pattern(/^[a-zA-Z\s'-]+$/)
      .required()
      .messages({
        'string.pattern.base': 'Last name can only contain letters, spaces, hyphens, and apostrophes'
      }),
    
    phoneNumber: Joi.string()
      .pattern(/^\+?[1-9]\d{1,14}$/)
      .optional()
      .messages({
        'string.pattern.base': 'Please provide a valid phone number'
      }),
    
    dateOfBirth: Joi.date()
      .max('now')
      .min('1900-01-01')
      .optional()
      .messages({
        'date.max': 'Date of birth cannot be in the future',
        'date.min': 'Please provide a valid date of birth'
      })
  }),

  // User login schema
  userLogin: Joi.object({
    email: Joi.string()
      .required()
      .messages({
        'any.required': 'Email or username is required'
      }),
    
    password: Joi.string()
      .required()
      .messages({
        'any.required': 'Password is required'
      }),
    
    mfaToken: Joi.string()
      .length(6)
      .pattern(/^\d{6}$/)
      .optional()
      .messages({
        'string.length': 'MFA token must be 6 digits',
        'string.pattern.base': 'MFA token must contain only numbers'
      })
  }),

  // Loan application schema
  loanApplication: Joi.object({
    amount: customJoi.financial()
      .currency()
      .min(100)
      .max(1000000)
      .required()
      .messages({
        'number.min': 'Loan amount must be at least $100',
        'number.max': 'Loan amount cannot exceed $1,000,000'
      }),
    
    interestRate: customJoi.financial()
      .interestRate()
      .required()
      .messages({
        'number.min': 'Interest rate must be at least 0%',
        'number.max': 'Interest rate cannot exceed 100%'
      }),
    
    term: Joi.number()
      .integer()
      .min(1)
      .max(360)
      .required()
      .messages({
        'number.min': 'Loan term must be at least 1 month',
        'number.max': 'Loan term cannot exceed 360 months'
      }),
    
    termUnit: Joi.string()
      .valid('days', 'weeks', 'months', 'years')
      .default('months'),
    
    purpose: Joi.string()
      .min(10)
      .max(500)
      .required()
      .messages({
        'string.min': 'Please provide a detailed purpose (at least 10 characters)',
        'string.max': 'Purpose description cannot exceed 500 characters'
      }),
    
    collateral: Joi.string()
      .max(1000)
      .optional(),
    
    income: Joi.number()
      .positive()
      .optional(),
    
    employmentStatus: Joi.string()
      .valid('employed', 'self-employed', 'unemployed', 'student', 'retired')
      .optional()
  }),

  // KYC document upload schema
  kycUpload: Joi.object({
    documentType: Joi.string()
      .valid('idProof', 'addressProof', 'selfie', 'incomeProof')
      .required(),
    
    documentNumber: Joi.string()
      .when('documentType', {
        is: 'idProof',
        then: Joi.required(),
        otherwise: Joi.optional()
      })
  }),

  // Payment schema
  payment: Joi.object({
    loanId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        'string.pattern.base': 'Invalid loan ID format'
      }),
    
    amount: customJoi.financial()
      .currency()
      .positive()
      .required(),
    
    paymentMethod: Joi.string()
      .valid('bank_transfer', 'credit_card', 'debit_card', 'crypto', 'ach')
      .required(),
    
    paymentDetails: Joi.object()
      .when('paymentMethod', {
        is: 'bank_transfer',
        then: Joi.object({
          accountNumber: Joi.string().required(),
          routingNumber: Joi.string().required(),
          accountType: Joi.string().valid('checking', 'savings').required()
        }),
        otherwise: Joi.object().optional()
      })
  }),

  // Wallet address schema
  walletAddress: Joi.object({
    address: Joi.string()
      .pattern(/^0x[a-fA-F0-9]{40}$/)
      .required()
      .messages({
        'string.pattern.base': 'Invalid Ethereum wallet address format'
      }),
    
    network: Joi.string()
      .valid('ethereum', 'polygon', 'bsc', 'arbitrum')
      .default('ethereum')
  })
};

/**
 * Express-validator rules for additional validation
 */
const validationRules = {
  // Email validation with domain checking
  email: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .custom(async (email) => {
        // Check for disposable email domains
        const disposableDomains = ['tempmail.org', '10minutemail.com', 'guerrillamail.com'];
        const domain = email.split('@')[1];
        if (disposableDomains.includes(domain)) {
          throw new Error('Disposable email addresses are not allowed');
        }
        return true;
      })
  ],

  // Phone number validation with country code
  phoneNumber: [
    body('phoneNumber')
      .optional()
      .isMobilePhone('any', { strictMode: false })
      .withMessage('Please provide a valid phone number')
  ],

  // SSN validation (for US users)
  ssn: [
    body('ssn')
      .optional()
      .matches(/^\d{3}-?\d{2}-?\d{4}$/)
      .withMessage('Please provide a valid SSN format')
      .custom((ssn) => {
        // Remove hyphens for validation
        const cleanSSN = ssn.replace(/-/g, '');
        
        // Check for invalid patterns
        const invalidPatterns = [
          '000000000', '111111111', '222222222', '333333333',
          '444444444', '555555555', '666666666', '777777777',
          '888888888', '999999999'
        ];
        
        if (invalidPatterns.includes(cleanSSN)) {
          throw new Error('Invalid SSN pattern');
        }
        
        return true;
      })
  ],

  // Credit card validation
  creditCard: [
    body('cardNumber')
      .isCreditCard()
      .withMessage('Please provide a valid credit card number'),
    
    body('expiryDate')
      .matches(/^(0[1-9]|1[0-2])\/\d{2}$/)
      .withMessage('Expiry date must be in MM/YY format')
      .custom((expiryDate) => {
        const [month, year] = expiryDate.split('/');
        const expiry = new Date(2000 + parseInt(year), parseInt(month) - 1);
        const now = new Date();
        
        if (expiry < now) {
          throw new Error('Credit card has expired');
        }
        
        return true;
      }),
    
    body('cvv')
      .matches(/^\d{3,4}$/)
      .withMessage('CVV must be 3 or 4 digits')
  ],

  // Bank account validation
  bankAccount: [
    body('accountNumber')
      .isLength({ min: 8, max: 17 })
      .isNumeric()
      .withMessage('Account number must be 8-17 digits'),
    
    body('routingNumber')
      .isLength({ min: 9, max: 9 })
      .isNumeric()
      .withMessage('Routing number must be exactly 9 digits')
      .custom((routingNumber) => {
        // ABA routing number checksum validation
        const digits = routingNumber.split('').map(Number);
        const checksum = (
          3 * (digits[0] + digits[3] + digits[6]) +
          7 * (digits[1] + digits[4] + digits[7]) +
          1 * (digits[2] + digits[5] + digits[8])
        ) % 10;
        
        if (checksum !== 0) {
          throw new Error('Invalid routing number');
        }
        
        return true;
      })
  ]
};

/**
 * Sanitization functions
 */
const sanitizers = {
  /**
   * Sanitize HTML content
   * @param {string} input - HTML content to sanitize
   * @returns {string} Sanitized HTML
   */
  html: (input) => {
    return sanitizeHtml(input, {
      allowedTags: [],
      allowedAttributes: {},
      disallowedTagsMode: 'discard'
    });
  },

  /**
   * Sanitize for XSS prevention
   * @param {string} input - Input to sanitize
   * @returns {string} XSS-safe string
   */
  xss: (input) => {
    return xss(input, {
      whiteList: {},
      stripIgnoreTag: true,
      stripIgnoreTagBody: ['script']
    });
  },

  /**
   * Sanitize financial amounts
   * @param {string|number} amount - Amount to sanitize
   * @returns {number} Sanitized amount
   */
  amount: (amount) => {
    if (typeof amount === 'string') {
      // Remove currency symbols and commas
      const cleaned = amount.replace(/[$,]/g, '');
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? 0 : Math.round(parsed * 100) / 100;
    }
    return typeof amount === 'number' ? Math.round(amount * 100) / 100 : 0;
  },

  /**
   * Sanitize text input
   * @param {string} input - Text to sanitize
   * @returns {string} Sanitized text
   */
  text: (input) => {
    if (typeof input !== 'string') return '';
    
    // Remove HTML tags and XSS
    let sanitized = sanitizers.html(input);
    sanitized = sanitizers.xss(sanitized);
    
    // Trim whitespace
    sanitized = sanitized.trim();
    
    // Remove multiple spaces
    sanitized = sanitized.replace(/\s+/g, ' ');
    
    return sanitized;
  },

  /**
   * Sanitize phone number
   * @param {string} phone - Phone number to sanitize
   * @returns {string} Sanitized phone number
   */
  phone: (phone) => {
    if (typeof phone !== 'string') return '';
    
    // Remove all non-digit characters except +
    return phone.replace(/[^\d+]/g, '');
  }
};

/**
 * Validation middleware factory
 * @param {string} schemaName - Name of the Joi schema to use
 * @returns {Function} Express middleware
 */
function validateSchema(schemaName) {
  return async (req, res, next) => {
    try {
      const schema = schemas[schemaName];
      if (!schema) {
        return res.status(500).json({
          success: false,
          message: 'Validation schema not found'
        });
      }

      // Validate request body
      const { error, value } = schema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
        convert: true
      });

      if (error) {
        const errors = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          value: detail.context?.value
        }));

        logger.warn('Validation failed', {
          path: req.path,
          errors,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });

        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors
        });
      }

      // Replace request body with validated and sanitized data
      req.body = value;
      next();
    } catch (err) {
      logger.error('Validation middleware error', {
        error: err.message,
        path: req.path
      });
      
      return res.status(500).json({
        success: false,
        message: 'Validation error'
      });
    }
  };
}

/**
 * Express-validator middleware
 * @param {Array} rules - Validation rules
 * @returns {Function} Express middleware
 */
function validateRules(rules) {
  return async (req, res, next) => {
    // Run all validation rules
    await Promise.all(rules.map(rule => rule.run(req)));

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const formattedErrors = errors.array().map(error => ({
        field: error.param,
        message: error.msg,
        value: error.value
      }));

      logger.warn('Express validation failed', {
        path: req.path,
        errors: formattedErrors,
        ip: req.ip
      });

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: formattedErrors
      });
    }

    next();
  };
}

/**
 * Sanitization middleware
 * @param {Array} fields - Fields to sanitize with their sanitizer functions
 * @returns {Function} Express middleware
 */
function sanitizeFields(fields) {
  return (req, res, next) => {
    try {
      for (const { field, sanitizer } of fields) {
        const value = req.body[field];
        if (value !== undefined && value !== null) {
          req.body[field] = sanitizers[sanitizer] ? sanitizers[sanitizer](value) : value;
        }
      }
      next();
    } catch (error) {
      logger.error('Sanitization error', {
        error: error.message,
        path: req.path,
        fields
      });
      next();
    }
  };
}

/**
 * File upload validation
 * @param {Object} options - Upload validation options
 * @returns {Function} Express middleware
 */
function validateFileUpload(options = {}) {
  const {
    allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'],
    maxSize = 5 * 1024 * 1024, // 5MB
    maxFiles = 1
  } = options;

  return (req, res, next) => {
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    const files = Array.isArray(req.files.file) ? req.files.file : [req.files.file];

    if (files.length > maxFiles) {
      return res.status(400).json({
        success: false,
        message: `Maximum ${maxFiles} files allowed`
      });
    }

    for (const file of files) {
      // Check file type
      if (!allowedTypes.includes(file.mimetype)) {
        return res.status(400).json({
          success: false,
          message: `File type ${file.mimetype} not allowed`
        });
      }

      // Check file size
      if (file.size > maxSize) {
        return res.status(400).json({
          success: false,
          message: `File size exceeds ${maxSize / 1024 / 1024}MB limit`
        });
      }

      // Validate file name
      if (!/^[a-zA-Z0-9._-]+$/.test(file.name)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid file name format'
        });
      }
    }

    next();
  };
}

module.exports = {
  schemas,
  validationRules,
  sanitizers,
  validateSchema,
  validateRules,
  sanitizeFields,
  validateFileUpload,
  customJoi
};

