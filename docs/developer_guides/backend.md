# Backend Documentation

This document provides comprehensive information about the backend components of the LendSmart platform.

## Table of Contents

- [Overview](#overview)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Core Components](#core-components)
- [Database Schema](#database-schema)
- [Authentication](#authentication)
- [API Endpoints](#api-endpoints)
- [Blockchain Integration](#blockchain-integration)
- [AI/ML Integration](#aiml-integration)
- [Error Handling](#error-handling)
- [Logging](#logging)
- [Testing](#testing)

## Overview

The LendSmart backend serves as the central hub connecting the frontend application with the blockchain layer, AI/ML services, and database. It handles business logic, data processing, authentication, and integration with external services.

## Technology Stack

- **Runtime Environment**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Blockchain Integration**: Web3.js
- **AI/ML Integration**: TensorFlow.js and custom Python services
- **Testing**: Jest and Supertest
- **Documentation**: Swagger/OpenAPI

## Project Structure

The backend follows a modular structure organized by feature:

```
backend/
├── config/                 # Configuration files
├── controllers/            # Request handlers
├── middleware/             # Express middleware
├── models/                 # Database models
├── routes/                 # API routes
├── services/               # Business logic
├── utils/                  # Utility functions
├── blockchain/             # Blockchain integration
├── ai/                     # AI/ML integration
├── tests/                  # Test files
├── app.js                  # Express application
└── server.js               # Server entry point
```

## Core Components

### Controllers

Controllers handle HTTP requests and responses. They validate input, call appropriate services, and format responses.

Key controllers include:
- `AuthController`: Handles user registration, login, and authentication
- `LoanController`: Manages loan creation, updates, and queries
- `UserController`: Handles user profile operations
- `TransactionController`: Manages financial transactions
- `NotificationController`: Handles user notifications

### Models

Models define the database schema and provide an interface for database operations.

Key models include:
- `User`: User account information
- `Loan`: Loan details and status
- `Transaction`: Financial transaction records
- `Notification`: User notification data
- `CreditScore`: User credit score information

### Services

Services contain the core business logic of the application.

Key services include:
- `AuthService`: Authentication and authorization logic
- `LoanService`: Loan processing and management
- `BlockchainService`: Interaction with smart contracts
- `AIService`: Risk assessment and credit scoring
- `NotificationService`: User notification management

### Middleware

Middleware functions process requests before they reach route handlers.

Key middleware includes:
- `authMiddleware`: Validates JWT tokens
- `roleMiddleware`: Checks user permissions
- `validationMiddleware`: Validates request data
- `errorMiddleware`: Handles and formats errors
- `loggingMiddleware`: Logs request and response data

## Database Schema

The MongoDB database uses the following schema:

### User Schema
```javascript
{
  _id: ObjectId,
  username: String,
  email: String,
  passwordHash: String,
  role: String,
  profile: {
    fullName: String,
    phoneNumber: String,
    address: String,
    idVerification: {
      type: String,
      documentNumber: String,
      verified: Boolean
    }
  },
  financialInfo: {
    income: Number,
    employmentStatus: String,
    creditScore: Number
  },
  walletAddress: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Loan Schema
```javascript
{
  _id: ObjectId,
  borrowerId: ObjectId,
  amount: Number,
  currency: String,
  term: Number,
  interestRate: Number,
  purpose: String,
  status: String,
  riskScore: Number,
  contractAddress: String,
  lenders: [{
    lenderId: ObjectId,
    amount: Number,
    walletAddress: String
  }],
  repayments: [{
    amount: Number,
    dueDate: Date,
    paidDate: Date,
    status: String,
    transactionHash: String
  }],
  createdAt: Date,
  updatedAt: Date
}
```

### Transaction Schema
```javascript
{
  _id: ObjectId,
  type: String,
  amount: Number,
  currency: String,
  fromUserId: ObjectId,
  toUserId: ObjectId,
  loanId: ObjectId,
  status: String,
  transactionHash: String,
  blockNumber: Number,
  createdAt: Date,
  updatedAt: Date
}
```

## Authentication

LendSmart uses JWT (JSON Web Tokens) for authentication:

1. **Registration Process**:
   - User submits registration data
   - Password is hashed using bcrypt
   - User record is created in the database
   - JWT token is generated and returned

2. **Login Process**:
   - User submits credentials
   - Password is verified against stored hash
   - JWT token is generated and returned

3. **Token Validation**:
   - JWT token is included in Authorization header
   - Token is validated for authenticity and expiration
   - User information is attached to request object

4. **Refresh Token**:
   - Separate refresh token with longer expiration
   - Used to obtain new access tokens
   - Stored securely with HTTP-only cookies

## API Endpoints

The backend exposes the following API endpoints:

### Authentication Endpoints
- `POST /api/auth/register`: Register a new user
- `POST /api/auth/login`: Authenticate a user
- `POST /api/auth/refresh`: Refresh access token
- `POST /api/auth/logout`: Invalidate tokens

### User Endpoints
- `GET /api/users/profile`: Get user profile
- `PUT /api/users/profile`: Update user profile
- `POST /api/users/verify`: Submit verification documents
- `GET /api/users/notifications`: Get user notifications

### Loan Endpoints
- `POST /api/loans`: Create a loan application
- `GET /api/loans`: Get all loans (with filters)
- `GET /api/loans/:id`: Get loan details
- `PUT /api/loans/:id`: Update loan details
- `POST /api/loans/:id/fund`: Fund a loan
- `POST /api/loans/:id/repay`: Make a loan repayment

### Transaction Endpoints
- `GET /api/transactions`: Get user transactions
- `GET /api/transactions/:id`: Get transaction details

### Marketplace Endpoints
- `GET /api/marketplace`: Get available loans for funding
- `GET /api/marketplace/stats`: Get marketplace statistics

For detailed API documentation, see the [API Reference](../api/README.md).

## Blockchain Integration

The backend integrates with Ethereum/Polygon blockchain using Web3.js:

1. **Smart Contract Interaction**:
   - `LoanManager.sol`: Central contract for loan management
   - `BorrowerContract.sol`: Individual borrower contracts

2. **Transaction Handling**:
   - Creating loan contracts
   - Processing funding transactions
   - Managing repayments
   - Handling contract events

3. **Event Listeners**:
   - Monitoring blockchain events
   - Updating database based on contract events
   - Triggering notifications

## AI/ML Integration

The backend integrates with AI/ML services for:

1. **Risk Assessment**:
   - Evaluating borrower creditworthiness
   - Calculating default probability
   - Determining appropriate interest rates

2. **Fraud Detection**:
   - Identifying suspicious activities
   - Flagging potentially fraudulent applications

3. **Market Analysis**:
   - Analyzing lending trends
   - Providing market insights

## Error Handling

The backend implements a centralized error handling system:

1. **Error Types**:
   - `ValidationError`: Input validation errors
   - `AuthenticationError`: Authentication failures
   - `AuthorizationError`: Permission issues
   - `ResourceNotFoundError`: Missing resources
   - `BlockchainError`: Blockchain interaction issues
   - `ServiceError`: External service failures

2. **Error Response Format**:
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

## Logging

The backend uses a structured logging system:

1. **Log Levels**:
   - `error`: System errors and exceptions
   - `warn`: Warning conditions
   - `info`: Informational messages
   - `debug`: Detailed debugging information

2. **Log Format**:
   ```json
   {
     "timestamp": "2025-04-25T10:30:00.000Z",
     "level": "info",
     "message": "Loan application created",
     "context": {
       "userId": "60a6c3e45f1d2c001c8e4b7a",
       "loanId": "60a6c3e45f1d2c001c8e4b7b"
     }
   }
   ```

3. **Log Storage**:
   - Console output in development
   - File storage in production
   - External logging service integration

## Testing

The backend includes comprehensive testing:

1. **Unit Tests**:
   - Testing individual functions and methods
   - Mocking external dependencies

2. **Integration Tests**:
   - Testing API endpoints
   - Testing database interactions

3. **Contract Tests**:
   - Testing smart contract interactions
   - Simulating blockchain transactions

4. **Load Tests**:
   - Testing system performance under load
   - Identifying bottlenecks
