const Joi = require('joi');
const { logger } = require('../../utils/logger');
const { AppError } = require('../monitoring/errorHandler');

/**
 * Input Validation Middleware for LendSmart
 * Provides comprehensive input validation using Joi schemas
 * with financial industry specific validations and security measures
 */
class InputValidator {
    constructor() {
        // Common validation patterns
        this.patterns = {
            email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
            phone: /^\+[1-9]\d{1,14}$/, // E.164 format
            ssn: /^\d{3}-\d{2}-\d{4}$/, // US SSN format
            ein: /^\d{2}-\d{7}$/, // US EIN format
            uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
            strongPassword: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
            creditScore: /^[3-8]\d{2}$/, // 300-850 range
            routingNumber: /^\d{9}$/, // US bank routing number
            accountNumber: /^\d{4,17}$/, // Bank account number
        };

        // Custom Joi extensions
        this.joi = Joi.extend(this._createCustomExtensions());
    }

    /**
     * Create custom Joi extensions for financial validations
     * @private
     */
    _createCustomExtensions() {
        return {
            type: 'financial',
            base: Joi.string(),
            messages: {
                'financial.creditScore': 'Credit score must be between 300 and 850',
                'financial.ssn': 'Invalid SSN format (XXX-XX-XXXX)',
                'financial.ein': 'Invalid EIN format (XX-XXXXXXX)',
                'financial.routingNumber': 'Invalid routing number format',
                'financial.accountNumber': 'Invalid account number format',
                'financial.currency': 'Invalid currency amount',
            },
            rules: {
                creditScore: {
                    validate(value, helpers) {
                        const score = parseInt(value);
                        if (isNaN(score) || score < 300 || score > 850) {
                            return helpers.error('financial.creditScore');
                        }
                        return score;
                    },
                },
                ssn: {
                    validate(value, helpers) {
                        if (!this.patterns.ssn.test(value)) {
                            return helpers.error('financial.ssn');
                        }
                        return value;
                    },
                },
                ein: {
                    validate(value, helpers) {
                        if (!this.patterns.ein.test(value)) {
                            return helpers.error('financial.ein');
                        }
                        return value;
                    },
                },
                routingNumber: {
                    validate(value, helpers) {
                        if (!this.patterns.routingNumber.test(value)) {
                            return helpers.error('financial.routingNumber');
                        }
                        // Additional checksum validation for routing numbers
                        if (!this._validateRoutingNumberChecksum(value)) {
                            return helpers.error('financial.routingNumber');
                        }
                        return value;
                    },
                },
                accountNumber: {
                    validate(value, helpers) {
                        if (!this.patterns.accountNumber.test(value)) {
                            return helpers.error('financial.accountNumber');
                        }
                        return value;
                    },
                },
                currency: {
                    validate(value, helpers) {
                        const amount = parseFloat(value);
                        if (isNaN(amount) || amount < 0 || amount > 999999999.99) {
                            return helpers.error('financial.currency');
                        }
                        // Round to 2 decimal places
                        return Math.round(amount * 100) / 100;
                    },
                },
            },
        };
    }

    /**
     * Validate routing number checksum
     * @private
     */
    _validateRoutingNumberChecksum(routingNumber) {
        const digits = routingNumber.split('').map(Number);
        const checksum =
            (3 * (digits[0] + digits[3] + digits[6]) +
                7 * (digits[1] + digits[4] + digits[7]) +
                1 * (digits[2] + digits[5] + digits[8])) %
            10;
        return checksum === 0;
    }

    /**
     * User registration validation schema
     */
    get userRegistrationSchema() {
        return this.joi.object({
            email: this.joi.string().email().required().max(255),
            password: this.joi.string().pattern(this.patterns.strongPassword).required().messages({
                'string.pattern.base':
                    'Password must contain at least 8 characters, including uppercase, lowercase, number, and special character',
            }),
            confirmPassword: this.joi.string().valid(this.joi.ref('password')).required().messages({
                'any.only': 'Passwords do not match',
            }),
            firstName: this.joi.string().trim().min(1).max(50).required(),
            lastName: this.joi.string().trim().min(1).max(50).required(),
            dateOfBirth: this.joi.date().max('now').required(),
            phone: this.joi.string().pattern(this.patterns.phone).required(),
            address: this.joi
                .object({
                    street: this.joi.string().trim().min(1).max(100).required(),
                    city: this.joi.string().trim().min(1).max(50).required(),
                    state: this.joi.string().trim().length(2).required(),
                    zipCode: this.joi
                        .string()
                        .pattern(/^\d{5}(-\d{4})?$/)
                        .required(),
                    country: this.joi.string().trim().length(2).default('US'),
                })
                .required(),
            ssn: this.joi.financial().ssn().required(),
            employmentStatus: this.joi
                .string()
                .valid('employed', 'self_employed', 'unemployed', 'retired', 'student')
                .required(),
            annualIncome: this.joi.financial().currency().min(0).required(),
            agreeToTerms: this.joi.boolean().valid(true).required(),
            agreeToPrivacyPolicy: this.joi.boolean().valid(true).required(),
        });
    }

