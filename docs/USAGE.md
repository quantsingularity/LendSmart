# Usage Guide

**LendSmart Platform Usage Patterns**

This guide covers typical usage patterns for borrowers, lenders, and administrators.

---

## Table of Contents

- [Quick Start](#quick-start)
- [User Roles](#user-roles)
- [Borrower Workflows](#borrower-workflows)
- [Lender Workflows](#lender-workflows)
- [Administrator Workflows](#administrator-workflows)
- [CLI Usage](#cli-usage)
- [Library Usage](#library-usage)

---

## Quick Start

### 1. Start the Platform

```bash
# Start all services
cd LendSmart
./scripts/run_lendsmart.sh

# Or start individual components
cd code/backend && npm run dev  # Terminal 1
cd code/web-frontend && npm start  # Terminal 2
```

### 2. Access the Platform

- **Web Application:** http://localhost:3000
- **Backend API:** http://localhost:3001/api
- **API Documentation:** http://localhost:3001/api-docs

### 3. Create an Account

```bash
# Using curl
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!",
    "username": "johndoe",
    "role": "borrower"
  }'
```

---

## User Roles

| Role              | Description                         | Key Features                                           |
| ----------------- | ----------------------------------- | ------------------------------------------------------ |
| **Borrower**      | Requests loans and makes repayments | Apply for loans, view loan status, make payments       |
| **Lender**        | Funds loans and earns interest      | Browse loans, fund opportunities, track returns        |
| **Administrator** | Manages platform and users          | User management, system monitoring, compliance reports |

---

## Borrower Workflows

### Workflow 1: Apply for a Loan

#### Step 1: Register and Complete KYC

```bash
# Register account
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "borrower@example.com",
    "password": "SecurePass123!",
    "username": "borrower1",
    "firstName": "John",
    "lastName": "Doe",
    "role": "borrower"
  }'

# Login to get token
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "borrower@example.com",
    "password": "SecurePass123!"
  }'

# Response includes access_token
```

#### Step 2: Submit Loan Application

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

**Expected Response:**

```json
{
  "success": true,
  "data": {
    "loanId": "loan_abc123",
    "status": "pending_review",
    "aiRiskScore": 72.5,
    "recommendedInterestRate": 8.5,
    "estimatedApprovalTime": "2-4 hours",
    "monthlyPayment": 1127.42
  }
}
```

#### Step 3: Check Loan Status

```bash
curl -X GET http://localhost:3001/api/loans/loan_abc123 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### Step 4: Accept Loan Terms (if approved)

```bash
curl -X POST http://localhost:3001/api/loans/loan_abc123/accept \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Workflow 2: Make Loan Repayment

```bash
curl -X POST http://localhost:3001/api/loans/loan_abc123/repay \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "amount": 1127.42,
    "paymentMethod": "bank_transfer"
  }'
```

### Workflow 3: View Loan History

```bash
# Get all user's loans
curl -X GET "http://localhost:3001/api/loans/user/my-loans" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Get specific loan details
curl -X GET "http://localhost:3001/api/loans/loan_abc123" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## Lender Workflows

### Workflow 1: Browse Available Loans

```bash
# Get marketplace loans with filters
curl -X GET "http://localhost:3001/api/loans?status=pending_funding&minAmount=10000&maxAmount=50000&maxRiskScore=75&sortBy=interestRate&sortOrder=desc" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected Response:**

```json
{
  "success": true,
  "data": {
    "loans": [
      {
        "loanId": "loan_xyz789",
        "borrower": {
          "creditScore": 720,
          "aiRiskScore": 68.2
        },
        "amount": 25000,
        "interestRate": 9.5,
        "termMonths": 24,
        "purpose": "business_expansion",
        "monthlyPayment": 1152.5,
        "totalReturn": 27660
      }
    ],
    "pagination": {
      "page": 1,
      "totalPages": 5,
      "totalLoans": 48
    }
  }
}
```

### Workflow 2: Fund a Loan

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

### Workflow 3: Track Portfolio Performance

```bash
# Get lender dashboard
curl -X GET http://localhost:3001/api/users/dashboard \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected Response:**

```json
{
  "success": true,
  "data": {
    "portfolio": {
      "totalInvested": 150000,
      "activeLoans": 8,
      "totalReturns": 18750,
      "averageROI": 12.5,
      "defaultRate": 2.3
    },
    "recentActivity": [...]
  }
}
```

---

## Administrator Workflows

### Workflow 1: View Platform Statistics

```bash
curl -X GET http://localhost:3001/api/admin/statistics \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Workflow 2: Manage Users

```bash
# List users with filters
curl -X GET "http://localhost:3001/api/admin/users?role=borrower&status=active&page=1&limit=20" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Update user status
curl -X PATCH http://localhost:3001/api/admin/users/user_123/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "status": "suspended",
    "reason": "Policy violation"
  }'
```

### Workflow 3: Generate Compliance Reports

```bash
curl -X POST http://localhost:3001/api/admin/reports/compliance \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "reportType": "kyc_audit",
    "startDate": "2024-01-01",
    "endDate": "2024-12-31",
    "format": "pdf"
  }'
```

---

## CLI Usage

LendSmart provides several command-line scripts for automation and management.

### Script Locations

All scripts are located in `scripts/` directory.

### Available Scripts

| Script                      | Purpose                   | Usage Example                                        |
| --------------------------- | ------------------------- | ---------------------------------------------------- |
| `setup_lendsmart_env.sh`    | Initial environment setup | `./scripts/setup_lendsmart_env.sh`                   |
| `run_lendsmart.sh`          | Start all services        | `./scripts/run_lendsmart.sh`                         |
| `run_all_tests.sh`          | Run complete test suite   | `./scripts/run_all_tests.sh`                         |
| `smart_contract_manager.sh` | Deploy/manage contracts   | `./scripts/smart_contract_manager.sh deploy mainnet` |
| `ml_model_manager.sh`       | Train/deploy ML models    | `./scripts/ml_model_manager.sh train`                |

### Setup Script

```bash
# Run initial setup
./scripts/setup_lendsmart_env.sh

# What it does:
# - Checks prerequisites
# - Installs dependencies
# - Creates .env files
# - Initializes databases
# - Seeds initial data
```

### Run Platform Script

```bash
# Start all components
./scripts/run_lendsmart.sh

# Start specific component
./scripts/run_lendsmart.sh backend
./scripts/run_lendsmart.sh frontend
./scripts/run_lendsmart.sh mobile
```

### Smart Contract Manager

```bash
# Compile contracts
./scripts/smart_contract_manager.sh compile

# Deploy to network
./scripts/smart_contract_manager.sh deploy goerli

# Verify contract
./scripts/smart_contract_manager.sh verify goerli 0xContractAddress

# Run contract tests
./scripts/smart_contract_manager.sh test
```

### ML Model Manager

```bash
# Train credit scoring model
./scripts/ml_model_manager.sh train --data data/loans.csv

# Evaluate model
./scripts/ml_model_manager.sh evaluate --model models/credit_model.joblib

# Deploy model service
./scripts/ml_model_manager.sh serve --port 8000
```

### Test Runner

```bash
# Run all tests
./scripts/run_all_tests.sh

# Run specific test suite
./scripts/run_all_tests.sh backend
./scripts/run_all_tests.sh frontend
./scripts/run_all_tests.sh contracts
./scripts/run_all_tests.sh integration
```

---

## Library Usage

### Backend API Client (Node.js)

```javascript
// Install client
// npm install axios

const axios = require("axios");

class LendSmartClient {
  constructor(baseURL, apiKey) {
    this.client = axios.create({
      baseURL: baseURL,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
    });
  }

  // Apply for loan
  async applyForLoan(loanData) {
    const response = await this.client.post("/loans/apply", loanData);
    return response.data;
  }

  // Get loan details
  async getLoan(loanId) {
    const response = await this.client.get(`/loans/${loanId}`);
    return response.data;
  }

  // Fund a loan
  async fundLoan(loanId, amount) {
    const response = await this.client.post(`/loans/${loanId}/fund`, {
      amount,
    });
    return response.data;
  }
}

// Usage
const client = new LendSmartClient("http://localhost:3001/api", "your_api_key");

// Apply for loan
const loan = await client.applyForLoan({
  amount: 25000,
  purpose: "business_expansion",
  termMonths: 24,
  monthlyIncome: 8000,
});

console.log("Loan application submitted:", loan.data.loanId);
```

### Smart Contract Interaction (ethers.js)

```javascript
const { ethers } = require("ethers");

// Contract ABI (simplified)
const LOAN_CONTRACT_ABI = [
  "function requestLoan(address token, uint256 principal, uint256 interestRate, uint256 duration, string purpose, bool isCollateralized) external returns (uint256)",
  "function getLoan(uint256 loanId) external view returns (tuple(uint256 id, address borrower, address lender, uint256 principal, uint256 interestRate, uint8 status))",
  "function fundLoan(uint256 loanId) external",
  "function makeRepayment(uint256 loanId, uint256 amount) external",
];

// Initialize provider and contract
const provider = new ethers.providers.JsonRpcProvider(
  "https://mainnet.infura.io/v3/YOUR_PROJECT_ID",
);
const wallet = new ethers.Wallet("YOUR_PRIVATE_KEY", provider);
const loanContract = new ethers.Contract(
  "CONTRACT_ADDRESS",
  LOAN_CONTRACT_ABI,
  wallet,
);

// Request a loan
async function requestLoan() {
  const tx = await loanContract.requestLoan(
    "0xTokenAddress", // Token address
    ethers.utils.parseEther("10"), // 10 ETH
    500, // 5% interest rate
    365 * 24 * 60 * 60, // 1 year duration
    "Business expansion", // Purpose
    true, // Collateralized
  );

  const receipt = await tx.wait();
  console.log("Loan requested. Transaction:", receipt.transactionHash);

  // Extract loan ID from event
  const event = receipt.events.find((e) => e.event === "LoanRequested");
  const loanId = event.args.loanId;

  return loanId;
}

// Get loan details
async function getLoanDetails(loanId) {
  const loan = await loanContract.getLoan(loanId);
  console.log("Loan Details:", {
    id: loan.id.toString(),
    borrower: loan.borrower,
    principal: ethers.utils.formatEther(loan.principal),
    interestRate: loan.interestRate.toString(),
    status: loan.status,
  });
  return loan;
}

// Usage
const loanId = await requestLoan();
await getLoanDetails(loanId);
```

### Python Credit Scoring Client

```python
import requests

class CreditScoringClient:
    def __init__(self, base_url, api_key):
        self.base_url = base_url
        self.headers = {
            'Content-Type': 'application/json',
            'X-API-Key': api_key
        }

    def calculate_credit_score(self, borrower_data):
        """Calculate credit score using AI model"""
        response = requests.post(
            f'{self.base_url}/api/v1/score',
            json=borrower_data,
            headers=self.headers
        )
        return response.json()

    def assess_risk(self, loan_data):
        """Assess loan risk"""
        response = requests.post(
            f'{self.base_url}/api/v1/risk-assessment',
            json=loan_data,
            headers=self.headers
        )
        return response.json()

# Usage
client = CreditScoringClient('http://localhost:8000', 'your_api_key')

# Calculate credit score
borrower = {
    'credit_score': 720,
    'annual_income': 75000,
    'employment_status': 'employed',
    'employment_duration': 36,
    'existing_debt': 15000,
    'debt_to_income_ratio': 0.2
}

result = client.calculate_credit_score(borrower)
print(f"AI Credit Score: {result['score']}")
print(f"Risk Level: {result['risk_level']}")
print(f"Recommended Interest Rate: {result['interest_rate']}%")
```

---

## Common Usage Patterns

### Pattern 1: End-to-End Loan Process

```bash
# 1. Borrower applies
LOAN_RESPONSE=$(curl -X POST http://localhost:3001/api/loans/apply \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $BORROWER_TOKEN" \
  -d '{"amount": 25000, "purpose": "business", "termMonths": 24}')

LOAN_ID=$(echo $LOAN_RESPONSE | jq -r '.data.loanId')

# 2. Check AI risk assessment
curl -X GET "http://localhost:3001/api/loans/$LOAN_ID" \
  -H "Authorization: Bearer $BORROWER_TOKEN"

# 3. Lender funds the loan
curl -X POST "http://localhost:3001/api/loans/$LOAN_ID/fund" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LENDER_TOKEN" \
  -d '{"amount": 25000}'

# 4. Borrower makes repayment
curl -X POST "http://localhost:3001/api/loans/$LOAN_ID/repay" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $BORROWER_TOKEN" \
  -d '{"amount": 1127.42}'
```

### Pattern 2: Portfolio Diversification (Lender)

```javascript
// Lender strategy: Diversify across multiple loans
async function diversifyPortfolio(client, budget, riskTolerance) {
  // Get available loans within risk tolerance
  const loans = await client.getMarketplaceLoans({
    maxRiskScore: riskTolerance,
    sortBy: "interestRate",
    sortOrder: "desc",
  });

  // Calculate investment per loan
  const investmentPerLoan = budget / 10; // Diversify across 10 loans

  // Fund loans
  const funded = [];
  for (const loan of loans.data.loans.slice(0, 10)) {
    try {
      const result = await client.fundLoan(loan.loanId, investmentPerLoan);
      funded.push(result);
    } catch (error) {
      console.error(`Failed to fund loan ${loan.loanId}:`, error);
    }
  }

  return funded;
}
```

### Pattern 3: Automated Repayment Setup

```javascript
// Setup automatic monthly repayments
async function setupAutoRepayment(client, loanId, paymentMethod) {
  const loan = await client.getLoan(loanId);

  // Schedule monthly payment
  const repaymentSchedule = {
    loanId: loanId,
    amount: loan.data.monthlyPayment,
    frequency: "monthly",
    paymentMethod: paymentMethod,
    startDate: new Date(),
    endDate: loan.data.maturityDate,
  };

  const result = await client.setupAutoPay(repaymentSchedule);
  console.log("Auto-repayment configured:", result);
}
```

---

## Best Practices

### For Borrowers

1. **Complete KYC early** - Speeds up loan approval
2. **Provide accurate information** - Improves AI credit score
3. **Choose appropriate loan terms** - Match repayment to income
4. **Setup automatic payments** - Avoid late fees
5. **Build credit history** - Repay on time for better future rates

### For Lenders

1. **Diversify portfolio** - Spread risk across multiple loans
2. **Review borrower profiles** - Check credit scores and history
3. **Monitor portfolio** - Track performance regularly
4. **Reinvest returns** - Compound earnings
5. **Set risk tolerance** - Stick to your investment strategy

### For Developers

1. **Use API versioning** - `/api/v1/` in all requests
2. **Handle errors gracefully** - Check response status codes
3. **Implement rate limiting** - Respect API limits
4. **Cache responses** - Reduce API calls
5. **Use webhooks** - Get real-time updates

---

## Next Steps

- **Explore API:** See [API Reference](API.md) for complete endpoint documentation
- **Review Examples:** Check [Examples Directory](examples/) for code samples
- **Learn Architecture:** Read [Architecture Overview](ARCHITECTURE.md)
- **Troubleshooting:** Visit [Troubleshooting Guide](TROUBLESHOOTING.md)

---

**Ready to build!** Check out the [API Reference](API.md) for detailed endpoint documentation.
