# Loan Application Example

**Complete Loan Application Flow**

This example demonstrates the complete loan application process from borrower perspective.

---

## Overview

This example covers:

1. User registration and authentication
2. Submitting a loan application
3. AI credit scoring
4. Checking loan status
5. Accepting loan terms

---

## Prerequisites

- Backend API running at `http://localhost:3001`
- Valid email address for registration

---

## Step 1: Register a New Borrower

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "borrower@example.com",
    "password": "SecurePass123!",
    "username": "johnborrower",
    "firstName": "John",
    "lastName": "Doe",
    "role": "borrower",
    "phoneNumber": "+1234567890",
    "dateOfBirth": "1990-01-01"
  }'
```

**Expected Response:**

```json
{
    "success": true,
    "data": {
        "user": {
            "id": "user_abc123",
            "email": "borrower@example.com",
            "username": "johnborrower",
            "role": "borrower"
        },
        "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
}
```

**Save the access token for subsequent requests.**

---

## Step 2: Login (if already registered)

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "borrower@example.com",
    "password": "SecurePass123!"
  }'
```

---

## Step 3: Submit Loan Application

```bash
export ACCESS_TOKEN="your_access_token_here"

curl -X POST http://localhost:3001/api/loans/apply \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
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
    "collateralValue": 100000,
    "businessRevenue": 120000,
    "businessType": "technology"
  }'
```

**Expected Response:**

```json
{
    "success": true,
    "data": {
        "loanId": "loan_xyz789",
        "status": "pending_review",
        "aiRiskScore": 72.5,
        "riskLevel": "medium",
        "recommendedInterestRate": 8.5,
        "monthlyPayment": 1127.42,
        "totalRepayment": 27058.08,
        "estimatedApprovalTime": "2-4 hours",
        "breakdown": {
            "principal": 25000,
            "totalInterest": 2058.08,
            "effectiveAPR": 8.64
        },
        "aiAssessment": {
            "defaultProbability": 4.2,
            "riskFactors": [
                {
                    "factor": "credit_score",
                    "impact": "positive",
                    "weight": 0.35
                },
                {
                    "factor": "debt_to_income_ratio",
                    "impact": "neutral",
                    "weight": 0.2
                },
                {
                    "factor": "collateral_coverage",
                    "impact": "positive",
                    "weight": 0.25
                }
            ],
            "recommendations": ["Good credit history", "Adequate collateral", "Stable employment"]
        }
    },
    "message": "Loan application submitted successfully"
}
```

**Save the loanId for tracking.**

---

## Step 4: Check Loan Status

```bash
export LOAN_ID="loan_xyz789"

curl -X GET "http://localhost:3001/api/loans/$LOAN_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Response:**

```json
{
    "success": true,
    "data": {
        "loan": {
            "loanId": "loan_xyz789",
            "status": "pending_funding",
            "borrower": {
                "userId": "user_abc123",
                "username": "johnborrower",
                "creditScore": 720,
                "reputation": 0
            },
            "amount": 25000,
            "interestRate": 8.5,
            "termMonths": 24,
            "purpose": "business_expansion",
            "monthlyPayment": 1127.42,
            "createdAt": "2024-01-15T10:30:00Z",
            "approvedAt": "2024-01-15T12:15:00Z",
            "fundingDeadline": "2024-02-15T00:00:00Z"
        }
    }
}
```

---

## Step 5: Get All User's Loans

```bash
curl -X GET "http://localhost:3001/api/loans/user/my-loans?role=borrower" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Response:**

```json
{
    "success": true,
    "data": {
        "loans": [
            {
                "loanId": "loan_xyz789",
                "amount": 25000,
                "status": "pending_funding",
                "interestRate": 8.5,
                "createdAt": "2024-01-15T10:30:00Z"
            }
        ],
        "summary": {
            "totalLoans": 1,
            "totalBorrowed": 25000,
            "activeLoans": 0,
            "completedLoans": 0
        }
    }
}
```

---

## Step 6: Once Funded - View Loan Details

After a lender funds your loan:

```bash
curl -X GET "http://localhost:3001/api/loans/$LOAN_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Response with Funding:**

```json
{
    "success": true,
    "data": {
        "loan": {
            "loanId": "loan_xyz789",
            "status": "active",
            "lender": {
                "userId": "user_lender456",
                "username": "janelender",
                "reputation": 4.8
            },
            "amount": 25000,
            "fundedDate": "2024-01-16T14:20:00Z",
            "disbursedDate": "2024-01-16T14:25:00Z",
            "maturityDate": "2026-01-16T00:00:00Z",
            "repaymentSchedule": [
                {
                    "paymentNumber": 1,
                    "dueDate": "2024-02-16T00:00:00Z",
                    "amount": 1127.42,
                    "principal": 956.09,
                    "interest": 171.33,
                    "status": "pending"
                },
                {
                    "paymentNumber": 2,
                    "dueDate": "2024-03-16T00:00:00Z",
                    "amount": 1127.42,
                    "principal": 962.86,
                    "interest": 164.56,
                    "status": "pending"
                }
            ]
        }
    }
}
```

---

## Step 7: Make First Repayment

```bash
curl -X POST "http://localhost:3001/api/loans/$LOAN_ID/repay" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "amount": 1127.42,
    "paymentMethod": "bank_transfer"
  }'
