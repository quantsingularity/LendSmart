# LendSmart - Decentralized Lending Platform

## 🚀 Overview

LendSmart is a comprehensive, enterprise-grade decentralized lending platform that combines blockchain technology, artificial intelligence, and traditional financial services to create a secure, transparent, and efficient lending ecosystem. This enhanced version includes significant improvements in security, compliance, user experience, and scalability.

## ✨ Features

### 🏛️ Compliance Framework

- **GDPR Compliance**: Data protection and privacy controls
- **SOX Compliance**: Financial reporting and audit controls
- **PCI DSS**: Payment card industry security standards
- **KYC/AML**: Know Your Customer and Anti-Money Laundering checks
- **Automated Reporting**: Compliance report generation and alerting

### 🧠 AI/ML Enhancements

- **Advanced Risk Scoring**: Multi-factor risk assessment models
- **Explainable AI**: Transparent decision-making processes
- **Fraud Detection**: Real-time fraud detection algorithms
- **Market Analytics**: Predictive market analysis and insights

### ⚡ Performance Optimizations

- **Database Optimization**: Indexed queries and connection pooling
- **Caching Strategy**: Redis-based caching for frequently accessed data
- **API Performance**: Optimized endpoints with pagination and filtering
- **Error Handling**: Centralized error handling with detailed logging

## 📁 Project Structure

```
LendSmart/code/
├── backend/
│   ├── src/
│   │   ├── controllers/         # API controllers
│   │   ├── models/              # Improved database models
│   │   ├── services/            # Business logic services
│   │   ├── middleware/          # Security and validation middleware
│   │   ├── security/            # Security utilities
│   │   │   ├── authService.js   # Advanced authentication
│   │   │   └── encryption.js    # Data encryption utilities
│   │   ├── compliance/          # Compliance framework
│   │   │   ├── auditLogger.js   # Comprehensive audit logging
│   │   │   └── gdprService.js   # GDPR compliance utilities
│   │   ├── validators/          # Input validation
│   │   └── config/              # Configuration management
│   ├── tests/                   # Comprehensive test suites
│   │   ├── auth.test.js         # Authentication tests
│   │   ├── loan.test.js         # Loan management tests
│   │   └── setup.js             # Test environment setup
│   └── docs/                    # API documentation
├── blockchain/                  # Blockchain integration
├── smart-contracts/             # Improved smart contracts
├── ml_models/                   # ML models
├── compliance_framework/        # Compliance tools
└── integration/                 # External service integrations
```

## 🛠 Quick Start Guide

### Prerequisites

- Node.js 18.0.0+
- MongoDB 5.0+
- Redis 6.0+
- Python 3.8+

### 1. Backend Setup

```bash
cd code/backend
npm install
cp .env.example .env
# Configure your .env file
npm run dev
```

### 3. Access the Application

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001
- API Documentation: http://localhost:3001/api-docs

## 🔧 Configuration

### Environment Variables

#### Backend (.env)

```env
# Server Configuration
NODE_ENV=development
PORT=3001
API_VERSION=v1

# Database
MONGODB_URI=mongodb://localhost:27017/lendsmart
REDIS_URL=redis://localhost:6379

# Security
JWT_SECRET=your-super-secure-jwt-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key
ENCRYPTION_KEY=your-32-character-encryption-key
MFA_SECRET=your-mfa-secret-key

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=pdf,jpg,jpeg,png,doc,docx

# External Services
STRIPE_SECRET_KEY=sk_test_your_stripe_secret
PLAID_CLIENT_ID=your_plaid_client_id
PLAID_SECRET=your_plaid_secret

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Compliance
AUDIT_LOG_RETENTION_DAYS=2555
GDPR_DATA_RETENTION_DAYS=1095
```

## 🧪 Testing

### Comprehensive Test Suite

```bash
# Backend tests
cd code/backend
npm test                    # Run all tests
npm run test:coverage      # Run with coverage report
npm run test:watch         # Watch mode for development

# Frontend tests
cd code/lendsmart-frontend
npm test                   # Run React tests
npm run test:coverage     # Coverage report
```

### Test Coverage Goals

- **Unit Tests**: 90%+ coverage
- **Integration Tests**: All API endpoints
- **Security Tests**: Authentication and authorization
- **Performance Tests**: Load and stress testing

## 📊 API Documentation

### Authentication Flow

#### 1. User Registration

```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecurePassword123!",
  "confirmPassword": "SecurePassword123!",
  "firstName": "John",
  "lastName": "Doe",
  "role": "borrower",
  "phoneNumber": "+1234567890",
  "dateOfBirth": "1990-01-01"
}
```

#### 2. Login with MFA

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePassword123!",
  "mfaToken": "123456"  // Optional, required if MFA enabled
}
```

### Loan Management

#### Loan Application with Risk Assessment

```http
POST /api/loans/apply
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "amount": 25000,
  "purpose": "business_expansion",
  "termMonths": 24,
  "monthlyIncome": 8000,
  "employmentStatus": "employed",
  "employmentDuration": 36,
  "creditScore": 720,
  "existingDebt": 15000,
  "collateralType": "property",
  "collateralValue": 100000,
  "businessRevenue": 120000,
  "businessType": "technology"
}
```

#### Advanced Loan Filtering

```http
GET /api/loans/available?
  minAmount=10000&
  maxAmount=50000&
  maxInterestRate=12&
  minTerm=6&
  maxTerm=36&
  riskLevel=low,medium&
  purpose=business_expansion&
  page=1&
  limit=20&
  sortBy=interestRate&
  sortOrder=asc
```

## 🔐 Security Features

### Multi-Factor Authentication

- TOTP-based authentication using Google Authenticator
- Backup codes for account recovery
- SMS-based verification (optional)
- Biometric authentication support (planned)

### Advanced Audit Logging

```javascript
// Automatic audit logging for all critical actions
{
  "eventId": "audit_1640995200_abc123",
  "category": "authentication",
  "action": "user_login",
  "userId": "user_123",
  "ip": "192.168.1.100",
  "userAgent": "Mozilla/5.0...",
  "success": true,
  "timestamp": "2024-01-01T12:00:00Z",
  "metadata": {
    "mfaUsed": true,
    "loginAttempts": 1,
    "sessionDuration": 3600
  }
}
```

### Data Encryption

- AES-256 encryption for sensitive data
- Field-level encryption for PII
- Encrypted file storage
- Secure key management

## 🏛️ Compliance Framework

### GDPR Compliance

- Data subject rights implementation
- Consent management
- Data portability
- Right to be forgotten
- Privacy by design

### Financial Regulations

- SOX compliance for financial reporting
- PCI DSS for payment processing
- KYC/AML verification workflows
- Regulatory reporting automation

### Audit Trail

- Immutable audit logs
- Compliance report generation
- Real-time monitoring
- Automated alerting