    /**
     * User login validation schema
     */
    get userLoginSchema() {
        return this.joi.object({
            email: this.joi.string().email().required(),
            password: this.joi.string().required(),
            rememberMe: this.joi.boolean().default(false),
            mfaCode: this.joi
                .string()
                .pattern(/^\d{6}$/)
                .when('mfaRequired', {
                    is: true,
                    then: this.joi.required(),
                    otherwise: this.joi.optional(),
                }),
        });
    }

    /**
     * Loan application validation schema
     */
    get loanApplicationSchema() {
        return this.joi.object({
            amount: this.joi.financial().currency().min(1000).max(500000).required(),
            purpose: this.joi
                .string()
                .valid(
                    'debt_consolidation',
                    'home_improvement',
                    'business',
                    'education',
                    'medical',
                    'auto',
                    'other',
                )
                .required(),
            term: this.joi.number().integer().min(6).max(84).required(), // 6-84 months
            description: this.joi.string().trim().max(500).optional(),
            collateral: this.joi
                .object({
                    type: this.joi
                        .string()
                        .valid('real_estate', 'vehicle', 'securities', 'other')
                        .required(),
                    value: this.joi.financial().currency().min(0).required(),
                    description: this.joi.string().trim().max(200).required(),
                })
                .optional(),
            employmentInfo: this.joi
                .object({
                    employer: this.joi.string().trim().min(1).max(100).required(),
                    position: this.joi.string().trim().min(1).max(100).required(),
                    yearsEmployed: this.joi.number().min(0).max(50).required(),
                    monthlyIncome: this.joi.financial().currency().min(0).required(),
                })
                .required(),
            financialInfo: this.joi
                .object({
                    monthlyExpenses: this.joi.financial().currency().min(0).required(),
                    existingDebt: this.joi.financial().currency().min(0).required(),
                    creditScore: this.joi.financial().creditScore().optional(),
                    bankAccount: this.joi
                        .object({
                            routingNumber: this.joi.financial().routingNumber().required(),
                            accountNumber: this.joi.financial().accountNumber().required(),
                            accountType: this.joi.string().valid('checking', 'savings').required(),
                        })
                        .required(),
                })
                .required(),
        });
    }

    /**
     * Payment validation schema
     */
    get paymentSchema() {
        return this.joi.object({
            loanId: this.joi.string().pattern(this.patterns.uuid).required(),
            amount: this.joi.financial().currency().min(0.01).required(),
            paymentMethod: this.joi
                .string()
                .valid('bank_transfer', 'debit_card', 'credit_card')
                .required(),
            paymentDetails: this.joi
                .object({
                    routingNumber: this.joi.financial().routingNumber().when('paymentMethod', {
                        is: 'bank_transfer',
                        then: this.joi.required(),
                        otherwise: this.joi.forbidden(),
                    }),
                    accountNumber: this.joi.financial().accountNumber().when('paymentMethod', {
                        is: 'bank_transfer',
                        then: this.joi.required(),
                        otherwise: this.joi.forbidden(),
                    }),
                    cardNumber: this.joi
                        .string()
                        .creditCard()
                        .when('paymentMethod', {
                            is: this.joi.valid('debit_card', 'credit_card'),
                            then: this.joi.required(),
                            otherwise: this.joi.forbidden(),
                        }),
                    expiryMonth: this.joi
                        .number()
                        .integer()
                        .min(1)
                        .max(12)
                        .when('paymentMethod', {
                            is: this.joi.valid('debit_card', 'credit_card'),
                            then: this.joi.required(),
                            otherwise: this.joi.forbidden(),
                        }),
                    expiryYear: this.joi
                        .number()
                        .integer()
                        .min(new Date().getFullYear())
                        .when('paymentMethod', {
                            is: this.joi.valid('debit_card', 'credit_card'),
                            then: this.joi.required(),
                            otherwise: this.joi.forbidden(),
                        }),
                    cvv: this.joi
                        .string()
                        .pattern(/^\d{3,4}$/)
                        .when('paymentMethod', {
                            is: this.joi.valid('debit_card', 'credit_card'),
                            then: this.joi.required(),
                            otherwise: this.joi.forbidden(),
                        }),
                })
                .required(),
            scheduledDate: this.joi.date().min('now').optional(),
        });
    }

