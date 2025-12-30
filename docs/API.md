# API Reference

**LendSmart REST API Documentation**

Complete reference for the LendSmart REST API v1.

---

## Table of Contents

- [Base URL](#base-url)
- [Authentication](#authentication)
- [Response Format](#response-format)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Authentication Endpoints](#authentication-endpoints)
- [Loan Endpoints](#loan-endpoints)
- [User Endpoints](#user-endpoints)
- [Admin Endpoints](#admin-endpoints)

---

## Base URL

```
Development: http://localhost:3001/api
Production:  https://api.lendsmart.com/api
```

All endpoints are prefixed with `/api` unless otherwise specified.

---

## Authentication

LendSmart API uses JWT (JSON Web Tokens) for authentication.

### Authentication Flow

1. Register or login to obtain access token
2. Include token in `Authorization` header for protected endpoints
3. Refresh token when expired using `/auth/refresh`

### Header Format

```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### Token Expiration

| Token Type    | Expiration | Renewable |
| ------------- | ---------- | --------- |
| Access Token  | 1 hour     | No        |
| Refresh Token | 7 days     | Yes       |

---

## Response Format

### Success Response

```json
{
    "success": true,
    "data": {
        // Response data
    },
    "message": "Operation successful"
}
```

### Pagination Response

```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "totalItems": 150,
      "totalPages": 8,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

---

## Error Handling

### Error Response Format

```json
{
    "success": false,
    "error": {
        "code": "VALIDATION_ERROR",
        "message": "Invalid input data",
        "details": [
            {
                "field": "email",
                "message": "Invalid email format"
            }
        ]
    }
}
```

### HTTP Status Codes

| Code | Meaning               | Description                       |
| ---- | --------------------- | --------------------------------- |
| 200  | OK                    | Request successful                |
| 201  | Created               | Resource created successfully     |
| 400  | Bad Request           | Invalid request parameters        |
| 401  | Unauthorized          | Missing or invalid authentication |
| 403  | Forbidden             | Insufficient permissions          |
| 404  | Not Found             | Resource not found                |
| 429  | Too Many Requests     | Rate limit exceeded               |
| 500  | Internal Server Error | Server error                      |

### Error Codes

| Code                       | Description               | Resolution           |
| -------------------------- | ------------------------- | -------------------- |
| `AUTH_INVALID_CREDENTIALS` | Invalid login credentials | Check email/password |
| `AUTH_TOKEN_EXPIRED`       | JWT token expired         | Refresh token        |
| `AUTH_TOKEN_INVALID`       | Invalid JWT token         | Re-authenticate      |
| `VALIDATION_ERROR`         | Input validation failed   | Check request body   |
| `LOAN_NOT_FOUND`           | Loan does not exist       | Verify loan ID       |
| `INSUFFICIENT_FUNDS`       | Insufficient balance      | Add funds            |
| `RATE_LIMIT_EXCEEDED`      | Too many requests         | Wait and retry       |

---

## Rate Limiting

| Endpoint Type  | Rate Limit    | Window     |
| -------------- | ------------- | ---------- |
| Authentication | 100 requests  | 15 minutes |
| General API    | 1000 requests | 15 minutes |
| Admin API      | 500 requests  | 15 minutes |

**Rate Limit Headers:**

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

---

## Authentication Endpoints

### Register User

Create a new user account.

**Endpoint:** `POST /auth/register`

**Auth Required:** No

**Request Body:**

| Name          | Type   | Required? | Default | Description                     | Example            |
| ------------- | ------ | --------- | ------- | ------------------------------- | ------------------ |
| `email`       | string | Yes       | -       | User email address              | `user@example.com` |
| `password`    | string | Yes       | -       | Strong password (min 8 chars)   | `SecurePass123!`   |
| `username`    | string | Yes       | -       | Unique username                 | `johndoe`          |
| `firstName`   | string | Yes       | -       | First name                      | `John`             |
| `lastName`    | string | Yes       | -       | Last name                       | `Doe`              |
| `role`        | string | Yes       | -       | User role: `borrower`, `lender` | `borrower`         |
| `phoneNumber` | string | No        | -       | Phone number                    | `+1234567890`      |
| `dateOfBirth` | string | No        | -       | Date of birth (ISO format)      | `1990-01-01`       |

**Example Request:**

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123!",
    "username": "johndoe",
    "firstName": "John",
    "lastName": "Doe",
    "role": "borrower",
    "phoneNumber": "+1234567890",
    "dateOfBirth": "1990-01-01"
  }'
```

**Example Response:**

```json
{
    "success": true,
    "data": {
        "user": {
            "id": "user_abc123",
            "email": "john@example.com",
            "username": "johndoe",
            "role": "borrower"
        },
        "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    },
    "message": "Registration successful"
}
```

---

### Login

Authenticate and receive access tokens.

**Endpoint:** `POST /auth/login`

**Auth Required:** No

**Request Body:**

| Name       | Type   | Required? | Default | Description            | Example            |
| ---------- | ------ | --------- | ------- | ---------------------- | ------------------ |
| `email`    | string | Yes       | -       | User email             | `user@example.com` |
| `password` | string | Yes       | -       | User password          | `SecurePass123!`   |
| `mfaToken` | string | No        | -       | MFA token (if enabled) | `123456`           |

**Example Request:**

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'
```

**Example Response:**

```json
{
    "success": true,
    "data": {
        "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "user": {
            "id": "user_abc123",
            "email": "john@example.com",
            "username": "johndoe",
            "role": "borrower"
        }
    }
}
```

---

### Get Current User Profile

Get authenticated user's profile.

**Endpoint:** `GET /auth/me`

**Auth Required:** Yes

**Example Request:**

```bash
curl -X GET http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Example Response:**

```json
{
    "success": true,
    "data": {
        "user": {
            "id": "user_abc123",
            "email": "john@example.com",
            "username": "johndoe",
            "firstName": "John",
            "lastName": "Doe",
            "role": "borrower",
            "kycStatus": "verified",
            "creditScore": 720,
            "createdAt": "2024-01-01T00:00:00Z"
        }
    }
}
```

---

### Logout

Invalidate current session.

**Endpoint:** `GET /auth/logout`

**Auth Required:** Yes

**Example Request:**

```bash
curl -X GET http://localhost:3001/api/auth/logout \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## Loan Endpoints

### Apply for Loan

Submit a new loan application.

**Endpoint:** `POST /loans/apply`

**Auth Required:** Yes

**Request Body:**

| Name                 | Type   | Required? | Default | Description                  | Example              |
| -------------------- | ------ | --------- | ------- | ---------------------------- | -------------------- |
| `amount`             | number | Yes       | -       | Loan amount (USD)            | `25000`              |
| `purpose`            | string | Yes       | -       | Loan purpose                 | `business_expansion` |
| `termMonths`         | number | Yes       | -       | Loan term in months          | `24`                 |
| `monthlyIncome`      | number | Yes       | -       | Monthly income (USD)         | `8000`               |
| `employmentStatus`   | string | Yes       | -       | Employment status            | `employed`           |
| `employmentDuration` | number | No        | -       | Employment duration (months) | `36`                 |
| `creditScore`        | number | No        | -       | Credit score (300-850)       | `720`                |
| `existingDebt`       | number | No        | 0       | Existing debt (USD)          | `15000`              |
| `collateralType`     | string | No        | -       | Collateral type              | `property`           |
| `collateralValue`    | number | No        | -       | Collateral value (USD)       | `100000`             |

**Example Request:**

```bash
curl -X POST http://localhost:3001/api/loans/apply \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "amount": 25000,
    "purpose": "business_expansion",
    "termMonths": 24,
    "monthlyIncome": 8000,
    "employmentStatus": "employed",
    "employmentDuration": 36,
    "creditScore": 720,
    "existingDebt": 15000,
    "collateralType": "property",
    "collateralValue": 100000
  }'
```

**Example Response:**

```json
{
    "success": true,
    "data": {
        "loanId": "loan_abc123",
        "status": "pending_review",
        "aiRiskScore": 72.5,
        "riskLevel": "medium",
        "recommendedInterestRate": 8.5,
        "monthlyPayment": 1127.42,
        "totalRepayment": 27058.08,
        "estimatedApprovalTime": "2-4 hours"
    },
    "message": "Loan application submitted successfully"
}
```

---

### Get Marketplace Loans

Browse available loans for funding.

**Endpoint:** `GET /loans`

**Auth Required:** No (but recommended for personalized results)

**Query Parameters:**

| Name           | Type   | Required? | Default     | Description                | Example              |
| -------------- | ------ | --------- | ----------- | -------------------------- | -------------------- |
| `page`         | number | No        | 1           | Page number                | `1`                  |
| `limit`        | number | No        | 20          | Items per page             | `20`                 |
| `status`       | string | No        | -           | Loan status filter         | `pending_funding`    |
| `minAmount`    | number | No        | -           | Minimum loan amount        | `10000`              |
| `maxAmount`    | number | No        | -           | Maximum loan amount        | `50000`              |
| `maxRiskScore` | number | No        | -           | Maximum AI risk score      | `75`                 |
| `purpose`      | string | No        | -           | Loan purpose filter        | `business_expansion` |
| `sortBy`       | string | No        | `createdAt` | Sort field                 | `interestRate`       |
| `sortOrder`    | string | No        | `desc`      | Sort order (`asc`, `desc`) | `desc`               |

**Example Request:**

```bash
curl -X GET "http://localhost:3001/api/loans?status=pending_funding&minAmount=10000&maxAmount=50000&maxRiskScore=75&sortBy=interestRate&sortOrder=desc&page=1&limit=20"
```

**Example Response:**

```json
{
    "success": true,
    "data": {
        "loans": [
            {
                "loanId": "loan_xyz789",
                "borrower": {
                    "username": "borrower123",
                    "creditScore": 720,
                    "aiRiskScore": 68.2,
                    "successfulLoans": 3
                },
                "amount": 25000,
                "interestRate": 9.5,
                "termMonths": 24,
                "purpose": "business_expansion",
                "monthlyPayment": 1152.5,
                "totalReturn": 27660,
                "roi": 10.64,
                "status": "pending_funding",
                "fundingDeadline": "2024-02-01T00:00:00Z"
            }
        ],
        "pagination": {
            "page": 1,
            "limit": 20,
            "totalItems": 48,
            "totalPages": 3,
            "hasNext": true,
            "hasPrev": false
        }
    }
}
```

---

### Get Loan Details

Get detailed information about a specific loan.

**Endpoint:** `GET /loans/:id`

**Auth Required:** No

**Path Parameters:**

| Name | Type   | Required? | Description | Example       |
| ---- | ------ | --------- | ----------- | ------------- |
| `id` | string | Yes       | Loan ID     | `loan_abc123` |

**Example Request:**

```bash
curl -X GET http://localhost:3001/api/loans/loan_abc123
```

**Example Response:**

```json
{
    "success": true,
    "data": {
        "loan": {
            "loanId": "loan_abc123",
            "borrower": {
                "userId": "user_borrower123",
                "username": "johndoe",
                "creditScore": 720,
                "aiRiskScore": 72.5,
                "reputation": 4.8,
                "successfulLoans": 5,
                "defaultedLoans": 0
            },
            "amount": 25000,
            "interestRate": 8.5,
            "termMonths": 24,
            "purpose": "business_expansion",
            "status": "active",
            "disbursedDate": "2024-01-15T00:00:00Z",
            "maturityDate": "2026-01-15T00:00:00Z",
            "monthlyPayment": 1127.42,
            "totalRepayment": 27058.08,
            "amountRepaid": 5637.1,
            "remainingBalance": 21420.98,
            "paymentsCompleted": 5,
            "paymentsRemaining": 19,
            "nextPaymentDate": "2024-06-15T00:00:00Z",
            "nextPaymentAmount": 1127.42,
            "collateral": {
                "type": "property",
                "value": 100000,
                "description": "Commercial property"
            },
            "aiAssessment": {
                "riskScore": 72.5,
                "riskLevel": "medium",
                "defaultProbability": 4.2,
                "factors": ["Good credit history", "Stable employment", "Adequate collateral"]
            }
        }
    }
}
```

---

### Get User's Loans

Get all loans for authenticated user (as borrower or lender).

**Endpoint:** `GET /loans/user/my-loans`

**Auth Required:** Yes

**Query Parameters:**

| Name     | Type   | Required? | Default | Description                          | Example    |
| -------- | ------ | --------- | ------- | ------------------------------------ | ---------- |
| `role`   | string | No        | -       | Filter by role: `borrower`, `lender` | `borrower` |
| `status` | string | No        | -       | Filter by status                     | `active`   |
| `page`   | number | No        | 1       | Page number                          | `1`        |
| `limit`  | number | No        | 20      | Items per page                       | `20`       |

**Example Request:**

```bash
curl -X GET "http://localhost:3001/api/loans/user/my-loans?role=borrower&status=active" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

### Fund a Loan

Fund a loan as a lender.

**Endpoint:** `POST /loans/:id/fund`

**Auth Required:** Yes

**Request Body:**

| Name            | Type    | Required? | Default | Description              | Example  |
| --------------- | ------- | --------- | ------- | ------------------------ | -------- |
| `amount`        | number  | Yes       | -       | Funding amount (USD)     | `25000`  |
| `fundingSource` | string  | Yes       | -       | Source: `wallet`, `bank` | `wallet` |
| `acceptTerms`   | boolean | Yes       | -       | Accept loan terms        | `true`   |

**Example Request:**

```bash
curl -X POST http://localhost:3001/api/loans/loan_xyz789/fund \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "amount": 25000,
    "fundingSource": "wallet",
    "acceptTerms": true
  }'
```

---

### Make Repayment

Make a loan repayment.

**Endpoint:** `POST /loans/:id/repay`

**Auth Required:** Yes (must be borrower)

**Request Body:**

| Name            | Type   | Required? | Default | Description            | Example         |
| --------------- | ------ | --------- | ------- | ---------------------- | --------------- |
| `amount`        | number | Yes       | -       | Repayment amount (USD) | `1127.42`       |
| `paymentMethod` | string | Yes       | -       | Payment method         | `bank_transfer` |

**Example Request:**

```bash
curl -X POST http://localhost:3001/api/loans/loan_abc123/repay \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "amount": 1127.42,
    "paymentMethod": "bank_transfer"
  }'
```

---

## User Endpoints

### Get User Dashboard

Get user dashboard with statistics.

**Endpoint:** `GET /users/dashboard`

**Auth Required:** Yes

**Example Response:**

```json
{
  "success": true,
  "data": {
    "borrower": {
      "activeLoans": 2,
      "totalBorrowed": 45000,
      "totalRepaid": 12500,
      "creditScore": 720,
      "nextPaymentDue": "2024-02-15T00:00:00Z",
      "nextPaymentAmount": 1127.42
    },
    "lender": {
      "activeInvestments": 8,
      "totalInvested": 150000,
      "totalReturns": 18750,
      "averageROI": 12.5,
      "portfolioValue": 168750
    },
    "recentActivity": [...]
  }
}
```

---

## Admin Endpoints

### Get Platform Statistics

Get platform-wide statistics.

**Endpoint:** `GET /admin/statistics`

**Auth Required:** Yes (admin only)

**Example Response:**

```json
{
    "success": true,
    "data": {
        "users": {
            "total": 15420,
            "borrowers": 8950,
            "lenders": 6470,
            "verified": 12340
        },
        "loans": {
            "total": 5280,
            "active": 1850,
            "funded": 4120,
            "defaulted": 95
        },
        "financials": {
            "totalLent": 125400000,
            "totalRepaid": 98200000,
            "platformRevenue": 3250000,
            "defaultRate": 1.8
        }
    }
}
```

---

## Webhooks

LendSmart supports webhooks for real-time event notifications.

### Webhook Events

| Event            | Description                    |
| ---------------- | ------------------------------ |
| `loan.created`   | New loan application submitted |
| `loan.approved`  | Loan approved by AI/admin      |
| `loan.funded`    | Loan fully funded              |
| `loan.repayment` | Repayment received             |
| `loan.defaulted` | Loan marked as defaulted       |
| `user.verified`  | KYC verification completed     |

### Webhook Payload Example

```json
{
    "event": "loan.funded",
    "timestamp": "2024-01-15T12:00:00Z",
    "data": {
        "loanId": "loan_abc123",
        "amount": 25000,
        "lender": "user_lender456"
    }
}
```

---

**Need help?** Check [Usage Guide](USAGE.md) for practical examples or [Troubleshooting](TROUBLESHOOTING.md) for common issues.
