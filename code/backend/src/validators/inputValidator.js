const Joi = require("joi");
const validator = require("validator");
const sanitizeHtml = require("sanitize-html");
const { getAuditLogger } = require("../compliance/auditLogger");
const { logger } = require("../utils/logger");

/**
 * Input Validation Service
 * Implements comprehensive input validation, sanitization, and security checks
 */
class InputValidator {
  constructor() {
    this.auditLogger = getAuditLogger();

    // Common validation patterns
    this.patterns = {
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      phone: /^\+?[\d\s\-\(\)]+$/,
      ssn: /^\d{3}-?\d{2}-?\d{4}$/,
      walletAddress: /^0x[a-fA-F0-9]{40}$/,
      username: /^[a-zA-Z0-9_]{3,30}$/,
      strongPassword:
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{8,}$/,
    };

    // Sanitization options
    this.sanitizeOptions = {
      allowedTags: [],
      allowedAttributes: {},
      disallowedTagsMode: "discard",
    };
  }

  /**
   * Validate user registration data
   * @param {Object} data - Registration data
   * @returns {Object} Validation result
   */
  validateRegistration(data) {
    const schema = Joi.object({
      username: Joi.string()
        .pattern(this.patterns.username)
        .min(3)
        .max(30)
        .required()
        .messages({
          "string.pattern.base":
            "Username can only contain letters, numbers, and underscores",
          "string.min": "Username must be at least 3 characters",
          "string.max": "Username cannot exceed 30 characters",
        }),

      email: Joi.string().email().required().messages({
        "string.email": "Please provide a valid email address",
      }),

      password: Joi.string()
        .pattern(this.patterns.strongPassword)
        .min(8)
        .max(128)
        .required()
        .messages({
          "string.pattern.base":
            "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
          "string.min": "Password must be at least 8 characters long",
        }),

      firstName: Joi.string().trim().min(1).max(50).required().messages({
        "string.max": "First name cannot exceed 50 characters",
      }),

      lastName: Joi.string().trim().min(1).max(50).required().messages({
        "string.max": "Last name cannot exceed 50 characters",
      }),

      phoneNumber: Joi.string()
        .pattern(this.patterns.phone)
        .required()
        .messages({
          "string.pattern.base": "Please provide a valid phone number",
        }),

      dateOfBirth: Joi.date().max("now").required().messages({
        "date.max": "Date of birth cannot be in the future",
      }),

      consents: Joi.object({
        essential: Joi.boolean().valid(true).required(),
        financial_services: Joi.boolean().valid(true).required(),
        analytics: Joi.boolean().optional(),
        marketing: Joi.boolean().optional(),
      }).required(),
    });

    return this.validateWithSchema(schema, data, "registration");
  }

  /**
   * Validate user login data
   * @param {Object} data - Login data
   * @returns {Object} Validation result
   */
  validateLogin(data) {
    const schema = Joi.object({
      email: Joi.string().required().messages({
        "any.required": "Email or username is required",
      }),

      password: Joi.string().min(1).required().messages({
        "any.required": "Password is required",
      }),

      mfaToken: Joi.string()
        .pattern(/^\d{6}$/)
        .optional()
        .messages({
          "string.pattern.base": "MFA token must be 6 digits",
        }),

      rememberMe: Joi.boolean().optional(),
    });

    return this.validateWithSchema(schema, data, "login");
  }

  /**
   * Validate loan application data
   * @param {Object} data - Loan application data
   * @returns {Object} Validation result
   */
  validateLoanApplication(data) {
    const schema = Joi.object({
      amount: Joi.number().min(100).max(1000000).required().messages({
        "number.min": "Minimum loan amount is $100",
        "number.max": "Maximum loan amount is $1,000,000",
      }),

      interestRate: Joi.number().min(0.1).max(50).required().messages({
        "number.min": "Interest rate must be at least 0.1%",
        "number.max": "Interest rate cannot exceed 50%",
      }),

      term: Joi.number().min(1).max(360).required().messages({
        "number.min": "Loan term must be at least 1",
        "number.max": "Loan term cannot exceed 360",
      }),

      termUnit: Joi.string()
        .valid("days", "weeks", "months", "years")
        .required()
        .messages({
          "any.only": "Term unit must be days, weeks, months, or years",
        }),

      purpose: Joi.string()
        .valid(
          "debt_consolidation",
          "home_improvement",
          "business",
          "education",
          "medical",
          "auto",
          "personal",
          "investment",
          "emergency",
          "other",
        )
        .required()
        .messages({
          "any.only": "Please select a valid loan purpose",
        }),

      income: Joi.number().min(0).required().messages({
        "number.min": "Income cannot be negative",
      }),

      employmentStatus: Joi.string()
        .valid(
          "full-time",
          "part-time",
          "contract",
          "self-employed",
          "unemployed",
          "student",
          "retired",
        )
        .required()
        .messages({
          "any.only": "Please select a valid employment status",
        }),

      collateral: Joi.object({
        type: Joi.string()
          .valid(
            "none",
            "real_estate",
            "vehicle",
            "securities",
            "crypto",
            "other",
          )
          .required(),
        description: Joi.string().max(500).optional(),
        estimatedValue: Joi.number().min(0).optional(),
      }).optional(),
    });

    return this.validateWithSchema(schema, data, "loan_application");
  }

