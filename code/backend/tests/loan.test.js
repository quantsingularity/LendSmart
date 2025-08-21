const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/server');
const User = require('../src/models/UserModel');
const Loan = require('../src/models/LoanModel');
const { createTestUser, generateTestToken } = require('./auth.test');

// Test database setup
const MONGODB_URI = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/lendsmart_test';

describe('Loan Management System', () => {
  let borrower, lender, admin;
  let borrowerToken, lenderToken, adminToken;
  let testLoan;

  beforeAll(async () => {
    await mongoose.connect(MONGODB_URI);
  });

  beforeEach(async () => {
    // Clean database
    await User.deleteMany({});
    await Loan.deleteMany({});

    // Create test users
    borrower = await createTestUser({
      username: 'borrower1',
      email: 'borrower@example.com',
      role: 'borrower'
    });

    lender = await createTestUser({
      username: 'lender1',
      email: 'lender@example.com',
      role: 'investor'
    });

    admin = await createTestUser({
      username: 'admin1',
      email: 'admin@example.com',
      role: 'admin'
    });

    // Generate tokens
    borrowerToken = generateTestToken(borrower._id);
    lenderToken = generateTestToken(lender._id);
    adminToken = generateTestToken(admin._id);

    // Create a test loan
    testLoan = await Loan.create({
      borrowerId: borrower._id,
      amount: 10000,
      purpose: 'Business expansion',
      termMonths: 12,
      interestRate: 8.5,
      status: 'pending',
      creditScore: 720,
      monthlyIncome: 5000,
      employmentStatus: 'employed',
      collateralType: 'none'
    });
  });

  afterEach(async () => {
    await User.deleteMany({});
    await Loan.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('Loan Application', () => {
    test('should create a new loan application with valid data', async () => {
      const loanData = {
        amount: 15000,
        purpose: 'Home improvement',
        termMonths: 24,
        monthlyIncome: 6000,
        employmentStatus: 'employed',
        employmentDuration: 36,
        collateralType: 'property',
        collateralValue: 50000,
        requestedInterestRate: 7.5
      };

      const response = await request(app)
        .post('/api/loans/apply')
        .set('Authorization', `Bearer ${borrowerToken}`)
        .send(loanData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.loan).toBeDefined();
      expect(response.body.loan.amount).toBe(loanData.amount);
      expect(response.body.loan.borrowerId).toBe(borrower._id.toString());
      expect(response.body.loan.status).toBe('pending');
      expect(response.body.loan.applicationId).toBeDefined();

      // Verify loan was created in database
      const createdLoan = await Loan.findById(response.body.loan._id);
      expect(createdLoan).toBeTruthy();
      expect(createdLoan.amount).toBe(loanData.amount);
    });

    test('should reject loan application with invalid amount', async () => {
      const loanData = {
        amount: -1000, // Invalid negative amount
        purpose: 'Business expansion',
        termMonths: 12,
        monthlyIncome: 5000,
        employmentStatus: 'employed'
      };

      const response = await request(app)
        .post('/api/loans/apply')
        .set('Authorization', `Bearer ${borrowerToken}`)
        .send(loanData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('amount');
    });

    test('should reject loan application with insufficient income', async () => {
      const loanData = {
        amount: 100000, // Very high amount
        purpose: 'Business expansion',
        termMonths: 12,
        monthlyIncome: 2000, // Low income
        employmentStatus: 'employed'
      };

      const response = await request(app)
        .post('/api/loans/apply')
        .set('Authorization', `Bearer ${borrowerToken}`)
        .send(loanData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('income');
    });

    test('should calculate risk score automatically', async () => {
      const loanData = {
        amount: 10000,
        purpose: 'Debt consolidation',
        termMonths: 18,
        monthlyIncome: 4000,
        employmentStatus: 'employed',
        employmentDuration: 24,
        existingDebt: 5000,
        creditScore: 680
      };

      const response = await request(app)
        .post('/api/loans/apply')
        .set('Authorization', `Bearer ${borrowerToken}`)
        .send(loanData)
        .expect(201);

      expect(response.body.loan.riskScore).toBeDefined();
      expect(response.body.loan.riskScore).toBeGreaterThan(0);
      expect(response.body.loan.riskScore).toBeLessThanOrEqual(100);
      expect(response.body.loan.riskCategory).toBeDefined();
    });

    test('should prevent duplicate active loan applications', async () => {
      // Create first loan application
      const loanData = {
        amount: 10000,
        purpose: 'Business expansion',
        termMonths: 12,
        monthlyIncome: 5000,
        employmentStatus: 'employed'
      };

      await request(app)
        .post('/api/loans/apply')
        .set('Authorization', `Bearer ${borrowerToken}`)
        .send(loanData)
        .expect(201);

      // Try to create second loan application
      const response = await request(app)
        .post('/api/loans/apply')
        .set('Authorization', `Bearer ${borrowerToken}`)
        .send(loanData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('active loan application');
    });
  });

  describe('Loan Approval Process', () => {
    test('should approve loan application by admin', async () => {
      const approvalData = {
        approvedAmount: 9000,
        approvedInterestRate: 9.0,
        approvedTermMonths: 12,
        conditions: ['Provide additional income verification'],
        notes: 'Approved with minor conditions'
      };

      const response = await request(app)
        .put(`/api/loans/${testLoan._id}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(approvalData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.loan.status).toBe('approved');
      expect(response.body.loan.approvedAmount).toBe(approvalData.approvedAmount);
      expect(response.body.loan.approvedBy).toBe(admin._id.toString());
      expect(response.body.loan.approvalDate).toBeDefined();

      // Verify in database
      const updatedLoan = await Loan.findById(testLoan._id);
      expect(updatedLoan.status).toBe('approved');
      expect(updatedLoan.approvedAmount).toBe(approvalData.approvedAmount);
    });

    test('should reject loan application by admin', async () => {
      const rejectionData = {
        reason: 'Insufficient credit score',
        notes: 'Credit score below minimum requirement'
      };

      const response = await request(app)
        .put(`/api/loans/${testLoan._id}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(rejectionData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.loan.status).toBe('rejected');
      expect(response.body.loan.rejectionReason).toBe(rejectionData.reason);
      expect(response.body.loan.rejectedBy).toBe(admin._id.toString());
      expect(response.body.loan.rejectionDate).toBeDefined();
    });

    test('should prevent non-admin users from approving loans', async () => {
      const approvalData = {
        approvedAmount: 9000,
        approvedInterestRate: 9.0,
        approvedTermMonths: 12
      };

      const response = await request(app)
        .put(`/api/loans/${testLoan._id}/approve`)
        .set('Authorization', `Bearer ${borrowerToken}`)
        .send(approvalData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('permission');
    });

    test('should auto-approve loans meeting criteria', async () => {
      const autoApproveLoanData = {
        amount: 5000, // Small amount
        purpose: 'Emergency expense',
        termMonths: 6,
        monthlyIncome: 8000, // High income
        employmentStatus: 'employed',
        employmentDuration: 60,
        creditScore: 800, // Excellent credit
        existingDebt: 1000 // Low debt
      };

      const response = await request(app)
        .post('/api/loans/apply')
        .set('Authorization', `Bearer ${borrowerToken}`)
        .send(autoApproveLoanData)
        .expect(201);

      expect(response.body.loan.status).toBe('auto_approved');
      expect(response.body.loan.autoApproved).toBe(true);
      expect(response.body.loan.approvalDate).toBeDefined();
    });
  });

  describe('Loan Funding', () => {
    beforeEach(async () => {
      // Approve the test loan first
      await Loan.findByIdAndUpdate(testLoan._id, {
        status: 'approved',
        approvedAmount: 10000,
        approvedInterestRate: 8.5,
        approvedTermMonths: 12,
        approvedBy: admin._id,
        approvalDate: new Date()
      });
    });

    test('should allow investor to fund approved loan', async () => {
      const fundingData = {
        amount: 5000 // Partial funding
      };

      const response = await request(app)
        .post(`/api/loans/${testLoan._id}/fund`)
        .set('Authorization', `Bearer ${lenderToken}`)
        .send(fundingData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.funding).toBeDefined();
      expect(response.body.funding.amount).toBe(fundingData.amount);
      expect(response.body.funding.investorId).toBe(lender._id.toString());

      // Verify loan funding status
      const updatedLoan = await Loan.findById(testLoan._id);
      expect(updatedLoan.fundedAmount).toBe(fundingData.amount);
      expect(updatedLoan.fundings).toHaveLength(1);
    });

    test('should mark loan as fully funded when target reached', async () => {
      const fundingData = {
        amount: 10000 // Full funding
      };

      const response = await request(app)
        .post(`/api/loans/${testLoan._id}/fund`)
        .set('Authorization', `Bearer ${lenderToken}`)
        .send(fundingData)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify loan is fully funded
      const updatedLoan = await Loan.findById(testLoan._id);
      expect(updatedLoan.status).toBe('funded');
      expect(updatedLoan.fundedAmount).toBe(10000);
      expect(updatedLoan.fundingCompletedDate).toBeDefined();
    });

    test('should prevent overfunding of loans', async () => {
      const fundingData = {
        amount: 15000 // More than approved amount
      };

      const response = await request(app)
        .post(`/api/loans/${testLoan._id}/fund`)
        .set('Authorization', `Bearer ${lenderToken}`)
        .send(fundingData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('exceeds');
    });

    test('should prevent borrower from funding their own loan', async () => {
      const fundingData = {
        amount: 5000
      };

      const response = await request(app)
        .post(`/api/loans/${testLoan._id}/fund`)
        .set('Authorization', `Bearer ${borrowerToken}`)
        .send(fundingData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('own loan');
    });
  });

  describe('Loan Repayment', () => {
    beforeEach(async () => {
      // Set up a funded loan
      await Loan.findByIdAndUpdate(testLoan._id, {
        status: 'active',
        approvedAmount: 10000,
        fundedAmount: 10000,
        approvedInterestRate: 8.5,
        approvedTermMonths: 12,
        disbursementDate: new Date(),
        nextPaymentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        monthlyPayment: 869.88 // Calculated payment
      });
    });

    test('should process loan repayment', async () => {
      const paymentData = {
        amount: 869.88,
        paymentMethod: 'bank_transfer'
      };

      const response = await request(app)
        .post(`/api/loans/${testLoan._id}/repay`)
        .set('Authorization', `Bearer ${borrowerToken}`)
        .send(paymentData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.payment).toBeDefined();
      expect(response.body.payment.amount).toBe(paymentData.amount);
      expect(response.body.payment.principalAmount).toBeDefined();
      expect(response.body.payment.interestAmount).toBeDefined();

      // Verify loan balance updated
      const updatedLoan = await Loan.findById(testLoan._id);
      expect(updatedLoan.remainingBalance).toBeLessThan(10000);
      expect(updatedLoan.payments).toHaveLength(1);
    });

    test('should calculate payment breakdown correctly', async () => {
      const paymentData = {
        amount: 869.88,
        paymentMethod: 'bank_transfer'
      };

      const response = await request(app)
        .post(`/api/loans/${testLoan._id}/repay`)
        .set('Authorization', `Bearer ${borrowerToken}`)
        .send(paymentData)
        .expect(200);

      const payment = response.body.payment;
      expect(payment.principalAmount + payment.interestAmount).toBeCloseTo(payment.amount, 2);
      expect(payment.interestAmount).toBeGreaterThan(0);
      expect(payment.principalAmount).toBeGreaterThan(0);
    });

    test('should handle early loan payoff', async () => {
      const payoffData = {
        amount: 10000, // Full remaining balance
        paymentMethod: 'bank_transfer',
        isPayoff: true
      };

      const response = await request(app)
        .post(`/api/loans/${testLoan._id}/repay`)
        .set('Authorization', `Bearer ${borrowerToken}`)
        .send(payoffData)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify loan is paid off
      const updatedLoan = await Loan.findById(testLoan._id);
      expect(updatedLoan.status).toBe('paid_off');
      expect(updatedLoan.remainingBalance).toBe(0);
      expect(updatedLoan.paidOffDate).toBeDefined();
    });

    test('should handle late payment fees', async () => {
      // Set loan as overdue
      await Loan.findByIdAndUpdate(testLoan._id, {
        nextPaymentDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        isOverdue: true
      });

      const paymentData = {
        amount: 869.88,
        paymentMethod: 'bank_transfer'
      };

      const response = await request(app)
        .post(`/api/loans/${testLoan._id}/repay`)
        .set('Authorization', `Bearer ${borrowerToken}`)
        .send(paymentData)
        .expect(200);

      expect(response.body.payment.lateFee).toBeGreaterThan(0);
      expect(response.body.payment.totalAmount).toBeGreaterThan(paymentData.amount);
    });
  });

  describe('Loan Queries and Filtering', () => {
    beforeEach(async () => {
      // Create multiple test loans with different statuses
      await Loan.create([
        {
          borrowerId: borrower._id,
          amount: 5000,
          purpose: 'Personal',
          status: 'pending',
          termMonths: 6,
          interestRate: 7.5
        },
        {
          borrowerId: borrower._id,
          amount: 15000,
          purpose: 'Business',
          status: 'approved',
          termMonths: 24,
          interestRate: 9.0
        },
        {
          borrowerId: borrower._id,
          amount: 8000,
          purpose: 'Education',
          status: 'funded',
          termMonths: 18,
          interestRate: 6.5
        }
      ]);
    });

    test('should get borrower loans with pagination', async () => {
      const response = await request(app)
        .get('/api/loans/my-loans')
        .set('Authorization', `Bearer ${borrowerToken}`)
        .query({ page: 1, limit: 2 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.loans).toHaveLength(2);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.total).toBeGreaterThan(2);
      expect(response.body.pagination.page).toBe(1);
    });

    test('should filter loans by status', async () => {
      const response = await request(app)
        .get('/api/loans/my-loans')
        .set('Authorization', `Bearer ${borrowerToken}`)
        .query({ status: 'pending' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.loans.every(loan => loan.status === 'pending')).toBe(true);
    });

    test('should filter loans by amount range', async () => {
      const response = await request(app)
        .get('/api/loans/my-loans')
        .set('Authorization', `Bearer ${borrowerToken}`)
        .query({ minAmount: 7000, maxAmount: 12000 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.loans.every(loan => 
        loan.amount >= 7000 && loan.amount <= 12000
      )).toBe(true);
    });

    test('should get available loans for investors', async () => {
      const response = await request(app)
        .get('/api/loans/available')
        .set('Authorization', `Bearer ${lenderToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.loans).toBeDefined();
      expect(response.body.loans.every(loan => 
        loan.status === 'approved' || loan.status === 'partially_funded'
      )).toBe(true);
    });

    test('should get loan details with full information', async () => {
      const response = await request(app)
        .get(`/api/loans/${testLoan._id}`)
        .set('Authorization', `Bearer ${borrowerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.loan).toBeDefined();
      expect(response.body.loan._id).toBe(testLoan._id.toString());
      expect(response.body.loan.borrower).toBeDefined(); // Should include populated borrower info
    });
  });

  describe('Loan Analytics and Reporting', () => {
    test('should get loan statistics for admin', async () => {
      const response = await request(app)
        .get('/api/loans/analytics/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.stats).toBeDefined();
      expect(response.body.stats.totalLoans).toBeDefined();
      expect(response.body.stats.totalAmount).toBeDefined();
      expect(response.body.stats.averageAmount).toBeDefined();
      expect(response.body.stats.statusBreakdown).toBeDefined();
    });

    test('should get loan performance metrics', async () => {
      const response = await request(app)
        .get('/api/loans/analytics/performance')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ 
          startDate: '2024-01-01',
          endDate: '2024-12-31'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.metrics).toBeDefined();
      expect(response.body.metrics.approvalRate).toBeDefined();
      expect(response.body.metrics.defaultRate).toBeDefined();
      expect(response.body.metrics.averageProcessingTime).toBeDefined();
    });

    test('should prevent non-admin access to analytics', async () => {
      const response = await request(app)
        .get('/api/loans/analytics/stats')
        .set('Authorization', `Bearer ${borrowerToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('permission');
    });
  });

  describe('Loan Document Management', () => {
    test('should upload loan documents', async () => {
      const response = await request(app)
        .post(`/api/loans/${testLoan._id}/documents`)
        .set('Authorization', `Bearer ${borrowerToken}`)
        .attach('document', Buffer.from('fake document content'), 'income_statement.pdf')
        .field('documentType', 'income_statement')
        .field('description', 'Monthly income statement')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.document).toBeDefined();
      expect(response.body.document.documentType).toBe('income_statement');
      expect(response.body.document.filename).toBeDefined();
    });

    test('should get loan documents list', async () => {
      const response = await request(app)
        .get(`/api/loans/${testLoan._id}/documents`)
        .set('Authorization', `Bearer ${borrowerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.documents).toBeDefined();
      expect(Array.isArray(response.body.documents)).toBe(true);
    });

    test('should prevent unauthorized access to loan documents', async () => {
      const response = await request(app)
        .get(`/api/loans/${testLoan._id}/documents`)
        .set('Authorization', `Bearer ${lenderToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('access');
    });
  });
});

// Helper functions
const createTestLoan = async (borrowerId, loanData = {}) => {
  const defaultData = {
    borrowerId,
    amount: 10000,
    purpose: 'Business expansion',
    termMonths: 12,
    interestRate: 8.5,
    status: 'pending',
    creditScore: 720,
    monthlyIncome: 5000,
    employmentStatus: 'employed'
  };

  return await Loan.create({ ...defaultData, ...loanData });
};

module.exports = {
  createTestLoan
};