```

**Response:**

```json
{
    "success": true,
    "data": {
        "repayment": {
            "repaymentId": "repay_123",
            "loanId": "loan_xyz789",
            "amount": 1127.42,
            "principal": 956.09,
            "interest": 171.33,
            "paidDate": "2024-02-16T09:30:00Z",
            "transactionHash": "0x1234..."
        },
        "loanStatus": {
            "remainingBalance": 24043.91,
            "paymentsCompleted": 1,
            "paymentsRemaining": 23,
            "nextPaymentDue": "2024-03-16T00:00:00Z",
            "nextPaymentAmount": 1127.42
        }
    },
    "message": "Repayment successful"
}
```

---

## Complete JavaScript Example

```javascript
const axios = require('axios');

const API_URL = 'http://localhost:3001/api';

class LoanApplication {
    constructor() {
        this.accessToken = null;
        this.loanId = null;
    }

    async register() {
        const response = await axios.post(`${API_URL}/auth/register`, {
            email: 'borrower@example.com',
            password: 'SecurePass123!',
            username: 'johnborrower',
            firstName: 'John',
            lastName: 'Doe',
            role: 'borrower',
        });

        this.accessToken = response.data.data.accessToken;
        console.log('Registered successfully');
        return response.data;
    }

    async applyForLoan() {
        const response = await axios.post(
            `${API_URL}/loans/apply`,
            {
                amount: 25000,
                purpose: 'business_expansion',
                termMonths: 24,
                monthlyIncome: 8000,
                employmentStatus: 'employed',
                creditScore: 720,
            },
            {
                headers: {
                    Authorization: `Bearer ${this.accessToken}`,
                },
            },
        );

        this.loanId = response.data.data.loanId;
        console.log('Loan applied:', this.loanId);
        console.log('AI Risk Score:', response.data.data.aiRiskScore);
        console.log('Interest Rate:', response.data.data.recommendedInterestRate);
        return response.data;
    }

    async checkStatus() {
        const response = await axios.get(`${API_URL}/loans/${this.loanId}`, {
            headers: {
                Authorization: `Bearer ${this.accessToken}`,
            },
        });

        console.log('Loan Status:', response.data.data.loan.status);
        return response.data;
    }

    async makeRepayment(amount) {
        const response = await axios.post(
            `${API_URL}/loans/${this.loanId}/repay`,
            {
                amount: amount,
                paymentMethod: 'bank_transfer',
            },
            {
                headers: {
                    Authorization: `Bearer ${this.accessToken}`,
                },
            },
        );

        console.log('Repayment successful');
        console.log('Remaining balance:', response.data.data.loanStatus.remainingBalance);
        return response.data;
    }
}

// Usage
async function main() {
    const app = new LoanApplication();

    try {
        // 1. Register
        await app.register();

        // 2. Apply for loan
        await app.applyForLoan();

        // 3. Check status
        await app.checkStatus();

        // 4. Wait for funding (in real scenario)
        // await new Promise(resolve => setTimeout(resolve, 60000));

        // 5. Make repayment
        // await app.makeRepayment(1127.42);
    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
    }
}

// Run
main();
```

---

## Python Example

```python
import requests

API_URL = "http://localhost:3001/api"

class LoanApplication:
    def __init__(self):
        self.access_token = None
        self.loan_id = None

    def register(self):
        response = requests.post(
            f"{API_URL}/auth/register",
            json={
                "email": "borrower@example.com",
                "password": "SecurePass123!",
                "username": "johnborrower",
                "firstName": "John",
                "lastName": "Doe",
                "role": "borrower"
            }
        )
        data = response.json()
        self.access_token = data["data"]["accessToken"]
        print("Registered successfully")
        return data

    def apply_for_loan(self):
        response = requests.post(
            f"{API_URL}/loans/apply",
            json={
                "amount": 25000,
                "purpose": "business_expansion",
                "termMonths": 24,
                "monthlyIncome": 8000,
                "employmentStatus": "employed",
                "creditScore": 720
            },
            headers={
                "Authorization": f"Bearer {self.access_token}"
            }
        )
        data = response.json()
        self.loan_id = data["data"]["loanId"]
        print(f"Loan applied: {self.loan_id}")
        print(f"AI Risk Score: {data['data']['aiRiskScore']}")
        return data

    def check_status(self):
        response = requests.get(
            f"{API_URL}/loans/{self.loan_id}",
            headers={
                "Authorization": f"Bearer {self.access_token}"
            }
        )
        data = response.json()
        print(f"Loan Status: {data['data']['loan']['status']}")
        return data

# Usage
if __name__ == "__main__":
    app = LoanApplication()
    app.register()
    app.apply_for_loan()
    app.check_status()
```

---

## Next Steps

- **Lender Workflow:** See [Lender Example](../USAGE.md#lender-workflows)
- **Smart Contract Integration:** See [Smart Contract Example](SMART_CONTRACT_EXAMPLE.md)
- **API Reference:** See [API Documentation](../API.md)