  /**
   * Validate KYC document upload data
   * @param {Object} data - KYC data
   * @returns {Object} Validation result
   */
  validateKYCDocument(data) {
    const schema = Joi.object({
      documentType: Joi.string()
        .valid(
          "passport",
          "drivers_license",
          "national_id",
          "utility_bill",
          "bank_statement",
        )
        .required()
        .messages({
          "any.only": "Please select a valid document type",
        }),

      documentNumber: Joi.string().trim().min(1).max(50).optional(),

      expiryDate: Joi.date().min("now").optional().messages({
        "date.min": "Document cannot be expired",
      }),

      issuingCountry: Joi.string().length(2).uppercase().optional().messages({
        "string.length": "Country code must be 2 characters",
      }),
    });

    return this.validateWithSchema(schema, data, "kyc_document");
  }

  /**
   * Validate payment data
   * @param {Object} data - Payment data
   * @returns {Object} Validation result
   */
  validatePayment(data) {
    const schema = Joi.object({
      amount: Joi.number().min(0.01).max(1000000).required().messages({
        "number.min": "Amount must be at least $0.01",
        "number.max": "Amount cannot exceed $1,000,000",
      }),

      paymentMethod: Joi.string()
        .valid(
          "bank_transfer",
          "credit_card",
          "debit_card",
          "crypto",
          "check",
          "cash",
        )
        .required()
        .messages({
          "any.only": "Please select a valid payment method",
        }),

      currency: Joi.string().length(3).uppercase().default("USD").messages({
        "string.length": "Currency code must be 3 characters",
      }),

      walletAddress: Joi.when("paymentMethod", {
        is: "crypto",
        then: Joi.string()
          .pattern(this.patterns.walletAddress)
          .required()
          .messages({
            "string.pattern.base":
              "Please provide a valid Ethereum wallet address",
          }),
        otherwise: Joi.optional(),
      }),
    });

    return this.validateWithSchema(schema, data, "payment");
  }

  /**
   * Validate user profile update data
   * @param {Object} data - Profile data
   * @returns {Object} Validation result
   */
  validateProfileUpdate(data) {
    const schema = Joi.object({
      firstName: Joi.string().trim().min(1).max(50).optional(),

      lastName: Joi.string().trim().min(1).max(50).optional(),

      phoneNumber: Joi.string().pattern(this.patterns.phone).optional(),

      address: Joi.object({
        street: Joi.string().trim().max(100).optional(),
        city: Joi.string().trim().max(50).optional(),
        state: Joi.string().trim().max(50).optional(),
        zipCode: Joi.string().trim().max(20).optional(),
        country: Joi.string().length(2).uppercase().optional(),
      }).optional(),

      income: Joi.number().min(0).optional(),

      employmentStatus: Joi.string()
        .valid(
          "full-time",
          "part-time",
          "contract",
          "self-employed",
          "unemployed",
          "student",
          "retired",
        )
        .optional(),

      employer: Joi.string().trim().max(100).optional(),

      walletAddress: Joi.string()
        .pattern(this.patterns.walletAddress)
        .optional()
        .messages({
          "string.pattern.base":
            "Please provide a valid Ethereum wallet address",
        }),
    });

    return this.validateWithSchema(schema, data, "profile_update");
  }

  /**
   * Validate admin actions
   * @param {Object} data - Admin action data
   * @returns {Object} Validation result
   */
  validateAdminAction(data) {
    const schema = Joi.object({
      action: Joi.string()
        .valid(
          "approve_loan",
          "reject_loan",
          "suspend_user",
          "activate_user",
          "update_kyc_status",
        )
        .required(),

      targetId: Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .required()
        .messages({
          "string.pattern.base": "Invalid target ID format",
        }),

      reason: Joi.string().trim().min(10).max(500).required().messages({
        "string.min": "Reason must be at least 10 characters",
        "string.max": "Reason cannot exceed 500 characters",
      }),

      notes: Joi.string().trim().max(1000).optional(),
    });

    return this.validateWithSchema(schema, data, "admin_action");
  }

