const request = require('supertest');
const express = require('express');
const securityMiddleware = require('../../src/middleware/security/securityMiddleware');
const { inputValidator } = require('../../src/middleware/validation/inputValidator');
const { errorHandler } = require('../../src/middleware/monitoring/errorHandler');

describe('Security Middleware', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
  });

  describe('Rate Limiting', () => {
    test('should allow requests within rate limit', async () => {
      const rateLimiters = securityMiddleware.getRateLimiters();
      app.use('/api', rateLimiters.api);
      app.get('/api/test', (req, res) => res.json({ success: true }));

      const response = await request(app)
        .get('/api/test')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('should block requests exceeding rate limit', async () => {
      const rateLimiters = securityMiddleware.getRateLimiters();
      app.use('/auth', rateLimiters.auth);
      app.post('/auth/login', (req, res) => res.json({ success: true }));

      // Make multiple requests to exceed rate limit
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(
          request(app)
            .post('/auth/login')
            .send({ email: 'test@example.com', password: 'password' })
        );
      }

      const responses = await Promise.all(promises);
      const blockedResponses = responses.filter(res => res.status === 429);
      
      expect(blockedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('IP Blocking', () => {
    test('should allow access from non-blocked IP', async () => {
      app.use(securityMiddleware.ipBlockingMiddleware);
      app.get('/test', (req, res) => res.json({ success: true }));

      const response = await request(app)
        .get('/test')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('should block access after multiple failed attempts', async () => {
      app.use(securityMiddleware.ipBlockingMiddleware);
      app.get('/test', (req, res) => res.json({ success: true }));

      // Simulate failed attempts
      const clientIP = '192.168.1.100';
      for (let i = 0; i < 6; i++) {
        securityMiddleware.recordFailedAttempt(clientIP, 'test_failure');
      }

      const response = await request(app)
        .get('/test')
        .set('X-Forwarded-For', clientIP);

      expect(response.status).toBe(403);
      expect(response.body.code).toBe('IP_BLOCKED');
    });
  });

  describe('Suspicious Activity Detection', () => {
    test('should detect SQL injection attempts', async () => {
      app.use(securityMiddleware.suspiciousActivityMiddleware);
      app.get('/test', (req, res) => res.json({ success: true }));

      const response = await request(app)
        .get('/test')
        .query({ search: "'; DROP TABLE users; --" });

      // Should still process but log suspicious activity
      expect(response.status).toBe(200);
    });

    test('should detect XSS attempts', async () => {
      app.use(securityMiddleware.suspiciousActivityMiddleware);
      app.post('/test', (req, res) => res.json({ success: true }));

      const response = await request(app)
        .post('/test')
        .send({ content: "<script>alert('xss')</script>" });

      expect(response.status).toBe(200);
    });

    test('should block IP after multiple suspicious activities', async () => {
      app.use(securityMiddleware.suspiciousActivityMiddleware);
      app.get('/test', (req, res) => res.json({ success: true }));

      // Make multiple suspicious requests
      const suspiciousQueries = [
        "'; DROP TABLE users; --",
        "<script>alert('xss')</script>",
        "../../../etc/passwd",
        "' OR '1'='1",
        "<img src=x onerror=alert('xss')>"
      ];

      for (const query of suspiciousQueries) {
        await request(app)
          .get('/test')
          .query({ search: query });
      }

      // Next request should be blocked
      const response = await request(app)
        .get('/test')
        .query({ search: "normal query" });

      expect(response.status).toBe(403);
      expect(response.body.code).toBe('SUSPICIOUS_ACTIVITY_DETECTED');
    });
  });

  describe('CSRF Protection', () => {
    test('should allow GET requests without CSRF token', async () => {
      app.use(securityMiddleware.csrfProtection);
      app.get('/test', (req, res) => res.json({ success: true }));

      const response = await request(app)
        .get('/test')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('should block POST requests without CSRF token', async () => {
      app.use(securityMiddleware.csrfProtection);
      app.post('/test', (req, res) => res.json({ success: true }));

      const response = await request(app)
        .post('/test')
        .send({ data: 'test' })
        .expect(403);

      expect(response.body.code).toBe('CSRF_TOKEN_INVALID');
    });

    test('should allow API requests with valid JWT', async () => {
      app.use((req, res, next) => {
        req.user = { id: 'test-user' }; // Mock authenticated user
        next();
      });
      app.use(securityMiddleware.csrfProtection);
      app.post('/api/test', (req, res) => res.json({ success: true }));

      const response = await request(app)
        .post('/api/test')
        .send({ data: 'test' })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Input Sanitization', () => {
    test('should sanitize malicious input', async () => {
      app.use(securityMiddleware.inputSanitization);
      app.post('/test', (req, res) => res.json({ body: req.body }));

      const maliciousInput = {
        name: "John<script>alert('xss')</script>",
        email: "test@example.com'; DROP TABLE users; --",
        description: "Normal text with \x00 null bytes"
      };

      const response = await request(app)
        .post('/test')
        .send(maliciousInput)
        .expect(200);

      expect(response.body.body.name).not.toContain('<script>');
      expect(response.body.body.email).not.toContain('DROP TABLE');
      expect(response.body.body.description).not.toContain('\x00');
    });

    test('should limit string length to prevent DoS', async () => {
      app.use(securityMiddleware.inputSanitization);
      app.post('/test', (req, res) => res.json({ body: req.body }));

      const longString = 'a'.repeat(20000);
      const response = await request(app)
        .post('/test')
        .send({ longField: longString })
        .expect(200);

      expect(response.body.body.longField.length).toBeLessThanOrEqual(10000);
    });
  });

  describe('Security Headers', () => {
    test('should add security headers', async () => {
      app.use(securityMiddleware.securityHeaders);
      app.get('/test', (req, res) => res.json({ success: true }));

      const response = await request(app)
        .get('/test')
        .expect(200);

      expect(response.headers).toHaveProperty('x-request-id');
      expect(response.headers).toHaveProperty('x-api-version');
      expect(response.headers).toHaveProperty('x-rate-limit-policy');
      expect(response.headers).not.toHaveProperty('x-powered-by');
    });
  });

  describe('Session Security', () => {
    test('should handle session timeout', async () => {
      app.use((req, res, next) => {
        req.session = {
          lastActivity: Date.now() - (31 * 60 * 1000), // 31 minutes ago
          destroy: jest.fn((callback) => callback())
        };
        next();
      });
      app.use(securityMiddleware.sessionSecurity);
      app.get('/test', (req, res) => res.json({ success: true }));

      const response = await request(app)
        .get('/test')
        .expect(401);

      expect(response.body.code).toBe('SESSION_EXPIRED');
    });

    test('should update session activity', async () => {
      const mockSession = {
        lastActivity: Date.now() - (10 * 60 * 1000), // 10 minutes ago
        regenerate: jest.fn((callback) => callback())
      };

      app.use((req, res, next) => {
        req.session = mockSession;
        next();
      });
      app.use(securityMiddleware.sessionSecurity);
      app.get('/test', (req, res) => res.json({ success: true }));

      const response = await request(app)
        .get('/test')
        .expect(200);

      expect(mockSession.lastActivity).toBeGreaterThan(Date.now() - 1000);
    });
  });
});

describe('Input Validation Middleware', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
  });

  describe('User Registration Validation', () => {
    test('should validate valid user registration data', async () => {
      app.post('/register', 
        inputValidator.validateUserRegistration,
        (req, res) => res.json({ success: true })
      );

      const validUser = {
        email: 'test@example.com',
        password: 'SecurePassword123!',
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: '1990-01-01',
        phone: '+1234567890',
        agreeToTerms: true,
        agreeToPrivacyPolicy: true
      };

      const response = await request(app)
        .post('/register')
        .send(validUser)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('should reject invalid email format', async () => {
      app.post('/register', 
        inputValidator.validateUserRegistration,
        (req, res) => res.json({ success: true })
      );

      const invalidUser = {
        email: 'invalid-email',
        password: 'SecurePassword123!',
        firstName: 'John',
        lastName: 'Doe'
      };

      const response = await request(app)
        .post('/register')
        .send(invalidUser)
        .expect(400);

      expect(response.body.error).toContain('email');
    });

    test('should reject weak passwords', async () => {
      app.post('/register', 
        inputValidator.validateUserRegistration,
        (req, res) => res.json({ success: true })
      );

      const weakPasswords = [
        '123456',
        'password',
        'Password',
        'Password123',
        'password123!'
      ];

      for (const password of weakPasswords) {
        const response = await request(app)
          .post('/register')
          .send({
            email: 'test@example.com',
            password,
            firstName: 'John',
            lastName: 'Doe'
          });

        expect(response.status).toBe(400);
        expect(response.body.error).toContain('password');
      }
    });

    test('should reject missing required fields', async () => {
      app.post('/register', 
        inputValidator.validateUserRegistration,
        (req, res) => res.json({ success: true })
      );

      const incompleteUser = {
        email: 'test@example.com'
        // Missing required fields
      };

      const response = await request(app)
        .post('/register')
        .send(incompleteUser)
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('Loan Application Validation', () => {
    test('should validate valid loan application', async () => {
      app.post('/loan', 
        inputValidator.validateLoanApplication,
        (req, res) => res.json({ success: true })
      );

      const validLoan = {
        amount: 10000,
        purpose: 'debt_consolidation',
        term: 36,
        description: 'Consolidating credit card debt',
        employmentInfo: {
          employer: 'Tech Company',
          position: 'Software Engineer',
          yearsEmployed: 2,
          monthlyIncome: 5000
        },
        financialInfo: {
          monthlyExpenses: 3000,
          existingDebt: 5000,
          creditScore: 750
        }
      };

      const response = await request(app)
        .post('/loan')
        .send(validLoan)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('should reject invalid loan amount', async () => {
      app.post('/loan', 
        inputValidator.validateLoanApplication,
        (req, res) => res.json({ success: true })
      );

      const invalidAmounts = [-1000, 0, 1000000000];

      for (const amount of invalidAmounts) {
        const response = await request(app)
          .post('/loan')
          .send({
            amount,
            purpose: 'debt_consolidation',
            term: 36
          });

        expect(response.status).toBe(400);
        expect(response.body.error).toContain('amount');
      }
    });

    test('should reject invalid loan purpose', async () => {
      app.post('/loan', 
        inputValidator.validateLoanApplication,
        (req, res) => res.json({ success: true })
      );

      const response = await request(app)
        .post('/loan')
        .send({
          amount: 10000,
          purpose: 'invalid_purpose',
          term: 36
        })
        .expect(400);

      expect(response.body.error).toContain('purpose');
    });
  });

  describe('Payment Validation', () => {
    test('should validate valid payment data', async () => {
      app.post('/payment', 
        inputValidator.validatePayment,
        (req, res) => res.json({ success: true })
      );

      const validPayment = {
        loanId: '507f1f77bcf86cd799439011',
        amount: 500,
        paymentMethod: 'bank_transfer',
        paymentDetails: {
          routingNumber: '123456789',
          accountNumber: '987654321'
        }
      };

      const response = await request(app)
        .post('/payment')
        .send(validPayment)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('should reject invalid payment amount', async () => {
      app.post('/payment', 
        inputValidator.validatePayment,
        (req, res) => res.json({ success: true })
      );

      const response = await request(app)
        .post('/payment')
        .send({
          loanId: '507f1f77bcf86cd799439011',
          amount: -100,
          paymentMethod: 'bank_transfer'
        })
        .expect(400);

      expect(response.body.error).toContain('amount');
    });

    test('should reject invalid payment method', async () => {
      app.post('/payment', 
        inputValidator.validatePayment,
        (req, res) => res.json({ success: true })
      );

      const response = await request(app)
        .post('/payment')
        .send({
          loanId: '507f1f77bcf86cd799439011',
          amount: 500,
          paymentMethod: 'invalid_method'
        })
        .expect(400);

      expect(response.body.error).toContain('paymentMethod');
    });
  });
});

describe('Error Handler Middleware', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
  });

  test('should handle validation errors', async () => {
    app.get('/test', (req, res, next) => {
      const error = new Error('Validation failed');
      error.name = 'ValidationError';
      error.statusCode = 400;
      next(error);
    });
    app.use(errorHandler);

    const response = await request(app)
      .get('/test')
      .expect(400);

    expect(response.body.error).toBe('Validation failed');
    expect(response.body.code).toBe('VALIDATION_ERROR');
  });

  test('should handle authentication errors', async () => {
    app.get('/test', (req, res, next) => {
      const error = new Error('Authentication required');
      error.name = 'AuthenticationError';
      error.statusCode = 401;
      next(error);
    });
    app.use(errorHandler);

    const response = await request(app)
      .get('/test')
      .expect(401);

    expect(response.body.error).toBe('Authentication required');
    expect(response.body.code).toBe('AUTHENTICATION_ERROR');
  });

  test('should handle authorization errors', async () => {
    app.get('/test', (req, res, next) => {
      const error = new Error('Insufficient permissions');
      error.name = 'AuthorizationError';
      error.statusCode = 403;
      next(error);
    });
    app.use(errorHandler);

    const response = await request(app)
      .get('/test')
      .expect(403);

    expect(response.body.error).toBe('Insufficient permissions');
    expect(response.body.code).toBe('AUTHORIZATION_ERROR');
  });

  test('should handle database errors', async () => {
    app.get('/test', (req, res, next) => {
      const error = new Error('Database connection failed');
      error.name = 'MongoError';
      error.code = 11000; // Duplicate key error
      next(error);
    });
    app.use(errorHandler);

    const response = await request(app)
      .get('/test')
      .expect(500);

    expect(response.body.error).toBe('Database operation failed');
    expect(response.body.code).toBe('DATABASE_ERROR');
  });

  test('should handle rate limit errors', async () => {
    app.get('/test', (req, res, next) => {
      const error = new Error('Too many requests');
      error.name = 'RateLimitError';
      error.statusCode = 429;
      next(error);
    });
    app.use(errorHandler);

    const response = await request(app)
      .get('/test')
      .expect(429);

    expect(response.body.error).toBe('Too many requests');
    expect(response.body.code).toBe('RATE_LIMIT_ERROR');
  });

  test('should handle unknown errors', async () => {
    app.get('/test', (req, res, next) => {
      const error = new Error('Something went wrong');
      next(error);
    });
    app.use(errorHandler);

    const response = await request(app)
      .get('/test')
      .expect(500);

    expect(response.body.error).toBe('Internal server error');
    expect(response.body.code).toBe('INTERNAL_ERROR');
  });

  test('should not expose sensitive information in production', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    app.get('/test', (req, res, next) => {
      const error = new Error('Database password is incorrect');
      error.stack = 'Error: Database password is incorrect\n    at /app/config/database.js:15:10';
      next(error);
    });
    app.use(errorHandler);

    const response = await request(app)
      .get('/test')
      .expect(500);

    expect(response.body.error).toBe('Internal server error');
    expect(response.body).not.toHaveProperty('stack');
    expect(response.body.error).not.toContain('password');

    process.env.NODE_ENV = originalEnv;
  });

  test('should include stack trace in development', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    app.get('/test', (req, res, next) => {
      const error = new Error('Test error');
      error.stack = 'Error: Test error\n    at /app/test.js:10:5';
      next(error);
    });
    app.use(errorHandler);

    const response = await request(app)
      .get('/test')
      .expect(500);

    expect(response.body).toHaveProperty('stack');

    process.env.NODE_ENV = originalEnv;
  });
});

