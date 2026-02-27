# Contributing Guide

**Contributing to LendSmart**

Thank you for your interest in contributing to LendSmart! This document provides guidelines for contributing to the project.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Requirements](#testing-requirements)
- [Pull Request Process](#pull-request-process)
- [Documentation Updates](#documentation-updates)

---

## Code of Conduct

- **Be respectful:** Treat all contributors with respect
- **Be collaborative:** Work together to improve the project
- **Be constructive:** Provide helpful feedback
- **Be inclusive:** Welcome contributors of all backgrounds

---

## Getting Started

### 1. Fork and Clone

```bash
# Fork the repository on GitHub
# Clone your fork
git clone https://github.com/quantsingularity/LendSmart.git
cd LendSmart

# Add upstream remote
git remote add upstream https://github.com/quantsingularity/LendSmart.git
```

### 2. Set Up Development Environment

```bash
# Run setup script
./scripts/setup_lendsmart_env.sh

# Verify installation
./scripts/run_all_tests.sh
```

### 3. Create Feature Branch

```bash
# Sync with upstream
git fetch upstream
git checkout main
git merge upstream/main

# Create feature branch
git checkout -b feature/your-feature-name
```

---

## Development Workflow

### 1. Make Changes

- Write code following our [Coding Standards](#coding-standards)
- Add tests for new features
- Update documentation as needed

### 2. Test Locally

```bash
# Run tests
./scripts/run_all_tests.sh

# Lint code
./scripts/lint-all.sh --fix

# Test in browser/device
./scripts/run_lendsmart.sh
```

### 3. Commit Changes

```bash
# Stage changes
git add .

# Commit with descriptive message
git commit -m "feat: add loan filtering by risk level

- Add riskLevel query parameter to loan marketplace
- Update API documentation
- Add unit tests for filtering logic"
```

### Commit Message Format

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation only
- `style:` Code style (formatting, no logic change)
- `refactor:` Code refactoring
- `test:` Adding/updating tests
- `chore:` Maintenance tasks

**Examples:**

```
feat(api): add loan repayment endpoint

Implement POST /api/loans/:id/repay endpoint for loan repayment.
Includes validation, blockchain interaction, and notifications.

Closes #123
```

```
fix(smart-contract): prevent reentrancy in fundLoan

Add ReentrancyGuard to fundLoan() function to prevent
reentrancy attacks. Updated tests to verify protection.

Resolves #456
```

### 4. Push and Create Pull Request

```bash
# Push to your fork
git push origin feature/your-feature-name

# Create pull request on GitHub
```

---

## Coding Standards

### JavaScript/Node.js

**Style Guide:** Airbnb JavaScript Style Guide

```javascript
// Use const/let, not var
const apiUrl = process.env.API_URL;
let retryCount = 0;

// Use arrow functions
const calculateInterest = (principal, rate, term) => {
  return (principal * rate * term) / 100;
};

// Use async/await over promises
async function getLoan(loanId) {
  try {
    const loan = await Loan.findById(loanId);
    return loan;
  } catch (error) {
    logger.error("Failed to get loan", { loanId, error });
    throw error;
  }
}

// Destructuring
const { email, password } = req.body;

// Template literals
const message = `Loan ${loanId} has been approved`;

// Optional chaining
const creditScore = user?.profile?.creditScore;
```

**ESLint Configuration:** `.eslintrc.js`

```bash
# Check linting
npm run lint

# Auto-fix
npm run lint -- --fix
```

### Solidity

**Style Guide:** Solidity Style Guide

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/utils/ReentrancyGuard.sol';

/**
 * @title LoanContract
 * @dev Smart contract for managing loans
 */
contract LoanContract is Ownable, ReentrancyGuard {
    // State variables
    uint256 public nextLoanId;

    // Events
    event LoanCreated(uint256 indexed loanId, address indexed borrower);

    // Modifiers
    modifier onlyBorrower(uint256 _loanId) {
        require(loans[_loanId].borrower == msg.sender, 'Not borrower');
        _;
    }

    // External functions
    function createLoan(uint256 _amount) external nonReentrant returns (uint256) {
        // Function logic
    }

    // Internal functions
    function _calculateInterest(uint256 _principal) internal pure returns (uint256) {
        // Calculation
    }
}
```

### Python

**Style Guide:** PEP 8

```python
"""
Module for credit scoring model.

This module provides machine learning models for credit scoring.
"""

import pandas as pd
from typing import Dict, List, Optional


class CreditScoringModel:
    """Credit scoring model using ensemble methods."""

    def __init__(self, config: Optional[Dict] = None) -> None:
        """
        Initialize the credit scoring model.

        Args:
            config: Configuration dictionary with model parameters
        """
        self.config = config or {}
        self.model = None

    def train(self, X: pd.DataFrame, y: pd.Series) -> None:
        """
        Train the credit scoring model.

        Args:
            X: Feature dataframe
            y: Target series
        """
        # Training logic
        pass

    def predict(self, X: pd.DataFrame) -> pd.Series:
        """
        Predict credit scores.

        Args:
            X: Feature dataframe

        Returns:
            Predicted credit scores
        """
        # Prediction logic
        pass
```

**Formatting:** Use `black` and `isort`

```bash
# Format code
black .
isort .

# Check formatting
black --check .
```

### React/TypeScript

```typescript
import React, { useState, useEffect } from 'react';

interface LoanCardProps {
  loanId: string;
  amount: number;
  interestRate: number;
  onSelect: (loanId: string) => void;
}

export const LoanCard: React.FC<LoanCardProps> = ({
  loanId,
  amount,
  interestRate,
  onSelect,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    try {
      await onSelect(loanId);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="loan-card">
      <h3>Loan #{loanId}</h3>
      <p>Amount: ${amount}</p>
      <p>Rate: {interestRate}%</p>
      <button onClick={handleClick} disabled={isLoading}>
        {isLoading ? 'Loading...' : 'Select'}
      </button>
    </div>
  );
};
```

---

## Testing Requirements

### Test Coverage

Minimum coverage requirements:

- **Unit Tests:** 80% coverage
- **Integration Tests:** All API endpoints
- **Smart Contracts:** 90% coverage
- **Frontend:** 70% coverage

### Writing Tests

#### Backend Tests (Jest)

```javascript
describe("Loan Controller", () => {
  describe("applyForLoan", () => {
    it("should create a new loan application", async () => {
      const loanData = {
        amount: 25000,
        purpose: "business",
        termMonths: 24,
      };

      const response = await request(app)
        .post("/api/loans/apply")
        .set("Authorization", `Bearer ${authToken}`)
        .send(loanData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.loanId).toBeDefined();
    });

    it("should reject loan with invalid amount", async () => {
      const response = await request(app)
        .post("/api/loans/apply")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ amount: -1000 })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});
```

#### Smart Contract Tests (Hardhat)

```javascript
describe("LendSmartLoan", () => {
  let loanContract;
  let owner, borrower, lender;

  beforeEach(async () => {
    [owner, borrower, lender] = await ethers.getSigners();
    const LoanContract = await ethers.getContractFactory("LendSmartLoan");
    loanContract = await LoanContract.deploy(
      owner.address,
      100,
      owner.address,
      owner.address,
    );
  });

  describe("requestLoan", () => {
    it("should create a new loan request", async () => {
      const tx = await loanContract.connect(borrower).requestLoan(
        tokenAddress,
        ethers.utils.parseEther("10"),
        500, // 5% interest
        365 * 24 * 60 * 60, // 1 year
        "Business expansion",
        false,
      );

      const receipt = await tx.wait();
      const event = receipt.events.find((e) => e.event === "LoanRequested");

      expect(event).to.not.be.undefined;
      expect(event.args.borrower).to.equal(borrower.address);
    });
  });
});
```

#### Python Tests (pytest)

```python
import pytest
from src.credit_scoring_model import CreditScoringModel

@pytest.fixture
def model():
    return CreditScoringModel(config={'model_type': 'random_forest'})

def test_model_training(model, sample_data):
    X, y = sample_data
    model.train(X, y)
    assert model.model is not None

def test_model_prediction(model, sample_data):
    X, y = sample_data
    model.train(X, y)
    predictions = model.predict(X)
    assert len(predictions) == len(X)
    assert all(0 <= p <= 100 for p in predictions)
```

### Running Tests

```bash
# All tests
./scripts/run_all_tests.sh

# Specific component
./scripts/run_all_tests.sh backend
./scripts/run_all_tests.sh contracts
./scripts/run_all_tests.sh frontend

# With coverage
./scripts/run_all_tests.sh --coverage
```

---

## Pull Request Process

### 1. Pre-PR Checklist

- [ ] Code follows style guidelines
- [ ] Tests added/updated and passing
- [ ] Documentation updated
- [ ] Commit messages follow convention
- [ ] No merge conflicts with main
- [ ] Linting passes

### 2. Create Pull Request

**Title Format:**

```
<type>: <short description>
```

**Description Template:**

```markdown
## Description

Brief description of changes

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing

- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist

- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No new warnings

## Related Issues

Closes #123
```

### 3. Review Process

- **Automated Checks:** CI/CD pipeline must pass
- **Code Review:** At least 1 approval required
- **Review Time:** Expect response within 2-3 business days

### 4. Addressing Feedback

```bash
# Make requested changes
git add .
git commit -m "refactor: address PR feedback"
git push origin feature/your-feature-name
```

### 5. Merge

Once approved, maintainers will merge your PR.

---

## Documentation Updates

### When to Update Docs

- Adding new features
- Changing APIs
- Fixing bugs that affect usage
- Improving examples

### Documentation Structure

```
docs/
├── README.md                 # Docs index
├── INSTALLATION.md           # Installation guide
├── USAGE.md                  # Usage patterns
├── API.md                    # API reference
├── CONFIGURATION.md          # Configuration options
├── ARCHITECTURE.md           # System architecture
├── FEATURE_MATRIX.md         # Feature overview
├── CLI.md                    # CLI reference
├── CONTRIBUTING.md           # This file
├── TROUBLESHOOTING.md        # Common issues
└── examples/                 # Code examples
```

### Writing Documentation

- **Clear and concise:** Short paragraphs, bullet points
- **Examples:** Include working code examples
- **Links:** Cross-reference related docs
- **Updated:** Keep in sync with code changes

---

### Creating a Release

Maintainers only:

```bash
# Update version
npm version minor  # or major/patch

# Create release tag
git tag -a v2.1.0 -m "Release v2.1.0"
git push origin v2.1.0

# Create GitHub release
# Automated via GitHub Actions
```

---
