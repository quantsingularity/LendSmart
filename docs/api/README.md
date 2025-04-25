# API Documentation

This document provides comprehensive information about the LendSmart API endpoints, request/response formats, authentication, and usage examples.

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [API Versioning](#api-versioning)
- [Base URL](#base-url)
- [Rate Limiting](#rate-limiting)
- [Error Handling](#error-handling)
- [Endpoints](#endpoints)
  - [Authentication](#authentication-endpoints)
  - [Users](#user-endpoints)
  - [Loans](#loan-endpoints)
  - [Transactions](#transaction-endpoints)
  - [Marketplace](#marketplace-endpoints)
  - [Analytics](#analytics-endpoints)
- [Webhooks](#webhooks)
- [SDK Integration](#sdk-integration)

## Overview

The LendSmart API is a RESTful API that allows developers to integrate with the LendSmart platform. It provides access to core functionality including user management, loan applications, funding, repayments, and analytics.

## Authentication

The API uses JWT (JSON Web Tokens) for authentication:

1. **Obtaining Access Tokens**:
   - Authenticate using the `/api/auth/login` endpoint
   - Tokens are valid for 1 hour
   - Use refresh tokens to obtain new access tokens

2. **Using Access Tokens**:
   - Include the token in the Authorization header:
   ```
   Authorization: Bearer <access_token>
   ```

3. **Token Refresh**:
   - Use the `/api/auth/refresh` endpoint with a valid refresh token
   - Refresh tokens are valid for 7 days

## API Versioning

The API uses URL versioning:

- Current version: `v1`
- Base URL format: `https://api.lendsmart.io/v1`
- Version changes are announced 90 days in advance

## Base URL

- Production: `https://api.lendsmart.io/v1`
- Staging: `https://api-staging.lendsmart.io/v1`
- Development: `https://api-dev.lendsmart.io/v1`

## Rate Limiting

The API implements rate limiting to ensure fair usage:

- 100 requests per minute per IP address
- 1000 requests per hour per user
- Rate limit headers are included in responses:
  - `X-RateLimit-Limit`: Total requests allowed in the period
  - `X-RateLimit-Remaining`: Remaining requests in the period
  - `X-RateLimit-Reset`: Time when the limit resets (Unix timestamp)

## Error Handling

The API returns standard HTTP status codes and JSON error responses:

```json
{
  "status": "error",
  "code": 400,
  "message": "Validation failed",
  "details": [
    {
      "field": "amount",
      "message": "Amount must be greater than 0"
    }
  ]
}
```

Common error codes:
- `400`: Bad Request - Invalid input parameters
- `401`: Unauthorized - Missing or invalid authentication
- `403`: Forbidden - Insufficient permissions
- `404`: Not Found - Resource not found
- `422`: Unprocessable Entity - Validation errors
- `429`: Too Many Requests - Rate limit exceeded
- `500`: Internal Server Error - Server-side error

## Endpoints

### Authentication Endpoints

#### Register a new user

```
POST /api/auth/register
```

Request body:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123",
  "fullName": "John Doe",
  "role": "borrower"
}
```

Response:
```json
{
  "status": "success",
  "data": {
    "userId": "60a6c3e45f1d2c001c8e4b7a",
    "email": "user@example.com",
    "fullName": "John Doe",
    "role": "borrower",
    "createdAt": "2025-04-25T10:30:00.000Z",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Login

```
POST /api/auth/login
```

Request body:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123"
}
```

Response:
```json
{
  "status": "success",
  "data": {
    "userId": "60a6c3e45f1d2c001c8e4b7a",
    "email": "user@example.com",
    "fullName": "John Doe",
    "role": "borrower",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Refresh Token

```
POST /api/auth/refresh
```

Request body:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

Response:
```json
{
  "status": "success",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Logout

```
POST /api/auth/logout
```

Request body:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

Response:
```json
{
  "status": "success",
  "message": "Successfully logged out"
}
```

### User Endpoints

#### Get User Profile

```
GET /api/users/profile
```

Response:
```json
{
  "status": "success",
  "data": {
    "userId": "60a6c3e45f1d2c001c8e4b7a",
    "email": "user@example.com",
    "fullName": "John Doe",
    "role": "borrower",
    "profile": {
      "phoneNumber": "+1234567890",
      "address": "123 Main St, City, Country",
      "idVerification": {
        "type": "passport",
        "documentNumber": "AB123456",
        "verified": true
      }
    },
    "financialInfo": {
      "income": 50000,
      "employmentStatus": "employed",
      "creditScore": 720
    },
    "walletAddress": "0x1234567890abcdef1234567890abcdef12345678",
    "createdAt": "2025-04-25T10:30:00.000Z",
    "updatedAt": "2025-04-25T10:30:00.000Z"
  }
}
```

#### Update User Profile

```
PUT /api/users/profile
```

Request body:
```json
{
  "fullName": "John Smith",
  "profile": {
    "phoneNumber": "+1987654321",
    "address": "456 Oak St, City, Country"
  },
  "financialInfo": {
    "income": 55000,
    "employmentStatus": "self-employed"
  }
}
```

Response:
```json
{
  "status": "success",
  "data": {
    "userId": "60a6c3e45f1d2c001c8e4b7a",
    "email": "user@example.com",
    "fullName": "John Smith",
    "profile": {
      "phoneNumber": "+1987654321",
      "address": "456 Oak St, City, Country",
      "idVerification": {
        "type": "passport",
        "documentNumber": "AB123456",
        "verified": true
      }
    },
    "financialInfo": {
      "income": 55000,
      "employmentStatus": "self-employed",
      "creditScore": 720
    },
    "updatedAt": "2025-04-25T11:30:00.000Z"
  }
}
```

#### Submit Verification Documents

```
POST /api/users/verify
```

Request body (multipart/form-data):
```
idType: "passport"
documentNumber: "AB123456"
frontImage: [file]
backImage: [file]
selfieImage: [file]
```

Response:
```json
{
  "status": "success",
  "data": {
    "verificationId": "60a6c3e45f1d2c001c8e4b7c",
    "status": "pending",
    "submittedAt": "2025-04-25T11:45:00.000Z",
    "estimatedCompletionTime": "2025-04-27T11:45:00.000Z"
  }
}
```

#### Get User Notifications

```
GET /api/users/notifications
```

Query parameters:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `read`: Filter by read status (true/false)

Response:
```json
{
  "status": "success",
  "data": {
    "notifications": [
      {
        "id": "60a6c3e45f1d2c001c8e4b7d",
        "type": "loan_funded",
        "title": "Loan Fully Funded",
        "message": "Your loan application has been fully funded and is ready for disbursement.",
        "read": false,
        "createdAt": "2025-04-25T12:00:00.000Z"
      },
      {
        "id": "60a6c3e45f1d2c001c8e4b7e",
        "type": "repayment_due",
        "title": "Repayment Due Soon",
        "message": "Your loan repayment of $500 is due in 3 days.",
        "read": true,
        "createdAt": "2025-04-24T12:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 15,
      "pages": 1,
      "page": 1,
      "limit": 20
    }
  }
}
```

### Loan Endpoints

#### Create Loan Application

```
POST /api/loans
```

Request body:
```json
{
  "amount": 5000,
  "currency": "USD",
  "term": 12,
  "purpose": "Home renovation",
  "description": "Renovating kitchen and bathroom in my home."
}
```

Response:
```json
{
  "status": "success",
  "data": {
    "loanId": "60a6c3e45f1d2c001c8e4b7f",
    "borrowerId": "60a6c3e45f1d2c001c8e4b7a",
    "amount": 5000,
    "currency": "USD",
    "term": 12,
    "interestRate": 8.5,
    "purpose": "Home renovation",
    "description": "Renovating kitchen and bathroom in my home.",
    "status": "pending",
    "riskScore": 75,
    "createdAt": "2025-04-25T13:00:00.000Z"
  }
}
```

#### Get All Loans

```
GET /api/loans
```

Query parameters:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `status`: Filter by status (pending, active, completed, defaulted)
- `sortBy`: Sort field (createdAt, amount, interestRate)
- `sortOrder`: Sort order (asc, desc)

Response:
```json
{
  "status": "success",
  "data": {
    "loans": [
      {
        "loanId": "60a6c3e45f1d2c001c8e4b7f",
        "amount": 5000,
        "currency": "USD",
        "term": 12,
        "interestRate": 8.5,
        "purpose": "Home renovation",
        "status": "pending",
        "fundingProgress": 0,
        "createdAt": "2025-04-25T13:00:00.000Z"
      },
      {
        "loanId": "60a6c3e45f1d2c001c8e4b80",
        "amount": 2000,
        "currency": "EUR",
        "term": 6,
        "interestRate": 7.5,
        "purpose": "Education",
        "status": "active",
        "fundingProgress": 100,
        "createdAt": "2025-04-24T13:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 5,
      "pages": 1,
      "page": 1,
      "limit": 20
    }
  }
}
```

#### Get Loan Details

```
GET /api/loans/:id
```

Response:
```json
{
  "status": "success",
  "data": {
    "loanId": "60a6c3e45f1d2c001c8e4b7f",
    "borrowerId": "60a6c3e45f1d2c001c8e4b7a",
    "borrowerName": "John Doe",
    "borrowerReputation": 85,
    "amount": 5000,
    "currency": "USD",
    "term": 12,
    "interestRate": 8.5,
    "purpose": "Home renovation",
    "description": "Renovating kitchen and bathroom in my home.",
    "status": "pending",
    "riskScore": 75,
    "contractAddress": "0x1234567890abcdef1234567890abcdef12345679",
    "lenders": [],
    "repayments": [
      {
        "amount": 450.33,
        "dueDate": "2025-05-25T13:00:00.000Z",
        "status": "upcoming"
      },
      {
        "amount": 450.33,
        "dueDate": "2025-06-25T13:00:00.000Z",
        "status": "upcoming"
      }
    ],
    "createdAt": "2025-04-25T13:00:00.000Z",
    "updatedAt": "2025-04-25T13:00:00.000Z"
  }
}
```

#### Fund a Loan

```
POST /api/loans/:id/fund
```

Request body:
```json
{
  "amount": 1000,
  "walletAddress": "0x1234567890abcdef1234567890abcdef12345680"
}
```

Response:
```json
{
  "status": "success",
  "data": {
    "transactionId": "60a6c3e45f1d2c001c8e4b81",
    "loanId": "60a6c3e45f1d2c001c8e4b7f",
    "amount": 1000,
    "currency": "USD",
    "fundingProgress": 20,
    "transactionHash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    "timestamp": "2025-04-25T14:00:00.000Z"
  }
}
```

#### Make a Loan Repayment

```
POST /api/loans/:id/repay
```

Request body:
```json
{
  "amount": 450.33,
  "walletAddress": "0x1234567890abcdef1234567890abcdef12345678"
}
```

Response:
```json
{
  "status": "success",
  "data": {
    "transactionId": "60a6c3e45f1d2c001c8e4b82",
    "loanId": "60a6c3e45f1d2c001c8e4b7f",
    "repaymentId": "60a6c3e45f1d2c001c8e4b83",
    "amount": 450.33,
    "currency": "USD",
    "transactionHash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    "timestamp": "2025-04-25T14:30:00.000Z",
    "remainingBalance": 4549.67
  }
}
```

### Transaction Endpoints

#### Get User Transactions

```
GET /api/transactions
```

Query parameters:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `type`: Filter by type (funding, repayment, withdrawal, deposit)
- `startDate`: Filter by start date (ISO format)
- `endDate`: Filter by end date (ISO format)
- `sortBy`: Sort field (createdAt, amount)
- `sortOrder`: Sort order (asc, desc)

Response:
```json
{
  "status": "success",
  "data": {
    "transactions": [
      {
        "transactionId": "60a6c3e45f1d2c001c8e4b82",
        "type": "repayment",
        "amount": 450.33,
        "currency": "USD",
        "loanId": "60a6c3e45f1d2c001c8e4b7f",
        "status": "completed",
        "transactionHash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        "createdAt": "2025-04-25T14:30:00.000Z"
      },
      {
        "transactionId": "60a6c3e45f1d2c001c8e4b81",
        "type": "funding",
        "amount": 1000,
        "currency": "USD",
        "loanId": "60a6c3e45f1d2c001c8e4b7f",
        "status": "completed",
        "transactionHash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        "createdAt": "2025-04-25T14:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 2,
      "pages": 1,
      "page": 1,
      "limit": 20
    }
  }
}
```

#### Get Transaction Details

```
GET /api/transactions/:id
```

Response:
```json
{
  "status": "success",
  "data": {
    "transactionId": "60a6c3e45f1d2c001c8e4b82",
    "type": "repayment",
    "amount": 450.33,
    "currency": "USD",
    "fromUserId": "60a6c3e45f1d2c001c8e4b7a",
    "fromUserName": "John Doe",
    "fromWalletAddress": "0x1234567890abcdef1234567890abcdef12345678",
    "toUserId": null,
    "toUserName": null,
    "toWalletAddress": "0x1234567890abcdef1234567890abcdef12345680",
    "loanId": "60a6c3e45f1d2c001c8e4b7f",
    "status": "completed",
    "transactionHash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    "blockNumber": 12345678,
    "gasUsed": 21000,
    "gasPrice": "20000000000",
    "createdAt": "2025-04-25T14:30:00.000Z",
    "completedAt": "2025-04-25T14:31:00.000Z"
  }
}
```

### Marketplace Endpoints

#### Get Available Loans

```
GET /api/marketplace
```

Query parameters:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `minAmount`: Minimum loan amount
- `maxAmount`: Maximum loan amount
- `minInterestRate`: Minimum interest rate
- `maxInterestRate`: Maximum interest rate
- `term`: Loan term in months
- `currency`: Loan currency
- `minRiskScore`: Minimum risk score
- `maxRiskScore`: Maximum risk score
- `sortBy`: Sort field (createdAt, amount, interestRate, riskScore)
- `sortOrder`: Sort order (asc, desc)

Response:
```json
{
  "status": "success",
  "data": {
    "loans": [
      {
        "loanId": "60a6c3e45f1d2c001c8e4b7f",
        "borrowerId": "60a6c3e45f1d2c001c8e4b7a",
        "borrowerName": "John Doe",
        "borrowerReputation": 85,
        "amount": 5000,
        "currency": "USD",
        "term": 12,
        "interestRate": 8.5,
        "purpose": "Home renovation",
        "riskScore": 75,
        "fundingProgress": 20,
        "remainingAmount": 4000,
        "createdAt": "2025-04-25T13:00:00.000Z"
      },
      {
        "loanId": "60a6c3e45f1d2c001c8e4b84",
        "borrowerId": "60a6c3e45f1d2c001c8e4b85",
        "borrowerName": "Jane Smith",
        "borrowerReputation": 92,
        "amount": 10000,
        "currency": "USD",
        "term": 24,
        "interestRate": 7.2,
        "purpose": "Business expansion",
        "riskScore": 82,
        "fundingProgress": 45,
        "remainingAmount": 5500,
        "createdAt": "2025-04-24T15:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 15,
      "pages": 1,
      "page": 1,
      "limit": 20
    }
  }
}
```

#### Get Marketplace Statistics

```
GET /api/marketplace/stats
```

Response:
```json
{
  "status": "success",
  "data": {
    "totalLoans": 150,
    "activeLoans": 120,
    "totalVolume": 1250000,
    "averageInterestRate": 8.2,
    "averageLoanAmount": 8333.33,
    "popularLoanPurposes": [
      {
        "purpose": "Business expansion",
        "count": 45,
        "percentage": 30
      },
      {
        "purpose": "Home renovation",
        "count": 30,
        "percentage": 20
      },
      {
        "purpose": "Education",
        "count": 25,
        "percentage": 16.67
      }
    ],
    "currencyDistribution": [
      {
        "currency": "USD",
        "count": 90,
        "percentage": 60
      },
      {
        "currency": "EUR",
        "count": 45,
        "percentage": 30
      },
      {
        "currency": "GBP",
        "count": 15,
        "percentage": 10
      }
    ],
    "lastUpdated": "2025-04-25T15:00:00.000Z"
  }
}
```

### Analytics Endpoints

#### Get User Analytics

```
GET /api/analytics/user
```

Response:
```json
{
  "status": "success",
  "data": {
    "borrowerStats": {
      "totalBorrowed": 15000,
      "activeLoanCount": 2,
      "completedLoanCount": 3,
      "averageInterestRate": 8.1,
      "totalInterestPaid": 1200,
      "onTimePaymentPercentage": 95,
      "creditScoreChange": 15
    },
    "lenderStats": {
      "totalInvested": 25000,
      "activeInvestmentCount": 8,
      "completedInvestmentCount": 12,
      "averageReturn": 7.8,
      "totalEarnings": 2100,
      "portfolioDiversification": 85,
      "defaultRate": 2.5
    },
    "lastUpdated": "2025-04-25T15:30:00.000Z"
  }
}
```

#### Get Platform Analytics

```
GET /api/analytics/platform
```

Query parameters:
- `period`: Time period (day, week, month, year, all)

Response:
```json
{
  "status": "success",
  "data": {
    "userGrowth": {
      "total": 5000,
      "growth": 15,
      "newUsers": 750,
      "activeUsers": 3500
    },
    "loanVolume": {
      "total": 5000000,
      "growth": 22,
      "averageLoanSize": 8500
    },
    "repaymentStats": {
      "onTimePercentage": 94.5,
      "latePercentage": 4.2,
      "defaultPercentage": 1.3
    },
    "platformRevenue": {
      "total": 125000,
      "growth": 18,
      "breakdown": {
        "originationFees": 75000,
        "servicingFees": 45000,
        "lateFees": 5000
      }
    },
    "lastUpdated": "2025-04-25T16:00:00.000Z"
  }
}
```

## Webhooks

LendSmart provides webhooks for real-time event notifications:

1. **Setting Up Webhooks**:
   - Register webhook endpoints in the developer dashboard
   - Configure event types to receive
   - Set up authentication for webhook security

2. **Event Types**:
   - `loan.created`: New loan application created
   - `loan.funded`: Loan fully funded
   - `loan.disbursed`: Loan funds disbursed to borrower
   - `repayment.due`: Repayment coming due
   - `repayment.received`: Repayment received
   - `repayment.late`: Repayment is late
   - `loan.completed`: Loan fully repaid
   - `loan.defaulted`: Loan defaulted

3. **Webhook Payload Format**:
   ```json
   {
     "id": "evt_123456789",
     "type": "loan.funded",
     "created": "2025-04-25T14:00:00.000Z",
     "data": {
       "loanId": "60a6c3e45f1d2c001c8e4b7f",
       "borrowerId": "60a6c3e45f1d2c001c8e4b7a",
       "amount": 5000,
       "currency": "USD",
       "fundingCompletedAt": "2025-04-25T14:00:00.000Z"
     }
   }
   ```

4. **Webhook Security**:
   - Webhooks include a signature header for verification
   - Implement signature verification to ensure authenticity
   - Use HTTPS for all webhook endpoints

## SDK Integration

LendSmart provides official SDKs for easy integration:

1. **JavaScript/TypeScript SDK**:
   ```javascript
   // Installation
   // npm install lendsmart-sdk

   // Usage
   import { LendSmartClient } from 'lendsmart-sdk';

   const client = new LendSmartClient({
     apiKey: 'your_api_key',
     environment: 'production' // or 'staging', 'development'
   });

   // Authentication
   await client.auth.login('user@example.com', 'password');

   // Get loans
   const loans = await client.loans.getAll({ status: 'active' });

   // Create loan application
   const loan = await client.loans.create({
     amount: 5000,
     currency: 'USD',
     term: 12,
     purpose: 'Home renovation'
   });
   ```

2. **Python SDK**:
   ```python
   # Installation
   # pip install lendsmart-sdk

   # Usage
   from lendsmart_sdk import LendSmartClient

   client = LendSmartClient(
     api_key='your_api_key',
     environment='production'  # or 'staging', 'development'
   )

   # Authentication
   client.auth.login('user@example.com', 'password')

   # Get loans
   loans = client.loans.get_all(status='active')

   # Create loan application
   loan = client.loans.create(
     amount=5000,
     currency='USD',
     term=12,
     purpose='Home renovation'
   )
   ```

3. **SDK Documentation**:
   - Comprehensive documentation available at [docs.lendsmart.io/sdk](https://docs.lendsmart.io/sdk)
   - Code examples for common use cases
   - TypeScript definitions for JavaScript SDK
   - API reference for all SDK methods