  /**
   * Validate with Joi schema and perform additional security checks
   * @param {Object} schema - Joi schema
   * @param {Object} data - Data to validate
   * @param {string} context - Validation context for logging
   * @returns {Object} Validation result
   */
  validateWithSchema(schema, data, context) {
    try {
      // Sanitize input data
      const sanitizedData = this.sanitizeInput(data);

      // Validate with Joi schema
      const { error, value } = schema.validate(sanitizedData, {
        abortEarly: false,
        stripUnknown: true,
        convert: true,
      });

      if (error) {
        const validationErrors = error.details.map((detail) => ({
          field: detail.path.join("."),
          message: detail.message,
          value: detail.context?.value,
        }));

        // Log validation failure
        logger.warn("Input validation failed", {
          context,
          errors: validationErrors,
          sanitizedData: this.redactSensitiveData(sanitizedData),
        });

        return {
          isValid: false,
          errors: validationErrors,
          data: null,
        };
      }

      // Perform additional security checks
      const securityCheck = this.performSecurityChecks(value, context);
      if (!securityCheck.passed) {
        // Log security violation
        this.auditLogger.logSecurityEvent({
          action: "input_security_violation",
          context,
          violations: securityCheck.violations,
          data: this.redactSensitiveData(value),
          timestamp: new Date().toISOString(),
        });

        return {
          isValid: false,
          errors: securityCheck.violations.map((v) => ({
            field: v.field,
            message: v.message,
          })),
          data: null,
        };
      }

      return {
        isValid: true,
        errors: [],
        data: value,
      };
    } catch (error) {
      logger.error("Validation error", {
        error: error.message,
        context,
        data: this.redactSensitiveData(data),
      });

      return {
        isValid: false,
        errors: [{ field: "general", message: "Validation failed" }],
        data: null,
      };
    }
  }