    /**
     * KYC document validation schema
     */
    get kycDocumentSchema() {
        return this.joi.object({
            documentType: this.joi
                .string()
                .valid(
                    'passport',
                    'drivers_license',
                    'national_id',
                    'utility_bill',
                    'bank_statement',
                )
                .required(),
            documentNumber: this.joi.string().trim().min(1).max(50).required(),
            issuingCountry: this.joi.string().length(2).required(),
            issuingState: this.joi.string().length(2).when('issuingCountry', {
                is: 'US',
                then: this.joi.required(),
                otherwise: this.joi.optional(),
            }),
            issueDate: this.joi.date().max('now').required(),
            expiryDate: this.joi.date().min('now').required(),
            documentImage: this.joi.string().base64().required(),
            selfieImage: this.joi
                .string()
                .base64()
                .when('documentType', {
                    is: this.joi.valid('passport', 'drivers_license', 'national_id'),
                    then: this.joi.required(),
                    otherwise: this.joi.optional(),
                }),
        });
    }

    /**
     * User profile update validation schema
     */
    get userProfileUpdateSchema() {
        return this.joi.object({
            firstName: this.joi.string().trim().min(1).max(50).optional(),
            lastName: this.joi.string().trim().min(1).max(50).optional(),
            phone: this.joi.string().pattern(this.patterns.phone).optional(),
            address: this.joi
                .object({
                    street: this.joi.string().trim().min(1).max(100).required(),
                    city: this.joi.string().trim().min(1).max(50).required(),
                    state: this.joi.string().trim().length(2).required(),
                    zipCode: this.joi
                        .string()
                        .pattern(/^\d{5}(-\d{4})?$/)
                        .required(),
                    country: this.joi.string().trim().length(2).default('US'),
                })
                .optional(),
            employmentStatus: this.joi
                .string()
                .valid('employed', 'self_employed', 'unemployed', 'retired', 'student')
                .optional(),
            annualIncome: this.joi.financial().currency().min(0).optional(),
            notificationPreferences: this.joi
                .object({
                    email: this.joi.boolean().default(true),
                    sms: this.joi.boolean().default(true),
                    push: this.joi.boolean().default(true),
                    marketing: this.joi.boolean().default(false),
                })
                .optional(),
        });
    }

    /**
     * Password change validation schema
     */
    get passwordChangeSchema() {
        return this.joi.object({
            currentPassword: this.joi.string().required(),
            newPassword: this.joi
                .string()
                .pattern(this.patterns.strongPassword)
                .required()
                .messages({
                    'string.pattern.base':
                        'Password must contain at least 8 characters, including uppercase, lowercase, number, and special character',
                }),
            confirmNewPassword: this.joi
                .string()
                .valid(this.joi.ref('newPassword'))
                .required()
                .messages({
                    'any.only': 'Passwords do not match',
                }),
        });
    }

    /**
     * Create validation middleware
     * @param {Object} schema - Joi validation schema
     * @param {string} source - Source of data to validate ('body', 'query', 'params')
     * @returns {Function} Express middleware
     */
    validate(schema, source = 'body') {
        return (req, res, next) => {
            try {
                const dataToValidate = req[source];

                if (!dataToValidate) {
                    throw new AppError(`No ${source} data provided`, 400, 'MISSING_DATA');
                }

                const { error, value } = schema.validate(dataToValidate, {
                    abortEarly: false, // Return all validation errors
                    stripUnknown: true, // Remove unknown fields
                    convert: true, // Convert types when possible
                });

                if (error) {
                    const validationErrors = error.details.map((detail) => ({
                        field: detail.path.join('.'),
                        message: detail.message,
                        value: detail.context?.value,
                    }));

                    logger.warn('Input validation failed', {
                        source,
                        errors: validationErrors,
                        ip: req.ip,
                        userAgent: req.get('User-Agent'),
                        path: req.path,
                    });

                    return res.status(400).json({
                        error: 'Validation failed',
                        code: 'VALIDATION_ERROR',
                        details: validationErrors,
                    });
                }

                // Replace original data with validated and sanitized data
                req[source] = value;

                // Log successful validation for sensitive operations
                if (
                    source === 'body' &&
                    (req.path.includes('auth') || req.path.includes('payment'))
                ) {
                    logger.info('Input validation successful', {
                        source,
                        path: req.path,
                        ip: req.ip,
                        fieldsValidated: Object.keys(value).length,
                    });
                }

                next();
            } catch (error) {
                logger.error('Validation middleware error', {
                    error: error.message,
                    source,
                    path: req.path,
                });

                if (error instanceof AppError) {
                    return res.status(error.statusCode).json({
                        error: error.message,
                        code: error.code,
                    });
                }

                return res.status(500).json({
                    error: 'Validation processing failed',
                    code: 'VALIDATION_PROCESSING_ERROR',
                });
            }
        };
    }

