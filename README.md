# Smart Contract-Based Micro-Lending Platform

[![CI Status](https://img.shields.io/github/actions/workflow/status/abrar2030/LendSmart/ci-cd.yml?branch=main&label=CI&logo=github)](https://github.com/abrar2030/LendSmart/actions)
[![CI Status](https://img.shields.io/github/workflow/status/abrar2030/LendSmart/CI/main?label=CI)](https://github.com/abrar2030/LendSmart/actions)
[![Test Coverage](https://img.shields.io/codecov/c/github/abrar2030/LendSmart/main?label=Coverage)](https://codecov.io/gh/abrar2030/LendSmart)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview
The **Smart Contract-Based Micro-Lending Platform** is a decentralized application (DApp) designed to revolutionize peer-to-peer lending. It uses blockchain technology for transparency, AI for borrower risk assessment, and smart contracts to automate loan agreements.

<div align="center">
  <img src="docs/LendSmart.bmp" alt="Smart Contract-Based Micro-Lending Platform" width="100%">
</div>

> **Note**: LendSmart is currently under active development. Features and functionalities are being added and improved continuously to enhance user experience.

## Table of Contents
- [Key Features](#key-features)
- [Feature Implementation Status](#feature-implementation-status)
- [Tools and Technologies](#tools-and-technologies)
- [Architecture](#architecture)
- [Development Workflow](#development-workflow)
- [Installation and Setup](#installation-and-setup)
- [Example Use Cases](#example-use-cases)
- [Testing](#testing)
- [CI/CD Pipeline](#cicd-pipeline)
- [Contributing](#contributing)
- [Future Enhancements](#future-enhancements)
- [License](#license)

## Key Features
- **Decentralized Peer-to-Peer Lending**: Borrowers and lenders interact directly through smart contracts.
- **AI-Powered Risk Assessment**: Machine learning models evaluate borrower creditworthiness.
- **Smart Contracts for Automation**: Secure loan agreements with automatic disbursement and repayment handling.
- **Immutable Records**: Blockchain ensures all loan transactions are tamper-proof and transparent.

## Feature Implementation Status

| Feature | Status | Description | Planned Release |
|---------|--------|-------------|----------------|
| **Peer-to-Peer Lending** |
| Loan Creation | ✅ Implemented | Create and publish loan requests | v1.0 |
| Loan Funding | ✅ Implemented | Fund loan requests as a lender | v1.0 |
| Loan Marketplace | ✅ Implemented | Browse available loans | v1.0 |
| Multi-Currency Support | 🔄 In Progress | Support for multiple currencies | v1.1 |
| Partial Funding | 🔄 In Progress | Allow multiple lenders per loan | v1.1 |
| **Risk Assessment** |
| Credit Scoring | ✅ Implemented | AI-based borrower risk evaluation | v1.0 |
| Default Prediction | ✅ Implemented | ML model for default probability | v1.0 |
| Interest Rate Calculation | ✅ Implemented | Risk-based interest determination | v1.0 |
| Behavioral Analysis | 🔄 In Progress | User behavior patterns analysis | v1.1 |
| Social Credit Scoring | 📅 Planned | Social media data integration | v1.2 |
| **Smart Contracts** |
| Loan Agreements | ✅ Implemented | Automated contract creation | v1.0 |
| Disbursement | ✅ Implemented | Automatic fund transfer to borrower | v1.0 |
| Repayment Handling | ✅ Implemented | Scheduled repayment processing | v1.0 |
| Collateral Management | 🔄 In Progress | Digital asset collateral handling | v1.1 |
| Dispute Resolution | 📅 Planned | Automated conflict resolution | v1.2 |
| **Platform Features** |
| User Profiles | ✅ Implemented | Borrower and lender profiles | v1.0 |
| Transaction History | ✅ Implemented | Record of all platform activities | v1.0 |
| Notifications | ✅ Implemented | Alerts for important events | v1.0 |
| Analytics Dashboard | 🔄 In Progress | Performance metrics and insights | v1.1 |
| Mobile Application | 📅 Planned | Native mobile experience | v1.2 |

**Legend:**
- ✅ Implemented: Feature is complete and available
- 🔄 In Progress: Feature is currently being developed
- 📅 Planned: Feature is planned for future release

## Tools and Technologies

### **Core Technologies**
1. **Blockchain**:
   - Ethereum or Polygon for deploying smart contracts and managing transactions.
2. **AI/ML**:
   - Python libraries like TensorFlow and Scikit-learn for credit risk models.
3. **Smart Contracts**:
   - Solidity for loan agreements and data management.
4. **Database**:
   - MongoDB for off-chain storage of additional borrower and loan data.
5. **Frontend**:
   - React.js for creating a seamless user interface.
6. **Backend**:
   - Node.js with Express for managing API endpoints.

## Architecture

### **1. Frontend**
- **Tech Stack**: React.js with Bootstrap for responsiveness.
- **Responsibilities**:
  - User-friendly interfaces for loan application, approval, and repayment tracking.

### **2. Backend**
- **Tech Stack**: Node.js + Express
- **Responsibilities**:
  - API endpoints to connect the frontend with blockchain and AI models.
  - Manage borrower and loan data securely.

### **3. Blockchain Integration**
- **Smart Contract Usage**:
  - Smart contracts handle loan disbursement, repayment schedules, and dispute resolution.
  - Tokenize loan agreements for added liquidity.

### **4. AI Models**
- **Models Used**:
  - Classification models for borrower default prediction.
  - Regression models to calculate appropriate interest rates.

## Development Workflow

### **1. Smart Contract Development**
- Write Solidity contracts to:
  - Manage loan creation, disbursement, and repayment.
  - Handle disputes and penalties for default.

### **2. AI Model Development**
- Train AI models on financial and behavioral datasets.
- Use supervised learning to predict borrower risks.

### **3. Backend Development**
- Build API endpoints for interacting with smart contracts and AI models.
- Securely handle off-chain borrower data.

### **4. Frontend Development**
- Develop loan application forms and dashboards for lenders and borrowers.

## Installation and Setup

### **1. Clone Repository**
```bash
git clone https://github.com/abrar2030/LendSmart.git
cd LendSmart
```

### **2. Install Backend Dependencies**
```bash
cd backend
npm install
```

### **3. Install Frontend Dependencies**
```bash
cd frontend
npm install
```

### **4. Deploy Smart Contracts**
- Use tools like Truffle or Hardhat to deploy contracts to Ethereum or Polygon testnets.

### **5. Run Application**
```bash
# Start Backend
cd backend
npm start

# Start Frontend
cd frontend
npm start
```

## Example Use Cases

### **1. Borrowers**
- Submit a loan application with personal and financial details.
- Receive credit score and loan terms based on AI risk assessment.

### **2. Lenders**
- Browse loan applications and choose borrowers to fund.
- Track repayments and earnings in real-time through the dashboard.

## Testing

The project includes comprehensive testing to ensure reliability and security:

### Smart Contract Testing
- Unit tests for contract functions using Truffle/Hardhat
- Integration tests for contract interactions
- Security audits with tools like Slither and MythX

### AI Model Testing
- Model validation with cross-validation techniques
- Backtesting against historical loan data
- Performance metrics evaluation (precision, recall, F1-score)

### Backend Testing
- API endpoint tests with Jest
- Integration tests for blockchain and AI model interactions
- Load testing with Artillery

### Frontend Testing
- Component tests with React Testing Library
- End-to-end tests with Cypress
- Usability testing

To run tests:

```bash
# Smart contract tests
cd contracts
truffle test

# AI model tests
cd ai_models
python -m pytest

# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## CI/CD Pipeline

LendSmart uses GitHub Actions for continuous integration and deployment:

### Continuous Integration
- Automated testing on each pull request and push to main
- Code quality checks with ESLint, Prettier, and Pylint
- Test coverage reporting
- Security scanning for vulnerabilities

### Continuous Deployment
- Automated deployment to staging environment on merge to main
- Manual promotion to production after approval
- Smart contract verification on Etherscan
- Infrastructure updates via Terraform

Current CI/CD Status:
- Build: ![Build Status](https://img.shields.io/github/workflow/status/abrar2030/LendSmart/CI/main?label=build)
- Test Coverage: ![Coverage](https://img.shields.io/codecov/c/github/abrar2030/LendSmart/main?label=coverage)
- Smart Contract Audit: ![Audit Status](https://img.shields.io/badge/audit-passing-brightgreen)

## Contributing

We welcome contributions to improve LendSmart! Here's how you can contribute:

1. **Fork the repository**
   - Create your own copy of the project to work on

2. **Create a feature branch**
   - `git checkout -b feature/amazing-feature`
   - Use descriptive branch names that reflect the changes

3. **Make your changes**
   - Follow the coding standards and guidelines
   - Write clean, maintainable, and tested code
   - Update documentation as needed

4. **Commit your changes**
   - `git commit -m 'Add some amazing feature'`
   - Use clear and descriptive commit messages
   - Reference issue numbers when applicable

5. **Push to branch**
   - `git push origin feature/amazing-feature`

6. **Open Pull Request**
   - Provide a clear description of the changes
   - Link to any relevant issues
   - Respond to review comments and make necessary adjustments

### Development Guidelines

- Follow Solidity best practices for smart contracts
- Use ESLint and Prettier for JavaScript/React code
- Write unit tests for new features
- Update documentation for any changes
- Ensure all tests pass before submitting a pull request
- Keep pull requests focused on a single feature or fix

## Future Enhancements

1. **Global Accessibility**:
   - Support multi-currency loans for global users.
2. **Tokenized Loan Pools**:
   - Allow lenders to invest in diversified pools of loans.
3. **Social Scoring**:
   - Integrate borrower social media activity to enhance credit scoring.

## License
This project is licensed under the MIT License. See the `LICENSE` file for details.