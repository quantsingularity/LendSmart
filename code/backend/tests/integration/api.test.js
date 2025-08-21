const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../src/server');
const User = require('../../src/models/UserModel');
const Loan = require('../../src/models/LoanModel');
const { testUtils } = require('../setup');

describe('API Integration Tests', () => {
  let testUser;
  let authToken;
  let adminUser;
  let adminToken;

  beforeEach(async () => {
    // Create test user
    testUser = new User(testUtils.createTestUser());
    await testUser.save();
    authToken = testUtils.generateTestToken({ userId: testUser._id });

    // Create admin user
    adminUser = new User(testUtils.createTestUser({
      email: 'admin@example.com',
      role: 'admin'
    }));
    await adminUser.save();
    adminToken = testUtils.generateTestToken({ 
      userId: adminUser._id, 
      role: 'admin' 
    });
  });

  describe('Authentication Endpoints', () => {
    describe('POST /api/auth/register', () => {
      test('should register a new user successfully', async () => {
        const userData = testUtils.createTestUser({
          email: 'newuser@example.com'
        });

        const response = await request(app)
          .post('/api/auth/register')
          .send(userData)
          .expect(201);

        expect(response.body).toHaveProperty('user');
        expect(response.body).toHaveProperty('token');
        expect(response.body.user.email).toBe(userData.email);
        expect(response.body.user).not.toHaveProperty('password');
      });

      test('should reject registration with existing email', async () => {
        const userData = testUtils.createTestUser({
          email: testUser.email
        });

        const response = await request(app)
          .post('/api/auth/register')
          .send(userData)
          .expect(400);

        expect(response.body.error).toContain('already exists');
      });

      test('should reject registration with invalid data', async () => {
        const invalidData = {
          email: 'invalid-email',
          password: '123',
          firstName: '',
          lastName: ''
        };

        const response = await request(app)
          .post('/api/auth/register')
          .send(invalidData)
          .expect(400);

        expect(response.body.error).toBeDefined();
      });

      test('should enforce rate limiting on registration', async () => {
        const userData = testUtils.createTestUser();
        
        // Make multiple registration attempts
        const promises = [];
        for (let i = 0; i < 10; i++) {
          promises.push(
            request(app)
              .post('/api/auth/register')
              .send({
                ...userData,
                email: `user${i}@example.com`
              })
          );
        }

        const responses = await Promise.all(promises);
        const rateLimitedResponses = responses.filter(res => res.status === 429);
        
        expect(rateLimitedResponses.length).toBeGreaterThan(0);
      });
    });

    describe('POST /api/auth/login', () => {
      test('should login with valid credentials', async () => {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            email: testUser.email,
            password: 'TestPassword123!'
          })
          .expect(200);

        expect(response.body).toHaveProperty('user');
        expect(response.body).toHaveProperty('token');
        expect(response.body.user.email).toBe(testUser.email);
      });

      test('should reject login with invalid credentials', async () => {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            email: testUser.email,
            password: 'wrongpassword'
          })
          .expect(401);

        expect(response.body.error).toContain('Invalid credentials');
      });

      test('should reject login with non-existent user', async () => {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            email: 'nonexistent@example.com',
            password: 'password'
          })
          .expect(401);

        expect(response.body.error).toContain('Invalid credentials');
      });

      test('should enforce rate limiting on login attempts', async () => {
        const promises = [];
        for (let i = 0; i < 10; i++) {
          promises.push(
            request(app)
              .post('/api/auth/login')
              .send({
                email: testUser.email,
                password: 'wrongpassword'
              })
          );
        }

        const responses = await Promise.all(promises);
        const rateLimitedResponses = responses.filter(res => res.status === 429);
        
        expect(rateLimitedResponses.length).toBeGreaterThan(0);
      });
    });

    describe('POST /api/auth/logout', () => {
      test('should logout successfully', async () => {
        const response = await request(app)
          .post('/api/auth/logout')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.message).toContain('logged out');
      });

      test('should reject logout without token', async () => {
        const response = await request(app)
          .post('/api/auth/logout')
          .expect(401);

        expect(response.body.error).toContain('Authentication required');
      });
    });

    describe('POST /api/auth/forgot-password', () => {
      test('should initiate password reset', async () => {
        const response = await request(app)
          .post('/api/auth/forgot-password')
          .send({ email: testUser.email })
          .expect(200);

        expect(response.body.message).toContain('reset instructions');
      });

      test('should not reveal if email exists', async () => {
        const response = await request(app)
          .post('/api/auth/forgot-password')
          .send({ email: 'nonexistent@example.com' })
          .expect(200);

        expect(response.body.message).toContain('reset instructions');
      });
    });
  });

  describe('User Profile Endpoints', () => {
    describe('GET /api/users/profile', () => {
      test('should get user profile', async () => {
        const response = await request(app)
          .get('/api/users/profile')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.user.email).toBe(testUser.email);
        expect(response.body.user).not.toHaveProperty('password');
      });

      test('should reject request without authentication', async () => {
        const response = await request(app)
          .get('/api/users/profile')
          .expect(401);

        expect(response.body.error).toContain('Authentication required');
      });
    });

    describe('PUT /api/users/profile', () => {
      test('should update user profile', async () => {
        const updateData = {
          firstName: 'Updated',
          lastName: 'Name',
          phone: '+1987654321'
        };

        const response = await request(app)
          .put('/api/users/profile')
          .set('Authorization', `Bearer ${authToken}`)
          .send(updateData)
          .expect(200);

        expect(response.body.user.firstName).toBe(updateData.firstName);
        expect(response.body.user.lastName).toBe(updateData.lastName);
        expect(response.body.user.phone).toBe(updateData.phone);
      });

      test('should reject invalid profile updates', async () => {
        const invalidData = {
          email: 'invalid-email',
          phone: 'invalid-phone'
        };

        const response = await request(app)
          .put('/api/users/profile')
          .set('Authorization', `Bearer ${authToken}`)
          .send(invalidData)
          .expect(400);

        expect(response.body.error).toBeDefined();
      });

      test('should not allow updating sensitive fields', async () => {
        const sensitiveData = {
          role: 'admin',
          accountStatus: 'suspended',
          creditScore: 850
        };

        const response = await request(app)
          .put('/api/users/profile')
          .set('Authorization', `Bearer ${authToken}`)
          .send(sensitiveData)
          .expect(200);

        // Verify sensitive fields were not updated
        const updatedUser = await User.findById(testUser._id);
        expect(updatedUser.role).toBe(testUser.role);
        expect(updatedUser.accountStatus).toBe(testUser.accountStatus);
        expect(updatedUser.creditScore).toBe(testUser.creditScore);
      });
    });
  });

  describe('Loan Application Endpoints', () => {
    describe('POST /api/loans/apply', () => {
      test('should submit loan application successfully', async () => {
        const loanData = testUtils.createTestLoanApplication();

        const response = await request(app)
          .post('/api/loans/apply')
          .set('Authorization', `Bearer ${authToken}`)
          .send(loanData)
          .expect(201);

        expect(response.body.loan).toHaveProperty('id');
        expect(response.body.loan.amount).toBe(loanData.amount);
        expect(response.body.loan.purpose).toBe(loanData.purpose);
        expect(response.body.loan.status).toBe('pending');
      });

      test('should reject invalid loan application', async () => {
        const invalidLoanData = {
          amount: -1000,
          purpose: 'invalid_purpose',
          term: 0
        };

        const response = await request(app)
          .post('/api/loans/apply')
          .set('Authorization', `Bearer ${authToken}`)
          .send(invalidLoanData)
          .expect(400);

        expect(response.body.error).toBeDefined();
      });

      test('should require authentication for loan application', async () => {
        const loanData = testUtils.createTestLoanApplication();

        const response = await request(app)
          .post('/api/loans/apply')
          .send(loanData)
          .expect(401);

        expect(response.body.error).toContain('Authentication required');
      });

      test('should enforce loan amount limits', async () => {
        const loanData = testUtils.createTestLoanApplication({
          amount: 1000000 // Exceeds maximum
        });

        const response = await request(app)
          .post('/api/loans/apply')
          .set('Authorization', `Bearer ${authToken}`)
          .send(loanData)
          .expect(400);

        expect(response.body.error).toContain('amount');
      });
    });

    describe('GET /api/loans', () => {
      let userLoan;

      beforeEach(async () => {
        userLoan = new Loan({
          borrower: testUser._id,
          amount: 10000,
          purpose: 'debt_consolidation',
          term: 36,
          status: 'pending'
        });
        await userLoan.save();
      });

      test('should get user loans', async () => {
        const response = await request(app)
          .get('/api/loans')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.loans).toHaveLength(1);
        expect(response.body.loans[0].amount).toBe(userLoan.amount);
      });

      test('should support pagination', async () => {
        // Create multiple loans
        for (let i = 0; i < 5; i++) {
          const loan = new Loan({
            borrower: testUser._id,
            amount: 5000 + i * 1000,
            purpose: 'debt_consolidation',
            term: 36,
            status: 'pending'
          });
          await loan.save();
        }

        const response = await request(app)
          .get('/api/loans?page=1&limit=3')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.loans).toHaveLength(3);
        expect(response.body.pagination).toHaveProperty('total');
        expect(response.body.pagination).toHaveProperty('pages');
      });

      test('should filter loans by status', async () => {
        // Create loan with different status
        const approvedLoan = new Loan({
          borrower: testUser._id,
          amount: 15000,
          purpose: 'home_improvement',
          term: 48,
          status: 'approved'
        });
        await approvedLoan.save();

        const response = await request(app)
          .get('/api/loans?status=approved')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.loans).toHaveLength(1);
        expect(response.body.loans[0].status).toBe('approved');
      });
    });

    describe('GET /api/loans/:id', () => {
      let userLoan;

      beforeEach(async () => {
        userLoan = new Loan({
          borrower: testUser._id,
          amount: 10000,
          purpose: 'debt_consolidation',
          term: 36,
          status: 'pending'
        });
        await userLoan.save();
      });

      test('should get specific loan', async () => {
        const response = await request(app)
          .get(`/api/loans/${userLoan._id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.loan._id).toBe(userLoan._id.toString());
        expect(response.body.loan.amount).toBe(userLoan.amount);
      });

      test('should reject access to other user loan', async () => {
        const otherUser = new User(testUtils.createTestUser({
          email: 'other@example.com'
        }));
        await otherUser.save();

        const otherLoan = new Loan({
          borrower: otherUser._id,
          amount: 5000,
          purpose: 'personal',
          term: 24,
          status: 'pending'
        });
        await otherLoan.save();

        const response = await request(app)
          .get(`/api/loans/${otherLoan._id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(403);

        expect(response.body.error).toContain('access');
      });

      test('should return 404 for non-existent loan', async () => {
        const nonExistentId = new mongoose.Types.ObjectId();

        const response = await request(app)
          .get(`/api/loans/${nonExistentId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(404);

        expect(response.body.error).toContain('not found');
      });
    });
  });

  describe('Payment Endpoints', () => {
    let userLoan;

    beforeEach(async () => {
      userLoan = new Loan({
        borrower: testUser._id,
        amount: 10000,
        purpose: 'debt_consolidation',
        term: 36,
        status: 'active',
        monthlyPayment: 350
      });
      await userLoan.save();
    });

    describe('POST /api/payments', () => {
      test('should process payment successfully', async () => {
        const paymentData = testUtils.createTestPayment({
          loanId: userLoan._id.toString()
        });

        const response = await request(app)
          .post('/api/payments')
          .set('Authorization', `Bearer ${authToken}`)
          .send(paymentData)
          .expect(201);

        expect(response.body.payment).toHaveProperty('id');
        expect(response.body.payment.amount).toBe(paymentData.amount);
        expect(response.body.payment.status).toBe('completed');
      });

      test('should reject payment for non-existent loan', async () => {
        const nonExistentLoanId = new mongoose.Types.ObjectId();
        const paymentData = testUtils.createTestPayment({
          loanId: nonExistentLoanId.toString()
        });

        const response = await request(app)
          .post('/api/payments')
          .set('Authorization', `Bearer ${authToken}`)
          .send(paymentData)
          .expect(404);

        expect(response.body.error).toContain('Loan not found');
      });

      test('should reject payment with invalid amount', async () => {
        const paymentData = testUtils.createTestPayment({
          loanId: userLoan._id.toString(),
          amount: -100
        });

        const response = await request(app)
          .post('/api/payments')
          .set('Authorization', `Bearer ${authToken}`)
          .send(paymentData)
          .expect(400);

        expect(response.body.error).toContain('amount');
      });

      test('should enforce payment method validation', async () => {
        const paymentData = testUtils.createTestPayment({
          loanId: userLoan._id.toString(),
          paymentMethod: 'invalid_method'
        });

        const response = await request(app)
          .post('/api/payments')
          .set('Authorization', `Bearer ${authToken}`)
          .send(paymentData)
          .expect(400);

        expect(response.body.error).toContain('paymentMethod');
      });
    });

    describe('GET /api/payments', () => {
      test('should get payment history', async () => {
        // Create some payment records
        const Payment = require('../../src/models/PaymentModel');
        
        for (let i = 0; i < 3; i++) {
          const payment = new Payment({
            loan: userLoan._id,
            borrower: testUser._id,
            amount: 350,
            paymentMethod: 'bank_transfer',
            status: 'completed',
            transactionId: `txn_${i}`
          });
          await payment.save();
        }

        const response = await request(app)
          .get('/api/payments')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.payments).toHaveLength(3);
        expect(response.body.payments[0]).toHaveProperty('amount');
        expect(response.body.payments[0]).toHaveProperty('status');
      });

      test('should filter payments by loan', async () => {
        const Payment = require('../../src/models/PaymentModel');
        
        // Create another loan and payment
        const anotherLoan = new Loan({
          borrower: testUser._id,
          amount: 5000,
          purpose: 'personal',
          term: 24,
          status: 'active'
        });
        await anotherLoan.save();

        const payment1 = new Payment({
          loan: userLoan._id,
          borrower: testUser._id,
          amount: 350,
          paymentMethod: 'bank_transfer',
          status: 'completed'
        });
        await payment1.save();

        const payment2 = new Payment({
          loan: anotherLoan._id,
          borrower: testUser._id,
          amount: 250,
          paymentMethod: 'bank_transfer',
          status: 'completed'
        });
        await payment2.save();

        const response = await request(app)
          .get(`/api/payments?loanId=${userLoan._id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.payments).toHaveLength(1);
        expect(response.body.payments[0].loan).toBe(userLoan._id.toString());
      });
    });
  });

  describe('Admin Endpoints', () => {
    describe('GET /api/admin/users', () => {
      test('should get all users for admin', async () => {
        const response = await request(app)
          .get('/api/admin/users')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.users).toHaveLength(2); // testUser and adminUser
        expect(response.body.users[0]).not.toHaveProperty('password');
      });

      test('should reject non-admin access', async () => {
        const response = await request(app)
          .get('/api/admin/users')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(403);

        expect(response.body.error).toContain('admin');
      });

      test('should support user search', async () => {
        const response = await request(app)
          .get(`/api/admin/users?search=${testUser.email}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.users).toHaveLength(1);
        expect(response.body.users[0].email).toBe(testUser.email);
      });
    });

    describe('PUT /api/admin/users/:id/status', () => {
      test('should update user status', async () => {
        const response = await request(app)
          .put(`/api/admin/users/${testUser._id}/status`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ status: 'suspended' })
          .expect(200);

        expect(response.body.user.accountStatus).toBe('suspended');
      });

      test('should reject invalid status', async () => {
        const response = await request(app)
          .put(`/api/admin/users/${testUser._id}/status`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ status: 'invalid_status' })
          .expect(400);

        expect(response.body.error).toContain('status');
      });
    });

    describe('GET /api/admin/loans', () => {
      beforeEach(async () => {
        // Create test loans
        for (let i = 0; i < 3; i++) {
          const loan = new Loan({
            borrower: testUser._id,
            amount: 10000 + i * 5000,
            purpose: 'debt_consolidation',
            term: 36,
            status: i === 0 ? 'pending' : 'approved'
          });
          await loan.save();
        }
      });

      test('should get all loans for admin', async () => {
        const response = await request(app)
          .get('/api/admin/loans')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.loans).toHaveLength(3);
      });

      test('should filter loans by status', async () => {
        const response = await request(app)
          .get('/api/admin/loans?status=pending')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.loans).toHaveLength(1);
        expect(response.body.loans[0].status).toBe('pending');
      });
    });
  });

  describe('Health Check Endpoints', () => {
    describe('GET /health', () => {
      test('should return health status', async () => {
        const response = await request(app)
          .get('/health')
          .expect(200);

        expect(response.body.status).toBe('healthy');
        expect(response.body).toHaveProperty('timestamp');
        expect(response.body).toHaveProperty('uptime');
      });
    });

    describe('GET /api/health/detailed', () => {
      test('should return detailed health status', async () => {
        const response = await request(app)
          .get('/api/health/detailed')
          .expect(200);

        expect(response.body.status).toBe('healthy');
        expect(response.body).toHaveProperty('services');
        expect(response.body.services).toHaveProperty('database');
        expect(response.body.services).toHaveProperty('redis');
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle 404 for non-existent endpoints', async () => {
      const response = await request(app)
        .get('/api/non-existent-endpoint')
        .expect(404);

      expect(response.body.error).toContain('not found');
    });

    test('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}')
        .expect(400);

      expect(response.body.error).toContain('Invalid JSON');
    });

    test('should handle large payloads', async () => {
      const largePayload = {
        data: 'x'.repeat(10 * 1024 * 1024) // 10MB
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(largePayload)
        .expect(413);

      expect(response.body.error).toContain('too large');
    });
  });

  describe('Security Tests', () => {
    test('should prevent SQL injection', async () => {
      const maliciousInput = {
        email: "test@example.com'; DROP TABLE users; --",
        password: 'password'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(maliciousInput);

      // Should not crash the server
      expect([400, 401]).toContain(response.status);
    });

    test('should prevent XSS attacks', async () => {
      const xssPayload = {
        firstName: "<script>alert('xss')</script>",
        lastName: "User"
      };

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(xssPayload);

      if (response.status === 200) {
        expect(response.body.user.firstName).not.toContain('<script>');
      }
    });

    test('should enforce HTTPS in production', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`);

      // Should have security headers
      expect(response.headers).toHaveProperty('strict-transport-security');

      process.env.NODE_ENV = originalEnv;
    });
  });
});