    /**
     * Sanitize input data
     * @param {Object} data - Data to sanitize
     * @returns {Object} Sanitized data
     */
    sanitize(data) {
        if (typeof data !== 'object' || data === null) {
            return data;
        }

        const sanitized = {};

        for (const [key, value] of Object.entries(data)) {
            if (typeof value === 'string') {
                // Trim whitespace
                sanitized[key] = value.trim();

                // Remove null bytes
                sanitized[key] = sanitized[key].replace(/\0/g, '');

                // Limit string length to prevent DoS
                if (sanitized[key].length > 10000) {
                    sanitized[key] = sanitized[key].substring(0, 10000);
                }
            } else if (typeof value === 'object' && value !== null) {
                sanitized[key] = this.sanitize(value);
            } else {
                sanitized[key] = value;
            }
        }

        return sanitized;
    }

    /**
     * File upload validation
     * @param {Object} options - Validation options
     * @returns {Function} Express middleware
     */
    validateFileUpload(options = {}) {
        const {
            allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'],
            maxSize = 5 * 1024 * 1024, // 5MB
            required = true,
        } = options;

        return (req, res, next) => {
            try {
                if (!req.file && required) {
                    throw new AppError('File upload required', 400, 'FILE_REQUIRED');
                }

                if (req.file) {
                    // Check file type
                    if (!allowedTypes.includes(req.file.mimetype)) {
                        throw new AppError(
                            `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
                            400,
                            'INVALID_FILE_TYPE',
                        );
                    }

                    // Check file size
                    if (req.file.size > maxSize) {
                        throw new AppError(
                            `File too large. Maximum size: ${maxSize / (1024 * 1024)}MB`,
                            400,
                            'FILE_TOO_LARGE',
                        );
                    }

                    // Additional security checks
                    if (req.file.originalname.includes('..')) {
                        throw new AppError('Invalid file name', 400, 'INVALID_FILE_NAME');
                    }

                    logger.info('File upload validated', {
                        filename: req.file.originalname,
                        mimetype: req.file.mimetype,
                        size: req.file.size,
                        ip: req.ip,
                    });
                }

                next();
            } catch (error) {
                logger.warn('File upload validation failed', {
                    error: error.message,
                    filename: req.file?.originalname,
                    ip: req.ip,
                });

                if (error instanceof AppError) {
                    return res.status(error.statusCode).json({
                        error: error.message,
                        code: error.code,
                    });
                }

                return res.status(500).json({
                    error: 'File validation failed',
                    code: 'FILE_VALIDATION_ERROR',
                });
            }
        };
    }

    /**
     * Rate limiting validation
     * @param {string} identifier - Unique identifier for rate limiting
     * @param {number} maxRequests - Maximum requests allowed
     * @param {number} windowMs - Time window in milliseconds
     * @returns {Function} Express middleware
     */
    validateRateLimit(identifier, maxRequests = 100, windowMs = 60000) {
        const requests = new Map();

        return (req, res, next) => {
            try {
                const key = `${identifier}_${req.ip}_${req.user?.id || 'anonymous'}`;
                const now = Date.now();
                const windowStart = now - windowMs;

                // Clean old entries
                if (requests.has(key)) {
                    const userRequests = requests
                        .get(key)
                        .filter((timestamp) => timestamp > windowStart);
                    requests.set(key, userRequests);
                } else {
                    requests.set(key, []);
                }

                const userRequests = requests.get(key);

                if (userRequests.length >= maxRequests) {
                    logger.warn('Rate limit exceeded', {
                        identifier,
                        ip: req.ip,
                        userId: req.user?.id,
                        requestCount: userRequests.length,
                        maxRequests,
                    });

                    return res.status(429).json({
                        error: 'Rate limit exceeded',
                        code: 'RATE_LIMIT_EXCEEDED',
                        retryAfter: Math.ceil(windowMs / 1000),
                    });
                }

                userRequests.push(now);
                next();
            } catch (error) {
                logger.error('Rate limit validation error', { error: error.message });
                next(); // Don't block on rate limit errors
            }
        };
    }
}

module.exports = new InputValidator();