  /**
   * Sanitize input data
   * @param {Object} data - Input data
   * @returns {Object} Sanitized data
   */
  sanitizeInput(data) {
    if (typeof data !== "object" || data === null) {
      return data;
    }

    const sanitized = {};

    for (const [key, value] of Object.entries(data)) {
      if (typeof value === "string") {
        // Remove HTML tags and normalize whitespace
        sanitized[key] = sanitizeHtml(value, this.sanitizeOptions).trim();

        // Additional sanitization for specific fields
        if (key === "email") {
          sanitized[key] =
            validator.normalizeEmail(sanitized[key]) || sanitized[key];
        }
      } else if (typeof value === "object" && value !== null) {
        sanitized[key] = this.sanitizeInput(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Perform additional security checks
   * @param {Object} data - Validated data
   * @param {string} context - Validation context
   * @returns {Object} Security check result
   */
  performSecurityChecks(data, context) {
    const violations = [];

    // Check for SQL injection patterns
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/i,
      /(--|\/\*|\*\/|;)/,
      /(\b(OR|AND)\s+\d+\s*=\s*\d+)/i,
    ];

    // Check for XSS patterns
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/i,
      /on\w+\s*=/i,
      /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    ];

    // Check for NoSQL injection patterns
    const nosqlPatterns = [/\$where/i, /\$ne/i, /\$gt/i, /\$lt/i, /\$regex/i];

    this.checkPatterns(data, sqlPatterns, "sql_injection", violations);
    this.checkPatterns(data, xssPatterns, "xss_attempt", violations);
    this.checkPatterns(data, nosqlPatterns, "nosql_injection", violations);

    // Check for excessive data size
    const dataSize = JSON.stringify(data).length;
    if (dataSize > 1024 * 1024) {
      // 1MB limit
      violations.push({
        field: "general",
        type: "data_size_exceeded",
        message: "Request data size exceeds limit",
      });
    }

    // Check for suspicious patterns in specific contexts
    if (context === "registration" || context === "profile_update") {
      this.checkPersonalDataPatterns(data, violations);
    }

    return {
      passed: violations.length === 0,
      violations,
    };
  }

  /**
   * Check for malicious patterns in data
   * @param {Object} data - Data to check
   * @param {Array} patterns - Patterns to check against
   * @param {string} violationType - Type of violation
   * @param {Array} violations - Violations array to populate
   */
  checkPatterns(data, patterns, violationType, violations) {
    const checkValue = (value, field) => {
      if (typeof value === "string") {
        for (const pattern of patterns) {
          if (pattern.test(value)) {
            violations.push({
              field,
              type: violationType,
              message: `Suspicious pattern detected in ${field}`,
            });
            break;
          }
        }
      } else if (typeof value === "object" && value !== null) {
        for (const [subKey, subValue] of Object.entries(value)) {
          checkValue(subValue, `${field}.${subKey}`);
        }
      }
    };

    for (const [key, value] of Object.entries(data)) {
      checkValue(value, key);
    }
  }

  /**
   * Check for suspicious personal data patterns
   * @param {Object} data - Data to check
   * @param {Array} violations - Violations array to populate
   */
  checkPersonalDataPatterns(data, violations) {
    // Check for obviously fake data
    const suspiciousPatterns = [
      /test@test\.com/i,
      /admin@admin\.com/i,
      /fake/i,
      /dummy/i,
      /^(john|jane)\s+(doe|smith)$/i,
      /^(test|admin|user)\d*$/i,
    ];

    if (data.email) {
      for (const pattern of suspiciousPatterns) {
        if (pattern.test(data.email)) {
          violations.push({
            field: "email",
            type: "suspicious_data",
            message: "Suspicious email pattern detected",
          });
          break;
        }
      }
    }

    if (data.firstName && data.lastName) {
      const fullName = `${data.firstName} ${data.lastName}`;
      for (const pattern of suspiciousPatterns) {
        if (pattern.test(fullName)) {
          violations.push({
            field: "name",
            type: "suspicious_data",
            message: "Suspicious name pattern detected",
          });
          break;
        }
      }
    }
  }

  /**
   * Redact sensitive data for logging
   * @param {Object} data - Data to redact
   * @returns {Object} Redacted data
   */
  redactSensitiveData(data) {
    if (typeof data !== "object" || data === null) {
      return data;
    }

    const sensitiveFields = [
      "password",
      "ssn",
      "socialSecurityNumber",
      "creditCardNumber",
      "bankAccountNumber",
      "routingNumber",
      "mfaToken",
      "token",
    ];

    const redacted = { ...data };

    for (const field of sensitiveFields) {
      if (redacted[field]) {
        redacted[field] = "[REDACTED]";
      }
    }

    // Partially redact email and phone
    if (redacted.email) {
      const [local, domain] = redacted.email.split("@");
      redacted.email = `${local.substring(0, 2)}***@${domain}`;
    }

    if (redacted.phoneNumber) {
      redacted.phoneNumber = redacted.phoneNumber.replace(/\d(?=\d{4})/g, "*");
    }

    return redacted;
  }

  /**
   * Validate file upload
   * @param {Object} file - File object
   * @param {Object} options - Validation options
   * @returns {Object} Validation result
   */
  validateFileUpload(file, options = {}) {
    const {
      maxSize = 10 * 1024 * 1024, // 10MB default
      allowedTypes = ["image/jpeg", "image/png", "application/pdf"],
      allowedExtensions = [".jpg", ".jpeg", ".png", ".pdf"],
    } = options;

    const errors = [];

    if (!file) {
      errors.push({ field: "file", message: "File is required" });
      return { isValid: false, errors };
    }

    // Check file size
    if (file.size > maxSize) {
      errors.push({
        field: "file",
        message: `File size exceeds limit of ${Math.round(maxSize / 1024 / 1024)}MB`,
      });
    }

    // Check file type
    if (!allowedTypes.includes(file.mimetype)) {
      errors.push({
        field: "file",
        message: `File type ${file.mimetype} is not allowed`,
      });
    }

    // Check file extension
    const fileExtension = file.originalname
      .toLowerCase()
      .substring(file.originalname.lastIndexOf("."));
    if (!allowedExtensions.includes(fileExtension)) {
      errors.push({
        field: "file",
        message: `File extension ${fileExtension} is not allowed`,
      });
    }

    // Check for suspicious file names
    const suspiciousPatterns = [
      /\.(exe|bat|cmd|scr|pif|com)$/i,
      /\.(php|asp|jsp|js)$/i,
      /<script/i,
      /javascript:/i,
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(file.originalname)) {
        errors.push({
          field: "file",
          message: "Suspicious file name detected",
        });
        break;
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

// Export singleton instance and class
const inputValidator = new InputValidator();

module.exports = inputValidator;
module.exports.InputValidator = InputValidator;
module.exports.inputValidator = inputValidator;
